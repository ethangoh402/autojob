// Claude-powered job description parsing + application tailoring.
import Anthropic from "@anthropic-ai/sdk";
import { RESUME } from "./resume";

const MODEL = "claude-sonnet-5";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

export interface JobPosting {
  company: string;
  jobTitle: string;
  location: string;
  jobUrl: string;
  applyUrl: string;
  description: string;
  requirements: string[];
}

function extractJson<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON object found in Claude response: ${text.slice(0, 200)}`);
  return JSON.parse(match[0]) as T;
}

const JOB_POSTING_SCHEMA_HINT = `Return ONLY a JSON object (no markdown fences, no commentary) with this exact shape:
{
  "company": string,
  "jobTitle": string,
  "location": string,
  "applyUrl": string,   // best guess at the URL to apply, or "" if unknown
  "description": string,   // the full job description text, cleaned up
  "requirements": string[] // bullet list of key requirements / must-haves
}`;

export async function parseJobPostingFromText(params: { text: string; sourceUrl?: string }): Promise<JobPosting> {
  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Extract structured job posting data from the page content below.\n\n${JOB_POSTING_SCHEMA_HINT}\n\n--- PAGE CONTENT ---\n${params.text.slice(0, 20000)}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Claude returned no text content");

  const parsed = extractJson<Omit<JobPosting, "jobUrl">>(textBlock.text);
  return { ...parsed, jobUrl: params.sourceUrl ?? "" };
}

export async function parseJobPostingFromImage(params: {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}): Promise<JobPosting> {
  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: params.mediaType, data: params.imageBase64 },
          },
          {
            type: "text",
            text: `This is a screenshot of a job posting. Extract structured data from it.\n\n${JOB_POSTING_SCHEMA_HINT}`,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Claude returned no text content");

  const parsed = extractJson<Omit<JobPosting, "jobUrl">>(textBlock.text);
  return { ...parsed, jobUrl: "" };
}

export interface TailoredResume {
  headline: string; // e.g. "Performance Marketing & Social Media Specialist"
  summary: string;
  skills: string[]; // flattened, JD-ranked, most relevant first
  experience: Array<{ company: string; role: string; period: string; highlights: string[] }>;
}

export interface TailoredApplication {
  resume: TailoredResume;
  coverLetterText: string;
}

const TAILOR_SCHEMA_HINT = `Return ONLY a JSON object (no markdown fences, no commentary) with this exact shape:
{
  "resume": {
    "headline": string,
    "summary": string,           // 2-3 sentences, rewritten to speak directly to this JD
    "skills": string[],          // reordered/filtered from the candidate's real skills, most JD-relevant first
    "experience": [
      { "company": string, "role": string, "period": string, "highlights": string[] }
    ]
  },
  "coverLetterText": string       // full cover letter body, 3-4 short paragraphs, no placeholders
}`;

export async function tailorApplication(params: { job: JobPosting }): Promise<TailoredApplication> {
  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are tailoring a real candidate's resume and writing a cover letter for a specific job. Do NOT invent experience, skills, employers, or numbers that aren't in the candidate data below — only reorder, re-emphasize, and rephrase what's real to match the job.

CANDIDATE DATA:
${JSON.stringify(RESUME, null, 2)}

JOB POSTING:
Company: ${params.job.company}
Title: ${params.job.jobTitle}
Location: ${params.job.location}
Description: ${params.job.description}
Requirements: ${params.job.requirements.join("; ")}

${TAILOR_SCHEMA_HINT}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Claude returned no text content");

  return extractJson<TailoredApplication>(textBlock.text);
}
