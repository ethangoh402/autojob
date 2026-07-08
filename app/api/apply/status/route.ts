import { NextRequest, NextResponse } from "next/server";
import { updateApplicationStatus } from "@/lib/sheets";

export interface ApplyStatusRequest {
  jobUrl?: string;
  applyUrl?: string;
  company?: string;
  jobTitle?: string;
  status: "Submitted" | "Failed";
  notes?: string;
}

// Called by the Chrome extension's content script after it fills (and, per
// user settings, submits) a job application form on a company's ATS page.
export async function POST(req: NextRequest) {
  try {
    const body: ApplyStatusRequest = await req.json();
    if (!body.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    const appsScriptToken = process.env.APPS_SCRIPT_TOKEN;
    if (!appsScriptUrl || !appsScriptToken) {
      return NextResponse.json({ error: "APPS_SCRIPT_URL/APPS_SCRIPT_TOKEN not configured" }, { status: 500 });
    }

    await updateApplicationStatus({
      jobUrl: body.jobUrl,
      applyUrl: body.applyUrl,
      company: body.company,
      jobTitle: body.jobTitle,
      status: body.status,
      notes: body.notes,
      appsScriptUrl,
      appsScriptToken,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
