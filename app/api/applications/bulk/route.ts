import { NextRequest, NextResponse } from "next/server";

type Job = {
  jobUrl: string;
  title: string;
  company: string;
  location: string;
  postedAt?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { applications, source }: { applications: Job[]; source: string } = await req.json();
    if (!Array.isArray(applications) || applications.length === 0) {
      return NextResponse.json({ error: "applications array is required" }, { status: 400 });
    }

    // TODO: replace with D1 binding once wrangler is configured
    // const db = (process.env as any).DB as D1Database;
    // for (const j of applications) {
    //   await db.prepare(`
    //     INSERT OR IGNORE INTO applications (job_url, job_title, company, country, source, stage)
    //     VALUES (?, ?, ?, ?, ?, 'found')
    //   `).bind(j.jobUrl, j.title, j.company, j.location, source).run();
    // }

    console.log(`Received ${applications.length} jobs from scraper (source: ${source})`);
    return NextResponse.json({ saved: applications.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
