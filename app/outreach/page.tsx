"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle, ExternalLink, Copy } from "lucide-react";
import type { OutreachEmailResponse } from "@/app/api/outreach/email/route";

const EMPTY_FORM = {
  jobTitle: "",
  companyName: "",
  companyDomain: "",
  jobDescription: "",
  jobUrl: "",
  hiringManagerName: "",
  hiringManagerEmail: "",
};

export default function OutreachPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OutreachEmailResponse | null>(null);
  const [fatalError, setFatalError] = useState("");
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setFatalError("");

    try {
      const res = await fetch("/api/outreach/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: form.jobTitle,
          companyName: form.companyName,
          companyDomain: form.companyDomain || form.companyName.toLowerCase().replace(/\s+/g, "") + ".com",
          jobDescription: form.jobDescription,
          jobUrl: form.jobUrl || undefined,
          hiringManagerName: form.hiringManagerName || undefined,
          hiringManagerEmail: form.hiringManagerEmail || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFatalError(data.error ?? "Request failed");
      } else {
        setResult(data as OutreachEmailResponse);
      }
    } catch (e) {
      setFatalError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, field: "subject" | "body") {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          Email Outreach
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Paste a job description → auto-find hiring manager → generate tailored email → save to Gmail drafts.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6 flex flex-col gap-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Job Details
          </h2>

          <Field label="Job Title *">
            <input
              required
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              placeholder="Performance Marketing Manager"
              className="input-field"
            />
          </Field>

          <Field label="Company Name *">
            <input
              required
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="Stripe"
              className="input-field"
            />
          </Field>

          <Field label="Company Domain">
            <input
              value={form.companyDomain}
              onChange={(e) => setForm({ ...form, companyDomain: e.target.value })}
              placeholder="stripe.com (guessed if blank)"
              className="input-field"
            />
          </Field>

          <Field label="Job URL (optional)">
            <input
              value={form.jobUrl}
              onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
              placeholder="https://..."
              className="input-field"
            />
          </Field>

          <Field label="Job Description *">
            <textarea
              required
              value={form.jobDescription}
              onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
              placeholder="Paste the full job description here…"
              rows={6}
              className="input-field resize-none"
            />
          </Field>

          <div
            className="rounded-lg p-4 flex flex-col gap-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
              Skip auto-search (optional — fill if you already know)
            </p>
            <Field label="Hiring Manager Name">
              <input
                value={form.hiringManagerName}
                onChange={(e) => setForm({ ...form, hiringManagerName: e.target.value })}
                placeholder="Jane Smith"
                className="input-field"
              />
            </Field>
            <Field label="Hiring Manager Email">
              <input
                value={form.hiringManagerEmail}
                onChange={(e) => setForm({ ...form, hiringManagerEmail: e.target.value })}
                placeholder="jane@stripe.com"
                className="input-field"
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Running pipeline…
              </>
            ) : (
              <>
                <Send size={15} />
                Find Manager · Generate Email · Draft
              </>
            )}
          </button>
        </form>

        {/* Results */}
        <div className="flex flex-col gap-4">
          {fatalError && (
            <div
              className="rounded-xl p-5 flex gap-3"
              style={{ background: "#ef444420", border: "1px solid #ef444440" }}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "#ef4444" }}>
                  Error
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  {fatalError}
                </p>
              </div>
            </div>
          )}

          {result && (
            <>
              {/* Hiring Manager */}
              <div
                className="rounded-xl p-5"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={15} style={{ color: "#22c55e" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    Hiring Manager Found
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Row label="Name" value={result.hiringManager.name || "—"} />
                  <Row label="Title" value={result.hiringManager.title || "—"} />
                  <Row
                    label="Email"
                    value={result.hiringManager.email || "Not found"}
                  />
                  {result.hiringManager.linkedinUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        LinkedIn
                      </span>
                      <a
                        href={result.hiringManager.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--accent)" }}
                      >
                        View profile <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Preview */}
              <div
                className="rounded-xl p-5"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    Generated Email
                  </span>
                  {result.email.draftId && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "#22c55e20", color: "#22c55e" }}
                    >
                      Saved to Gmail Drafts
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                        Subject
                      </span>
                      <button
                        onClick={() => copy(result.email.subject, "subject")}
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--accent)" }}
                      >
                        <Copy size={11} />
                        {copied === "subject" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div
                      className="rounded-lg px-3 py-2 text-sm"
                      style={{ background: "var(--surface)", color: "var(--text)" }}
                    >
                      {result.email.subject}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                        Body
                      </span>
                      <button
                        onClick={() => copy(result.email.body, "body")}
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--accent)" }}
                      >
                        <Copy size={11} />
                        {copied === "body" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div
                      className="rounded-lg px-3 py-2 text-sm whitespace-pre-wrap font-mono text-xs leading-relaxed"
                      style={{ background: "var(--surface)", color: "var(--text)" }}
                    >
                      {result.email.body}
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {result.errors.length > 0 && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: "#f59e0b10", border: "1px solid #f59e0b30" }}
                >
                  <p className="text-xs font-medium mb-2" style={{ color: "#f59e0b" }}>
                    Warnings
                  </p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs" style={{ color: "var(--muted)" }}>
                      • {e}
                    </p>
                  ))}
                </div>
              )}

              {result.sheetsUpdated && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: "#22c55e10", border: "1px solid #22c55e30" }}
                >
                  <p className="text-xs" style={{ color: "#22c55e" }}>
                    ✓ Google Sheets updated
                  </p>
                </div>
              )}
            </>
          )}

          {!result && !fatalError && !loading && (
            <div
              className="rounded-xl p-10 text-center"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}
            >
              <Send size={24} className="mx-auto mb-3 opacity-30" />
              <p className="text-xs">Fill in the job details and hit the button to run the full pipeline.</p>
              <p className="text-xs mt-1 opacity-60">Apify (LinkedIn search + email) → Claude → Gmail Drafts → Sheets</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}
