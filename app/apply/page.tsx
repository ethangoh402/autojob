"use client";

import { useRef, useState } from "react";
import { Link2, Image as ImageIcon, Loader2, FileText, Mail, Download, CheckCircle2, AlertCircle, Puzzle } from "lucide-react";
import type { JobPosting, TailoredResume } from "@/lib/anthropic";

type TailorResult = {
  job: JobPosting;
  resume: TailoredResume;
  resumePdfBase64: string;
  coverLetterText: string;
  coverLetterPdfBase64: string;
  applicant: { name: string; email: string; phone: string };
};

function base64ToBlobUrl(base64: string, mime: string): string {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return URL.createObjectURL(new Blob([arr], { type: mime }));
}

export default function ApplyPage() {
  const [url, setUrl] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<"image/jpeg" | "image/png" | "image/webp" | "image/gif">("image/png");

  const [job, setJob] = useState<JobPosting | null>(null);
  const [result, setResult] = useState<TailorResult | null>(null);

  const [parsing, setParsing] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushedToExtension, setPushedToExtension] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [, base64] = dataUrl.split(",");
      setImageBase64(base64);
      setImagePreview(dataUrl);
      setImageMediaType((file.type as typeof imageMediaType) || "image/png");
    };
    reader.readAsDataURL(file);
  }

  async function handleParse() {
    setError(null);
    setJob(null);
    setResult(null);
    setPushedToExtension(false);
    setParsing(true);
    try {
      const res = await fetch("/api/jobs/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imageBase64 ? { imageBase64, imageMediaType } : { url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse job posting");
      setJob(data.job as JobPosting);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setParsing(false);
    }
  }

  async function handleTailor() {
    if (!job) return;
    setError(null);
    setTailoring(true);
    try {
      const res = await fetch("/api/jobs/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate tailored application");
      setResult(data as TailorResult);

      // Hand the package to the AutoJob Chrome extension (if installed) via a
      // postMessage bridge — a content script on this page's origin relays it
      // into extension storage so the apply-form filler can pick it up.
      window.postMessage({ source: "autojob-web", type: "AUTOJOB_PACKAGE", payload: data }, window.location.origin);
      setPushedToExtension(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setTailoring(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Apply</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Paste a job link or drop a screenshot — get a tailored resume + cover letter, ready for the AutoJob Chrome extension to auto-apply.
        </p>
      </div>

      {/* Input */}
      <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <Link2 size={14} style={{ color: "var(--muted)" }} />
          <input
            type="url"
            placeholder="https://company.com/careers/senior-marketer"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setImageBase64(null); setImagePreview(null); }}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>

        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--border)" }}>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          or
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <ImageIcon size={14} /> Upload screenshot
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          {imagePreview && (

            <img src={imagePreview} alt="Screenshot preview" className="h-12 rounded border" style={{ borderColor: "var(--border)" }} />
          )}
        </div>

        <button
          onClick={handleParse}
          disabled={parsing || (!url && !imageBase64)}
          className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {parsing ? <Loader2 size={14} className="animate-spin" /> : null}
          {parsing ? "Reading job posting…" : "Analyze job posting"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm" style={{ background: "#ef444415", color: "#ef4444" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Parsed JD */}
      {job && (
        <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{job.jobTitle} — {job.company}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{job.location}</div>
            </div>
            <button
              onClick={handleTailor}
              disabled={tailoring}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {tailoring ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              {tailoring ? "Tailoring…" : "Generate resume + cover letter"}
            </button>
          </div>
          <div className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{job.description.slice(0, 500)}{job.description.length > 500 ? "…" : ""}</div>
          {job.requirements.length > 0 && (
            <ul className="text-xs list-disc pl-4 flex flex-col gap-1" style={{ color: "var(--muted)" }}>
              {job.requirements.slice(0, 6).map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Tailored output */}
      {result && (
        <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
            <CheckCircle2 size={16} style={{ color: "#22c55e" }} /> Application package ready
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              download={`resume-${result.job.company}.pdf`}
              href={base64ToBlobUrl(result.resumePdfBase64, "application/pdf")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              <Download size={12} /> Download resume PDF
            </a>
            <a
              download={`cover-letter-${result.job.company}.pdf`}
              href={base64ToBlobUrl(result.coverLetterPdfBase64, "application/pdf")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              <Mail size={12} /> Download cover letter PDF
            </a>
          </div>

          <div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Resume summary</div>
            <div className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>{result.resume.summary}</div>
          </div>

          <div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Cover letter</div>
            <div className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text)" }}>{result.coverLetterText}</div>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
            style={{ background: pushedToExtension ? "#22c55e15" : "#f59e0b15", color: pushedToExtension ? "#22c55e" : "#f59e0b" }}
          >
            <Puzzle size={14} />
            {pushedToExtension
              ? "Sent to the AutoJob Chrome extension — open the company's application form and it will auto-fill and submit."
              : "Install the AutoJob Chrome extension (see extension/README.md) so it can pick this package up automatically."}
          </div>
        </div>
      )}
    </div>
  );
}
