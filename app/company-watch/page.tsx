"use client";

import { useState } from "react";
import { Building2, ExternalLink, X, MapPin, Briefcase, Tag, Calendar, Search } from "lucide-react";
import jobsData from "@/data/company-jobs.json";

type Job = {
  company: string;
  careers_url: string;
  job_title: string;
  job_url: string;
  type: string;
  location: string;
  department: string;
  found_at: string;
};

const DEPT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  project_management: { label: "Project Mgmt", color: "#a855f7", bg: "#a855f715" },
  marketing:          { label: "Marketing",     color: "#6366f1", bg: "#6366f115" },
  admin:              { label: "Admin",          color: "#f59e0b", bg: "#f59e0b15" },
  coordinator:        { label: "Coordinator",    color: "#22c55e", bg: "#22c55e15" },
  content:            { label: "Content",        color: "#ec4899", bg: "#ec489915" },
  other:              { label: "Other",          color: "#64748b", bg: "#64748b15" },
};

const TYPE_COLORS: Record<string, string> = {
  "Full Time": "#22c55e",
  "Contract":  "#f59e0b",
  "Part Time": "#64748b",
};

const jobs: Job[] = jobsData as Job[];
const companies = [...new Set(jobs.map((j) => j.company))];

export default function CompanyWatchPage() {
  const [selected, setSelected] = useState<Job | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = jobs.filter((j) => {
    const matchesDept = filter === "all" || j.department === filter;
    const matchesSearch =
      !search ||
      j.job_title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const depts = ["all", ...Object.keys(DEPT_LABELS)];

  return (
    <div className="flex h-full">
      {/* Main */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Company Watch</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {jobs.length} relevant jobs found across {companies.length} companies — updated {jobs[0]?.found_at}
            </p>
          </div>
          <a
            href="/company-jobs.csv"
            download
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#22c55e20", color: "#22c55e", border: "1px solid #22c55e30" }}
          >
            ↓ Export CSV
          </a>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Jobs", value: jobs.length, color: "#6366f1" },
            { label: "Companies Scanned", value: companies.length, color: "#22c55e" },
            { label: "Project Mgmt", value: jobs.filter(j => j.department === "project_management").length, color: "#a855f7" },
            { label: "Marketing", value: jobs.filter(j => j.department === "marketing").length, color: "#f59e0b" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>{label}</div>
              <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 max-w-xs" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <Search size={13} style={{ color: "var(--muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs or companies..."
              className="bg-transparent text-sm outline-none flex-1"
              style={{ color: "var(--text)" }}
            />
          </div>
          {depts.map((d) => {
            const meta = DEPT_LABELS[d];
            return (
              <button
                key={d}
                onClick={() => setFilter(d)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: filter === d ? (meta?.bg ?? "var(--accent)") : "var(--card)",
                  border: `1px solid ${filter === d ? (meta?.color ?? "var(--accent)") + "50" : "var(--border)"}`,
                  color: filter === d ? (meta?.color ?? "#fff") : "var(--muted)",
                }}
              >
                {meta?.label ?? "All"}
              </button>
            );
          })}
        </div>

        {/* Jobs table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                {["Company", "Job Title", "Type", "Dept", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm" style={{ color: "var(--muted)", background: "var(--card)" }}>
                    No jobs match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((job, i) => {
                  const dept = DEPT_LABELS[job.department] ?? DEPT_LABELS.other;
                  const typeColor = TYPE_COLORS[job.type] ?? "#64748b";
                  return (
                    <tr
                      key={i}
                      onClick={() => setSelected(job)}
                      className="cursor-pointer"
                      style={{
                        background: selected === job ? "#6366f110" : i % 2 === 0 ? "var(--card)" : "var(--surface)",
                        borderBottom: "1px solid var(--border)",
                        borderLeft: selected === job ? "2px solid #6366f1" : "2px solid transparent",
                      }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>{job.company}</td>
                      <td className="px-4 py-3" style={{ color: "var(--text)" }}>{job.job_title}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: typeColor, background: `${typeColor}20` }}>
                          {job.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: dept.color, background: dept.bg }}>
                          {dept.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={job.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded"
                          style={{ color: "var(--muted)" }}
                        >
                          <ExternalLink size={13} />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Companies scanned */}
        <div className="mt-6 rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="text-xs font-medium mb-3" style={{ color: "var(--muted)" }}>Companies Scanned ({companies.length})</div>
          <div className="flex flex-wrap gap-2">
            {companies.map((c) => (
              <span key={c} className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      {selected && (
        <div className="w-72 shrink-0 border-l flex flex-col overflow-y-auto" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Job Details</span>
            <button onClick={() => setSelected(null)} className="p-1 rounded" style={{ color: "var(--muted)" }}>
              <X size={16} />
            </button>
          </div>
          <div className="p-5 flex flex-col gap-5">
            <div>
              <div className="text-base font-bold leading-tight mb-2" style={{ color: "var(--text)" }}>{selected.job_title}</div>
              {(() => {
                const dept = DEPT_LABELS[selected.department] ?? DEPT_LABELS.other;
                return (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ color: dept.color, background: dept.bg }}>
                    {dept.label}
                  </span>
                );
              })()}
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { icon: Building2, label: selected.company },
                { icon: MapPin, label: selected.location },
                { icon: Briefcase, label: selected.type },
                { icon: Tag, label: selected.department.replace("_", " ") },
                { icon: Calendar, label: `Found ${selected.found_at}` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--muted)" }}>
                  <Icon size={13} className="shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={selected.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <ExternalLink size={14} /> View Job
              </a>
              <a
                href={selected.careers_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}
              >
                <Building2 size={14} /> All Jobs at {selected.company.split(" ")[0]}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
