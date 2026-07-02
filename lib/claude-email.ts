// Template-based email generator — no API key required

import { RESUME } from "./resume";

export interface EmailDraft {
  subject: string;
  body: string;
}

// Map JD keywords → Ethan's matching achievements
const ACHIEVEMENT_MAP: Array<{ keywords: string[]; achievement: string }> = [
  {
    keywords: ["google ads", "google ad", "sem", "paid search", "ppc"],
    achievement: "managing RM100,000+/month in Google Ads across 20+ accounts at a Google Premier Partner agency",
  },
  {
    keywords: ["meta ads", "facebook ads", "instagram ads", "paid social", "social ads"],
    achievement: "running Meta campaigns that generated 180 leads in one week at RM50 CPL for Bellamy Singapore",
  },
  {
    keywords: ["tiktok", "short form", "video ads", "ugc", "content creator"],
    achievement: "producing AI video ads that hit 13% CTR (industry avg 1–2%) and 10,000 impressions in 2 days",
  },
  {
    keywords: ["ai", "automation", "workflow", "n8n", "tool", "efficiency"],
    achievement: "building AI automations (n8n + Claude) that saved 4 hours/day across client accounts",
  },
  {
    keywords: ["email", "klaviyo", "crm", "lifecycle", "retention", "newsletter"],
    achievement: "cutting email production time by 70% at Pixlr AI using AI-assisted workflows",
  },
  {
    keywords: ["linkedin", "organic", "content", "social media", "b2b"],
    achievement: "driving a 21% LinkedIn engagement lift and 200 organic leads at KPMG",
  },
  {
    keywords: ["performance", "roi", "roas", "conversion", "analytics", "data"],
    achievement: "optimising performance campaigns with a data-first approach — consistently hitting KPIs across Google & Meta",
  },
  {
    keywords: ["remote", "growth", "startup", "marketing manager", "digital marketing"],
    achievement: "spanning Google Ads, Meta, TikTok, AI automation, and CRM across industries in SG and MY",
  },
];

function pickAchievements(jd: string, count = 2): string[] {
  const jdLower = jd.toLowerCase();
  const scored = ACHIEVEMENT_MAP.map((entry) => ({
    achievement: entry.achievement,
    score: entry.keywords.filter((kw) => jdLower.includes(kw)).length,
  }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked = scored.slice(0, count).map((e) => e.achievement);

  // Fill up with generic ones if not enough matches
  if (picked.length < count) {
    const fallbacks = [
      "managing six-figure ad budgets and AI automations that save hours of work daily",
      "delivering measurable results across paid media, content, and CRM",
    ];
    for (const f of fallbacks) {
      if (picked.length >= count) break;
      if (!picked.includes(f)) picked.push(f);
    }
  }

  return picked;
}

function buildSubject(companyName: string, jobTitle: string, jd: string): string {
  const jdLower = jd.toLowerCase();

  if (jdLower.includes("google ads") || jdLower.includes("paid search")) {
    return `Google Ads + AI automation — ${jobTitle} at ${companyName}`;
  }
  if (jdLower.includes("performance") || jdLower.includes("roi")) {
    return `Performance marketer with AI edge — ${companyName}`;
  }
  if (jdLower.includes("content") || jdLower.includes("social")) {
    return `13% CTR video ads + organic growth — ${jobTitle}`;
  }
  if (jdLower.includes("email") || jdLower.includes("crm")) {
    return `CRM + AI workflows for ${companyName}'s ${jobTitle} role`;
  }
  return `${jobTitle} at ${companyName} — Ethan Goh`;
}

export async function generateEmail(params: {
  hiringManagerName: string;
  hiringManagerTitle: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  jobUrl?: string;
  anthropicApiKey?: string; // kept for interface compat, unused
}): Promise<EmailDraft> {
  const firstName = params.hiringManagerName.split(" ")[0] || "there";
  const achievements = pickAchievements(params.jobDescription, 2);
  const subject = buildSubject(params.companyName, params.jobTitle, params.jobDescription);

  const body = `Hi ${firstName},

I came across the ${params.jobTitle} role at ${params.companyName} and wanted to reach out directly.

I'm a digital marketing specialist with hands-on experience ${achievements[0]}${achievements[1] ? `, and ${achievements[1]}` : ""}.

Given what you're building at ${params.companyName}, I think I can contribute from day one — without a long ramp-up.

Would love 15 minutes to show you what I can bring. When works for you?

Best,
Ethan Goh
${RESUME.email}`;

  return { subject, body };
}
