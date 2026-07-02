import { Users, Briefcase, Send, MessageSquare, TrendingUp, Clock } from "lucide-react";

const stats = [
  { label: "Total Contacts", value: "0", icon: Users, color: "#6366f1" },
  { label: "Applications", value: "0", icon: Briefcase, color: "#22c55e" },
  { label: "Outreach Sent", value: "0", icon: Send, color: "#f59e0b" },
  { label: "Replies", value: "0", icon: MessageSquare, color: "#ec4899" },
];

const pipeline = [
  { stage: "Found", count: 0, color: "#64748b" },
  { stage: "Outreach Sent", count: 0, color: "#6366f1" },
  { stage: "Replied", count: 0, color: "#f59e0b" },
  { stage: "Interviewing", count: 0, color: "#a855f7" },
  { stage: "Offer", count: 0, color: "#22c55e" },
];

const recentActivity: { action: string; name: string; time: string }[] = [];

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Your automated job hunt — all in one place.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl p-5 flex flex-col gap-3"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                {label}
              </span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${color}20` }}
              >
                <Icon size={15} style={{ color }} />
              </div>
            </div>
            <div className="text-3xl font-bold" style={{ color: "var(--text)" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pipeline */}
        <div
          className="lg:col-span-2 rounded-xl p-6"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Application Pipeline
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {pipeline.map(({ stage, count, color }) => (
              <div key={stage} className="flex items-center gap-3">
                <div className="w-28 text-xs shrink-0" style={{ color: "var(--muted)" }}>
                  {stage}
                </div>
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--border)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: count ? `${Math.min(count * 10, 100)}%` : "0%", background: color }}
                  />
                </div>
                <div className="w-6 text-xs text-right shrink-0" style={{ color: "var(--muted)" }}>
                  {count}
                </div>
              </div>
            ))}
          </div>

          {pipeline.every((p) => p.count === 0) && (
            <div
              className="mt-6 text-center text-xs py-8 rounded-lg"
              style={{ color: "var(--muted)", background: "var(--surface)" }}
            >
              No applications yet. Run the scraper to get started.
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div
          className="rounded-xl p-6"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Clock size={16} style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Recent Activity
            </h2>
          </div>

          {recentActivity.length === 0 ? (
            <div
              className="text-center text-xs py-8 rounded-lg"
              style={{ color: "var(--muted)", background: "var(--surface)" }}
            >
              No activity yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <span className="text-xs" style={{ color: "var(--text)" }}>
                    {a.action}{" "}
                    <span style={{ color: "var(--accent)" }}>{a.name}</span>
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {a.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Target markets */}
      <div
        className="mt-6 rounded-xl p-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
          Target Markets
        </h2>
        <div className="flex gap-3 flex-wrap">
          {["🇸🇬 Singapore", "🇬🇧 United Kingdom", "🇦🇺 Australia"].map((market) => (
            <div
              key={market}
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              {market}
            </div>
          ))}
          <div
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: "var(--surface)", border: "1px dashed var(--border)", color: "var(--muted)" }}
          >
            + Add market
          </div>
        </div>
      </div>
    </div>
  );
}
