import { Terminal, Users, Briefcase, Trash2 } from "lucide-react";

const COMMANDS = [
  {
    icon: Users,
    color: "#6366f1",
    title: "Search Hiring Managers",
    description: "Scrapes LinkedIn people search for hiring managers matching your keywords.",
    cmd: 'npm run scrape:managers -- --keywords "marketing manager hiring" --location "Singapore" --pages 3',
  },
  {
    icon: Briefcase,
    color: "#22c55e",
    title: "Search Jobs",
    description: "Scrapes LinkedIn remote job listings and saves them to the pipeline.",
    cmd: 'npm run scrape:jobs -- --keywords "remote marketing manager" --location "Singapore"',
  },
  {
    icon: Trash2,
    color: "#ef4444",
    title: "Clear Session",
    description: "Deletes your saved LinkedIn session. You'll be prompted to log in again next run.",
    cmd: "npm run scrape:clear",
  },
];

const LOCATIONS = [
  { flag: "🇸🇬", name: "Singapore", value: "Singapore" },
  { flag: "🇬🇧", name: "United Kingdom", value: "United Kingdom" },
  { flag: "🇦🇺", name: "Australia", value: "Australia" },
];

export default function ScraperPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          Run Scraper
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Copy and run these commands in your terminal from the{" "}
          <code
            className="px-1.5 py-0.5 rounded text-xs"
            style={{ background: "var(--card)", color: "var(--accent)" }}
          >
            autojob/
          </code>{" "}
          directory.
        </p>
      </div>

      {/* First-time setup */}
      <div
        className="rounded-xl p-5 mb-8"
        style={{ background: "#6366f110", border: "1px solid #6366f130" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={15} style={{ color: "var(--accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
            First-time setup
          </span>
        </div>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
          The first time you run any scrape command, a browser window will open. Log in to your
          LinkedIn account, then press <kbd className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--card)", color: "var(--text)" }}>Enter</kbd> in the terminal. Your session
          is saved locally — you won&apos;t need to log in again unless it expires.
        </p>
        <code
          className="block text-xs px-4 py-3 rounded-lg"
          style={{ background: "var(--surface)", color: "#a5b4fc" }}
        >
          # Run from your terminal in the autojob/ folder<br />
          npm run scrape:managers -- --keywords &quot;marketing manager&quot; --location &quot;Singapore&quot;
        </code>
      </div>

      {/* Command cards */}
      <div className="flex flex-col gap-4 mb-8">
        {COMMANDS.map(({ icon: Icon, color, title, description, cmd }) => (
          <div
            key={title}
            className="rounded-xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}20` }}
              >
                <Icon size={15} style={{ color }} />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {title}
                </div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {description}
                </div>
              </div>
            </div>
            <code
              className="block text-xs px-4 py-3 rounded-lg mt-3 overflow-x-auto whitespace-nowrap"
              style={{ background: "var(--surface)", color: "#a5b4fc" }}
            >
              {cmd}
            </code>
          </div>
        ))}
      </div>

      {/* Location reference */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
          Target Locations
        </h2>
        <div className="flex flex-col gap-2">
          {LOCATIONS.map(({ flag, name, value }) => (
            <div
              key={name}
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: "var(--surface)" }}
            >
              <span className="text-sm" style={{ color: "var(--text)" }}>
                {flag} {name}
              </span>
              <code
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: "var(--card)", color: "var(--accent)" }}
              >
                --location &quot;{value}&quot;
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
