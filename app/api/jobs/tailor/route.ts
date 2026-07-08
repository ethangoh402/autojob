import { NextRequest, NextResponse } from "next/server";
import { tailorApplication, JobPosting } from "@/lib/anthropic";
import { renderResumePdf, renderCoverLetterPdf, toBase64 } from "@/lib/pdf";
import { appendApplicationRow } from "@/lib/sheets";
import { RESUME } from "@/lib/resume";

export interface JobTailorRequest {
  job: JobPosting;
}

export async function POST(req: NextRequest) {
  try {
    const body: JobTailorRequest = await req.json();
    const job = body.job;
    if (!job || !job.company || !job.jobTitle) {
      return NextResponse.json({ error: "job.company and job.jobTitle are required" }, { status: 400 });
    }

    const { resume, coverLetterText } = await tailorApplication({ job });

    const resumePdfBase64 = toBase64(renderResumePdf(resume));
    const coverLetterPdfBase64 = toBase64(
      renderCoverLetterPdf({ coverLetterText, companyName: job.company, jobTitle: job.jobTitle })
    );

    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    const appsScriptToken = process.env.APPS_SCRIPT_TOKEN;
    if (appsScriptUrl && appsScriptToken) {
      try {
        await appendApplicationRow({
          appsScriptUrl,
          appsScriptToken,
          row: {
            dateAdded: new Date().toISOString().slice(0, 10),
            company: job.company,
            jobTitle: job.jobTitle,
            location: job.location,
            jobUrl: job.jobUrl,
            applyUrl: job.applyUrl || job.jobUrl,
            stage: "found",
            resumeGenerated: true,
            coverLetterGenerated: true,
            applyStatus: "Pending",
            appliedAt: "",
            notes: "",
          },
        });
      } catch {
        // Sheet logging is best-effort — don't fail the whole request over it.
      }
    }

    return NextResponse.json({
      job,
      resume,
      resumePdfBase64,
      coverLetterText,
      coverLetterPdfBase64,
      applicant: { name: RESUME.name, email: RESUME.email, phone: RESUME.phone },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
