import { NextRequest, NextResponse } from "next/server";
import { searchHiringManager, findEmailFromLinkedIn, guessEmailPatterns, extractDomain } from "@/lib/apify";
import { generateEmail } from "@/lib/claude-email";
import { sendViaAppsScript } from "@/lib/gmail";
import { appendOutreachRow } from "@/lib/sheets";

export interface OutreachEmailRequest {
  jobTitle: string;
  companyName: string;
  companyDomain: string;       // e.g. "stripe.com" or "https://stripe.com"
  jobDescription: string;
  jobUrl?: string;
  hiringManagerName?: string;  // optional — skip Apify search if provided
  hiringManagerEmail?: string; // optional — skip Apify email finder if provided
}

export interface OutreachEmailResponse {
  success: boolean;
  hiringManager: {
    name: string;
    title: string;
    email: string;
    linkedinUrl: string;
  };
  email: {
    subject: string;
    body: string;
    draftId: string;
  };
  sheetsUpdated: boolean;
  errors: string[];
}

export async function POST(req: NextRequest) {
  const errors: string[] = [];

  try {
    const body: OutreachEmailRequest = await req.json();

    if (!body.jobTitle || !body.companyName || !body.jobDescription) {
      return NextResponse.json(
        { error: "jobTitle, companyName, and jobDescription are required" },
        { status: 400 }
      );
    }

    const env = process.env;
    const missingKeys = checkEnvVars(env);
    if (missingKeys.length) {
      return NextResponse.json(
        { error: `Missing environment variables: ${missingKeys.join(", ")}` },
        { status: 500 }
      );
    }

    // ── Step 1: Find hiring manager via Apify LinkedIn search ────────────────
    let hiringManager = {
      name: body.hiringManagerName ?? "",
      firstName: "",
      lastName: "",
      title: "",
      linkedinUrl: "",
    };

    if (!body.hiringManagerName) {
      console.log(`[outreach] Searching Apify for hiring manager at ${body.companyName}…`);
      try {
        const found = await searchHiringManager(body.companyName, body.jobTitle, env.APIFY_TOKEN!);
        if (found) {
          hiringManager = found;
          console.log(`[outreach] Found: ${found.name} (${found.title})`);
        } else {
          errors.push("Apify LinkedIn search returned no results — proceeding without hiring manager name");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Apify LinkedIn search failed: ${msg}`);
        console.warn("[outreach] Apify search error:", msg);
      }
    } else {
      const parts = body.hiringManagerName.split(" ");
      hiringManager.firstName = parts[0] ?? "";
      hiringManager.lastName = parts.slice(1).join(" ");
    }

    // ── Step 2: Find email via Apify email finder ────────────────────────────
    let emailAddress = body.hiringManagerEmail ?? "";

    if (!emailAddress) {
      if (hiringManager.linkedinUrl) {
        console.log(`[outreach] Looking up email via Apify for ${hiringManager.linkedinUrl}…`);
        try {
          const found = await findEmailFromLinkedIn(hiringManager.linkedinUrl, env.APIFY_TOKEN!);
          if (found) {
            emailAddress = found;
            console.log(`[outreach] Email found: ${emailAddress}`);
          } else {
            errors.push("Apify email finder returned no email — trying domain pattern fallback");
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`Apify email finder failed: ${msg}`);
          console.warn("[outreach] Apify email error:", msg);
        }
      }

      // Fallback: guess from domain + name
      if (!emailAddress && hiringManager.firstName && body.companyDomain) {
        const domain = extractDomain(body.companyDomain);
        const guesses = guessEmailPatterns(domain, hiringManager.firstName, hiringManager.lastName);
        if (guesses.length) {
          emailAddress = guesses[0];
          errors.push(`Using guessed email pattern (unverified): ${emailAddress}`);
        }
      }

      if (!emailAddress) {
        errors.push("Could not determine hiring manager email");
      }
    }

    // ── Step 3: Generate tailored email via Claude ───────────────────────────
    console.log(`[outreach] Generating personalised email…`);
    const draft = await generateEmail({
      hiringManagerName: hiringManager.name || "Hiring Manager",
      hiringManagerTitle: hiringManager.title,
      companyName: body.companyName,
      jobTitle: body.jobTitle,
      jobDescription: body.jobDescription,
      jobUrl: body.jobUrl,
    });
    console.log(`[outreach] Subject: ${draft.subject}`);

    // ── Step 4: Send via Apps Script (creates draft in ethan09.goh@gmail.com) ─
    let draftId = "";
    if (emailAddress) {
      console.log(`[outreach] Sending via Apps Script to ${emailAddress}…`);
      try {
        const result = await sendViaAppsScript({
          to: emailAddress,
          subject: draft.subject,
          body: draft.body,
          appsScriptUrl: env.APPS_SCRIPT_URL!,
          appsScriptToken: env.APPS_SCRIPT_TOKEN!,
          mode: "draft",
        });
        draftId = result.draftId;
        console.log(`[outreach] Draft created: ${draftId}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Apps Script failed: ${msg}`);
        console.warn("[outreach] Apps Script error:", msg);
      }
    } else {
      errors.push("No email address found — Gmail draft skipped");
    }

    // ── Step 5: Log to Google Sheets via Apps Script ─────────────────────────
    let sheetsUpdated = false;
    try {
      await appendOutreachRow({
        appsScriptUrl: env.APPS_SCRIPT_URL!,
        appsScriptToken: env.APPS_SCRIPT_TOKEN!,
        row: {
          date: new Date().toISOString().slice(0, 10),
          company: body.companyName,
          jobTitle: body.jobTitle,
          hiringManagerName: hiringManager.name,
          hiringManagerTitle: hiringManager.title,
          hiringManagerEmail: emailAddress,
          linkedinUrl: hiringManager.linkedinUrl,
          emailSubject: draft.subject,
          gmailDraftId: draftId,
          status: draftId ? "Draft created" : "Email missing",
          notes: errors.length ? errors.join("; ") : "",
        },
      });
      sheetsUpdated = true;
      console.log("[outreach] Google Sheets updated");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Sheets update failed: ${msg}`);
      console.warn("[outreach] Sheets error:", msg);
    }

    const response: OutreachEmailResponse = {
      success: true,
      hiringManager: {
        name: hiringManager.name,
        title: hiringManager.title,
        email: emailAddress,
        linkedinUrl: hiringManager.linkedinUrl,
      },
      email: {
        subject: draft.subject,
        body: draft.body,
        draftId,
      },
      sheetsUpdated,
      errors,
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[outreach] Fatal:", message);
    return NextResponse.json({ error: message, errors }, { status: 500 });
  }
}

function checkEnvVars(env: NodeJS.ProcessEnv): string[] {
  const required = [
    "APIFY_TOKEN",
    "APPS_SCRIPT_URL",
    "APPS_SCRIPT_TOKEN",
  ];
  return required.filter((k) => !env[k]);
}
