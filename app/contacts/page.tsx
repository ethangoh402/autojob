"use client";

import { useState } from "react";
import { Users, Mail, ExternalLink, Link2, X, MapPin, Building2, Briefcase, Send, MessageSquare } from "lucide-react";

const CONNECTION_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  none:      { label: "Not Connected", color: "#64748b", bg: "#64748b20" },
  pending:   { label: "Pending",       color: "#f59e0b", bg: "#f59e0b20" },
  connected: { label: "Connected",     color: "#22c55e", bg: "#22c55e20" },
};

const DM_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  none:    { label: "No DM",  color: "#64748b", bg: "#64748b20" },
  sent:    { label: "Sent",   color: "#6366f1", bg: "#6366f120" },
  replied: { label: "Replied", color: "#22c55e", bg: "#22c55e20" },
};

type Contact = {
  id: number;
  name: string;
  title: string;
  company: string;
  location: string;
  linkedin_url: string;
  email: string | null;
  connection_status: string;
  dm_status: string;
  found_at: string;
};

const MOCK_CONTACTS: Contact[] = [];

function Badge({ map, value }: { map: Record<string, { label: string; color: string; bg: string }>; value: string }) {
  const badge = map[value] ?? map["none"];
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ color: badge.color, background: badge.bg }}>
      {badge.label}
    </span>
  );
}

export default function ContactsPage() {
  const [selected, setSelected] = useState<Contact | null>(null);

  return (
    <div className="flex h-full">
      {/* Main table */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Contacts</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Hiring managers — click a row to view details</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
            <Users size={14} />
            <span>{MOCK_CONTACTS.length} contacts</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {["All", "Not Connected", "Pending", "Connected"].map((f) => (
            <button key={f} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: f === "All" ? "var(--accent)" : "var(--card)",
                border: "1px solid var(--border)",
                color: f === "All" ? "#fff" : "var(--muted)",
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                {["Name", "Title", "Company", "Location", "Connect", "DM", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_CONTACTS.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm" style={{ color: "var(--muted)", background: "var(--card)" }}>
                    <div className="flex flex-col items-center gap-3">
                      <Users size={32} style={{ color: "var(--border)" }} />
                      <div>No contacts yet.</div>
                      <div className="text-xs">Ask Claude to scrape hiring managers — they'll appear here.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                MOCK_CONTACTS.map((c, i) => (
                  <tr key={c.id} onClick={() => setSelected(c)} className="cursor-pointer"
                    style={{
                      background: selected?.id === c.id ? "#6366f110" : i % 2 === 0 ? "var(--card)" : "var(--surface)",
                      borderBottom: "1px solid var(--border)",
                      borderLeft: selected?.id === c.id ? "2px solid #6366f1" : "2px solid transparent",
                    }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>{c.name}</td>
                    <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{c.title}</td>
                    <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{c.company}</td>
                    <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{c.location}</td>
                    <td className="px-4 py-3"><Badge map={CONNECTION_BADGE} value={c.connection_status} /></td>
                    <td className="px-4 py-3"><Badge map={DM_BADGE} value={c.dm_status} /></td>
                    <td className="px-4 py-3">
                      <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
                        style={{ background: "#0a66c215", color: "#0a66c2" }}>
                        <Link2 size={12} /> Connect
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right panel */}
      {selected && (
        <div className="w-72 shrink-0 border-l flex flex-col overflow-y-auto"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Contact</span>
            <button onClick={() => setSelected(null)} className="p-1 rounded" style={{ color: "var(--muted)" }}>
              <X size={16} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                style={{ background: "var(--accent)", color: "#fff" }}>
                {selected.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{selected.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{selected.title}</div>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-col gap-2.5">
              {[
                { icon: Building2, label: selected.company },
                { icon: MapPin, label: selected.location },
                ...(selected.email ? [{ icon: Mail, label: selected.email }] : []),
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--muted)" }}>
                  <Icon size={13} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </div>

            {/* Status badges */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--muted)" }}>Connection</span>
                <Badge map={CONNECTION_BADGE} value={selected.connection_status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--muted)" }}>DM</span>
                <Badge map={DM_BADGE} value={selected.dm_status} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <a href={selected.linkedin_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium"
                style={{ background: "#0a66c2", color: "#fff" }}>
                <Link2 size={14} /> Open LinkedIn Profile
              </a>
              {selected.email && (
                <a href={`mailto:${selected.email}`}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
                  <Mail size={14} /> Send Email
                </a>
              )}
            </div>

            {/* Quick actions */}
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>Quick actions</div>
              <div className="flex flex-col gap-1.5">
                {[
                  { icon: Briefcase, label: "Mark as Connected" },
                  { icon: Send, label: "Mark DM Sent" },
                  { icon: MessageSquare, label: "Mark Replied" },
                ].map(({ icon: Icon, label }) => (
                  <button key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs" style={{ color: "var(--border)" }}>
              Found {new Date(selected.found_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
