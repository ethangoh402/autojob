import { NextRequest, NextResponse } from "next/server";

type Contact = {
  linkedinUrl: string;
  name: string;
  title: string;
  company: string;
  location: string;
  email?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { contacts }: { contacts: Contact[] } = await req.json();
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: "contacts array is required" }, { status: 400 });
    }

    // TODO: replace with D1 binding once wrangler is configured
    // const db = (process.env as any).DB as D1Database;
    // for (const c of contacts) {
    //   await db.prepare(`
    //     INSERT OR IGNORE INTO contacts (linkedin_url, name, title, company, location, email)
    //     VALUES (?, ?, ?, ?, ?, ?)
    //   `).bind(c.linkedinUrl, c.name, c.title, c.company, c.location, c.email ?? null).run();
    // }

    console.log(`Received ${contacts.length} contacts from scraper`);
    return NextResponse.json({ saved: contacts.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
