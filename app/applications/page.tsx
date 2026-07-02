"use client";

import { useState } from "react";
import { Briefcase, ExternalLink, Link2, X, MapPin, Building2, Tag, Calendar, User } from "lucide-react";

type Stage = "found" | "outreach_sent" | "replied" | "interviewing" | "offer" | "rejected";

type Application = {
  id: number;
  job_title: string;
  company: string;
  country: string;
  source: string;
  stage: Stage;
  job_url: string;
  contact_name?: string;
  contact_linkedin_url?: string;
  description?: string;
  employment_type?: string;
  seniority?: string;
  posted_at?: string;
  applicants?: string;
  last_activity_at: string | null;
};

const STAGES: { key: Stage; label: string; color: string; bg: string }[] = [
  { key: "found",         label: "Found",         color: "#64748b", bg: "#64748b15" },
  { key: "outreach_sent", label: "Outreach Sent",  color: "#6366f1", bg: "#6366f115" },
  { key: "replied",       label: "Replied",        color: "#f59e0b", bg: "#f59e0b15" },
  { key: "interviewing",  label: "Interviewing",   color: "#a855f7", bg: "#a855f715" },
  { key: "offer",         label: "Offer",          color: "#22c55e", bg: "#22c55e15" },
  { key: "rejected",      label: "Rejected",       color: "#ef4444", bg: "#ef444415" },
];

const SOURCE_LABELS: Record<string, string> = {
  linkedin_job: "LI Job",
  linkedin_dm:  "LI DM",
  instagram:    "IG",
  agency:       "Agency",
};

const MOCK_APPS: Application[] = [];

export default function ApplicationsPage() {
  const [selected, setSelected] = useState<Application | null>(null);
  const byStage = (stage: Stage) => MOCK_APPS.filter((a) => a.stage === stage);
  const selectedStage = STAGES.find((s) => s.key === selected?.stage);

  return (
    <div className="flex h-full">
      {/* Kanban */}
      <div className="flex-1 p-8 overflow-x-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Applications</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>CRM pipeline — click a card to view details</p>
        </div>

        <div className="flex gap-4 pb-4" style={{ minWidth: "max-content" }}>
          {STAGES.map(({ key, label, color, bg }) => {
            const cards = byStage(key);
            return (
              <div key={key} className="w-60 flex flex-col gap-3">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: bg, border: `1px solid ${color}30` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                  </div>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{ background: `${color}25`, color }}>{cards.length}</span>
                </div>

                <div className="flex flex-col gap-2">
                  {cards.length === 0 ? (
                    <div className="rounded-lg px-3 py-6 text-center text-xs" style={{ border: "1px dashed var(--border)", color: "var(--border)" }}>Empty</div>
                  ) : (
                    cards.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => setSelected(app)}
                        className="rounded-xl p-4 flex flex-col gap-2 cursor-pointer transition-all hover:translate-y-[-1px]"
                        style={{
                          background: selected?.id === app.id ? "#6366f120" : "var(--card)",
                          border: selected?.id === app.id ? "1px solid #6366f1" : "1px solid var(--border)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium leading-tight" style={{ color: "var(--text)" }}>{app.job_title}</div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {app.contact_linkedin_url && (
                              <a href={app.contact_linkedin_url} target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()} title="View hiring manager"
                                className="flex items-center justify-center w-6 h-6 rounded"
                                style={{ background: "#0a66c215", color: "#0a66c2" }}>
                                <Link2 size={11} />
                              </a>
                            )}
                            {app.job_url && (
                              <a href={app.job_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <ExternalLink size={12} style={{ color: "var(--muted)" }} />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="text-xs" style={{ color: "var(--muted)" }}>{app.company}</div>
                        {app.contact_name && <div className="text-xs" style={{ color: "#6366f1" }}>{app.contact_name}</div>}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface)", color: "var(--muted)" }}>
                            {SOURCE_LABELS[app.source] ?? app.source}
                          </span>
                          <span className="text-xs" style={{ color: "var(--muted)" }}>{app.country}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {MOCK_APPS.length === 0 && (
          <div className="mt-8 rounded-xl p-10 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <Briefcase size={36} className="mx-auto mb-3" style={{ color: "var(--border)" }} />
            <div className="text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>No applications yet</div>
            <div className="text-xs" style={{ color: "var(--border)" }}>
              Ask Claude to scrape jobs — results will appear here automatically.
            </div>
          </div>
        )}
      </div>

      {/* Right panel */}
      {selected && (
        <div className="w-80 shrink-0 border-l flex flex-col overflow-y-auto"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Job Details</span>
            <button onClick={() => setSelected(null)} className="p-1 rounded" style={{ color: "var(--muted)" }}>
              <X size={16} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5">
            {/* Title + stage */}
            <div>
              <div className="text-lg font-bold mb-1 leading-tight" style={{ color: "var(--text)" }}>{selected.job_title}</div>
              {selectedStage && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: selectedStage.bg, color: selectedStage.color }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: selectedStage.color }} />
                  {selectedStage.label}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-col gap-2.5">
              {[
                { icon: Building2, label: selected.company },
                { icon: MapPin, label: selected.country },
                { icon: Tag, label: SOURCE_LABELS[selected.source] ?? selected.source },
                { icon: Calendar, label: selected.posted_at ?? "Unknown date" },
                { icon: User, label: selected.contact_name ?? "No contact linked" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--muted)" }}>
                  <Icon size={13} className="shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {selected.job_url && (
                <a href={selected.job_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "var(--accent)", color: "#fff" }}>
                  <ExternalLink size={14} /> View Job
                </a>
              )}
              {selected.contact_linkedin_url && (
                <a href={selected.contact_linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "#0a66c220", color: "#0a66c2", border: "1px solid #0a66c230" }}>
                  <Link2 size={14} /> View Hiring Manager
                </a>
              )}
            </div>

            {/* Stage changer */}
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>Move to stage</div>
              <div className="flex flex-col gap-1.5">
                {STAGES.map(({ key, label, color }) => (
                  <button key={key}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all"
                    style={{
                      background: selected.stage === key ? `${color}20` : "var(--card)",
                      border: selected.stage === key ? `1px solid ${color}50` : "1px solid var(--border)",
                      color: selected.stage === key ? color : "var(--muted)",
                    }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            {selected.description && (
              <div>
                <div className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>Description</div>
                <div className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  {selected.description.slice(0, 400)}...
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
