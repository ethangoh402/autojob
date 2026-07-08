"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Search,
  Settings,
  Building2,
  Zap,
  Mail,
  Send,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/apply", label: "Apply", icon: Send },
  { href: "/outreach", label: "Email Outreach", icon: Mail },
  { href: "/company-watch", label: "Company Watch", icon: Building2 },
  { href: "/scraper", label: "Run Scraper", icon: Search },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside
      style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      className="w-56 shrink-0 flex flex-col h-full"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "var(--accent)" }}
        >
          <Zap size={14} className="text-white" />
        </div>
        <span className="font-semibold text-sm tracking-wide" style={{ color: "var(--text)" }}>
          AutoJob
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: active ? "var(--accent)" : "transparent",
                color: active ? "#fff" : "var(--muted)",
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ color: "var(--muted)" }}
        >
          <Settings size={16} />
          Settings
        </Link>
        <div
          className="mt-3 mx-1 px-3 py-3 rounded-lg text-xs"
          style={{ background: "var(--card)", color: "var(--muted)" }}
        >
          <div className="font-medium mb-0.5" style={{ color: "var(--text)" }}>Ethan Goh</div>
          <div>Remote Marketing Hunt</div>
        </div>
      </div>
    </aside>
  );
}
