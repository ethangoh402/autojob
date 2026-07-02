import { NextRequest, NextResponse } from "next/server";
import { searchLinkedInProspects, findEmailFromLinkedIn } from "@/lib/apify";
import { appendLinkedInConnect, LinkedInConnectRow } from "@/lib/sheets";

const HM_TITLES = [
  "Head of Marketing",
  "Marketing Manager",
  "Senior Marketing Manager",
  "Director of Marketing",
  "VP Marketing",
  "HR Manager",
  "Talent Acquisition Manager",
  "People and Culture Manager",
];

const CEO_TITLES = [
  "CEO",
  "Founder",
  "Co-Founder",
  "Managing Director",
];

export interface LinkedInSearchRequest {
  type: "hm" | "ceo";
  location: "Singapore" | "United Kingdom" | "Australia";
  count: number;
}

export interface LinkedInSearchResponse {
  found: number;
  emailsFound: number;
  prospects: Array<{
    name: string;
    title: string;
    company: string;
    location: string;
    linkedinUrl: string;
    email: string;
    emailSource: string;
  }>;
  errors: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body: LinkedInSearchRequest = await req.json();
    const { type, location, count } = body;

    if (!type || !location || !count) {
      return NextResponse.json(
        { error: "Missing required fields: type, location, count" },
        { status: 400 }
      );
    }

    const apifyToken      = process.env.APIFY_TOKEN!;
    const appsScriptUrl   = process.env.APPS_SCRIPT_URL!;
    const appsScriptToken = process.env.APPS_SCRIPT_TOKEN!;

    const titles  = type === "ceo" ? CEO_TITLES : HM_TITLES;
    const errors: string[] = [];
    const allProspects: Awaited<ReturnType<typeof searchLinkedInProspects>> = [];

    // Pull from each title until we hit the requested count
    for (const title of titles) {
      if (allProspects.length >= count) break;
      try {
        const needed  = count - allProspects.length;
        const results = await searchLinkedInProspects(title, location, needed, apifyToken);
        allProspects.push(...results.slice(0, needed));
      } catch (err) {
        errors.push(`Search "${title}" in ${location}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Find emails + log each prospect to the sheet
    let emailsFound = 0;
    const logged: LinkedInSearchResponse["prospects"] = [];

    for (const person of allProspects) {
      let email       = "";
      let emailSource = "Not found";

      if (person.linkedinUrl) {
        try {
          const found = await findEmailFromLinkedIn(person.linkedinUrl, apifyToken);
          if (found) {
            email       = found;
            emailSource = "LinkedIn";
            emailsFound++;
          }
        } catch (err) {
          errors.push(`Email lookup for ${person.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      const row: LinkedInConnectRow = {
        contactType:    type,
        dateAdded:      new Date().toISOString().slice(0, 10),
        firstName:      person.firstName,
        lastName:       person.lastName,
        title:          person.title,
        company:        person.company,
        location:       person.location || location,
        linkedinUrl:    person.linkedinUrl,
        companyWebsite: person.companyWebsite,
        email,
        emailSource,
        connectStatus:  "Pending",
        dateAccepted:   "",
        emailSent:      "No",
        reply:          "",
        notes:          "",
      };

      try {
        await appendLinkedInConnect({ row, appsScriptUrl, appsScriptToken });
        logged.push({ name: person.name, title: person.title, company: person.company, location: person.location || location, linkedinUrl: person.linkedinUrl, email, emailSource });
      } catch (err) {
        errors.push(`Sheet log for ${person.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({
      found: logged.length,
      emailsFound,
      prospects: logged,
      errors,
    } satisfies LinkedInSearchResponse);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
