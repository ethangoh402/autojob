// Apify client for all LinkedIn data needs — no Hunter.io required

export interface LinkedInPerson {
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  location: string;
  linkedinUrl: string;
  companyWebsite: string;
}

// ── Step 1: Find hiring manager at a company ─────────────────────────────────
// Actor: fabri-lab/linkedin-public-search-lead-extractor (~$0.001/result, no login)
export async function searchHiringManager(
  companyName: string,
  jobTitle: string,
  apifyToken: string
): Promise<LinkedInPerson | null> {
  const actorId = "fabri-lab~linkedin-public-search-lead-extractor";
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}&timeout=60`;

  const hiringRoles = buildHiringRoles(jobTitle);

  const input = {
    searchQuery: hiringRoles,
    currentCompanyUrls: [companyName],  // actor accepts company names too
    maxItems: 5,
    profileScraperMode: "Short",
    preferBuiltinSearch: false,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify people search failed (${res.status}): ${text}`);
  }

  const items: Array<Record<string, unknown>> = await res.json();
  if (!items || items.length === 0) return null;

  // Prefer decision-makers: Head > Director > VP > Manager > Recruiter
  const ranked = items.sort((a, b) => {
    const ta = String(a.headline ?? a.title ?? a.occupation ?? "");
    const tb = String(b.headline ?? b.title ?? b.occupation ?? "");
    return hiringScore(tb) - hiringScore(ta);
  });

  return normalisePerson(ranked[0], companyName);
}

// ── Search LinkedIn by title + location (for cold connect prospecting) ────────
// Reuses the same actor as searchHiringManager but searches by location instead of company
export async function searchLinkedInProspects(
  title: string,
  location: string,
  maxItems: number,
  apifyToken: string
): Promise<LinkedInPerson[]> {
  const actorId = "fabri-lab~linkedin-public-search-lead-extractor";
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}&timeout=90`;

  const input = {
    currentJobTitles: [title],
    locations: [location],
    maxItems,
    profileScraperMode: "Short",
    preferBuiltinSearch: false,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify prospect search failed (${res.status}): ${text}`);
  }

  const items: Array<Record<string, unknown>> = await res.json();
  if (!items || items.length === 0) return [];

  return items.map(item => normalisePerson(item, ""));
}

// ── Step 2: Find email from a LinkedIn profile URL ───────────────────────────
// Actor: snipercoder/bulk-linkedin-email-finder (~$0.0008/email)
export async function findEmailFromLinkedIn(
  linkedinUrl: string,
  apifyToken: string
): Promise<string | null> {
  const actorId = "snipercoder~bulk-linkedin-email-finder";
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}&timeout=60`;

  const input = {
    linkedin_url_or_ids: [linkedinUrl],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify email finder failed (${res.status}): ${text}`);
  }

  const items: Array<Record<string, unknown>> = await res.json();
  if (!items || items.length === 0) return null;

  const first = items[0];
  // Snipercoder returns "email" or "work_email" field
  const email =
    String(first.email ?? first.work_email ?? first.emailAddress ?? "").toLowerCase().trim();

  return email.includes("@") ? email : null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalisePerson(raw: Record<string, unknown>, fallbackCompany: string): LinkedInPerson {
  const name = String(raw.name ?? raw.fullName ?? `${raw.firstName ?? ""} ${raw.lastName ?? ""}`.trim());
  const [firstName, ...rest] = name.split(" ");
  return {
    name,
    firstName: firstName ?? "",
    lastName: rest.join(" "),
    title: String(raw.headline ?? raw.title ?? raw.occupation ?? raw.currentPosition ?? ""),
    company: String(raw.currentCompany ?? raw.company ?? raw.companyName ?? fallbackCompany),
    location: String(raw.location ?? raw.locationName ?? ""),
    linkedinUrl: String(raw.profileUrl ?? raw.url ?? raw.linkedinUrl ?? ""),
    companyWebsite: String(raw.companyWebsite ?? raw.website ?? raw.companyUrl ?? ""),
  };
}

function buildHiringRoles(jobTitle: string): string {
  const t = jobTitle.toLowerCase();
  if (t.includes("market")) return "Head of Marketing OR Marketing Director OR Marketing Manager";
  if (t.includes("social")) return "Social Media Manager OR Head of Social OR Content Director";
  if (t.includes("content")) return "Content Director OR Head of Content OR Content Manager";
  if (t.includes("growth")) return "Head of Growth OR Growth Director OR VP Growth";
  if (t.includes("brand")) return "Brand Manager OR Head of Brand OR Brand Director";
  if (t.includes("paid") || t.includes("performance")) return "Head of Performance Marketing OR Performance Marketing Director";
  return "HR Manager OR Talent Acquisition OR Hiring Manager OR Recruiter";
}

function hiringScore(title: string): number {
  const t = title.toLowerCase();
  if (t.includes("founder") || t.includes("co-founder")) return 5;
  if (t.includes("head of")) return 4;
  if (t.includes("director")) return 3;
  if (t.includes("vp") || t.includes("vice president")) return 3;
  if (t.includes("manager")) return 2;
  if (t.includes("recruiter") || t.includes("talent")) return 1;
  return 0;
}

// Fallback: guess patterns when Apify email finder returns nothing
export function guessEmailPatterns(domain: string, firstName: string, lastName: string): string[] {
  const f = firstName.toLowerCase().replace(/[^a-z]/g, "");
  const l = lastName.toLowerCase().replace(/[^a-z]/g, "");
  if (!f || !l) return [];
  return [
    `${f}.${l}@${domain}`,
    `${f}${l}@${domain}`,
    `${f}@${domain}`,
    `${f[0]}${l}@${domain}`,
  ];
}

export function extractDomain(websiteOrDomain: string): string {
  try {
    const url = websiteOrDomain.startsWith("http")
      ? new URL(websiteOrDomain)
      : new URL(`https://${websiteOrDomain}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return websiteOrDomain.replace(/^www\./, "");
  }
}
