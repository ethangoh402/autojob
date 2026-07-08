import { NextRequest, NextResponse } from "next/server";
import { parseJobPostingFromText, parseJobPostingFromImage } from "@/lib/anthropic";
import { htmlToText } from "@/lib/html";

export interface JobParseRequest {
  url?: string;
  imageBase64?: string;
  imageMediaType?: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}

const BLOCKED_HOSTS = new Set(["localhost", "0.0.0.0", "169.254.169.254", "metadata.google.internal"]);

function isPrivateHost(hostname: string): boolean {
  if (BLOCKED_HOSTS.has(hostname.toLowerCase())) return true;
  if (hostname === "::1") return true;
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body: JobParseRequest = await req.json();

    if (body.imageBase64) {
      const job = await parseJobPostingFromImage({
        imageBase64: body.imageBase64,
        mediaType: body.imageMediaType ?? "image/png",
      });
      return NextResponse.json({ job });
    }

    if (body.url) {
      let parsed: URL;
      try {
        parsed = new URL(body.url);
      } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }
      if (!["http:", "https:"].includes(parsed.protocol) || isPrivateHost(parsed.hostname)) {
        return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
      }

      const res = await fetch(parsed.toString(), {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AutoJobBot/1.0)" },
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        return NextResponse.json({ error: `Fetch failed (${res.status})` }, { status: 502 });
      }
      const html = await res.text();
      const text = htmlToText(html);

      const job = await parseJobPostingFromText({ text, sourceUrl: parsed.toString() });
      return NextResponse.json({ job });
    }

    return NextResponse.json({ error: "Provide either url or imageBase64" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
