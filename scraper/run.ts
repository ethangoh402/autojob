/**
 * CLI entry point for the LinkedIn scraper.
 *
 * Usage:
 *   npx ts-node scraper/run.ts managers --keywords "marketing manager" --location "Singapore" --pages 3
 *   npx ts-node scraper/run.ts jobs --keywords "remote marketing" --location "Singapore"
 *   npx ts-node scraper/run.ts clear-session
 */

import { getContext, clearSession } from "./session";
import { searchPeople, searchJobs } from "./linkedin";

const API_BASE = process.env.API_BASE ?? "http://localhost:3000";

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      args[argv[i].slice(2)] = argv[i + 1] ?? "true";
      i++;
    }
  }
  return args;
}

async function pushContacts(profiles: object[]) {
  const res = await fetch(`${API_BASE}/api/contacts/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contacts: profiles }),
  });
  const data = await res.json();
  console.log(`Saved ${data.saved ?? 0} contacts to dashboard.`);
}

async function pushJobs(jobs: object[]) {
  const res = await fetch(`${API_BASE}/api/applications/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applications: jobs, source: "linkedin_job" }),
  });
  const data = await res.json();
  console.log(`Saved ${data.saved ?? 0} jobs to dashboard.`);
}

async function main() {
  const [, , command, ...rest] = process.argv;
  const args = parseArgs(rest);

  if (command === "clear-session") {
    await clearSession();
    return;
  }

  const context = await getContext();

  if (command === "managers") {
    if (!args.keywords) {
      console.error("--keywords is required. e.g. --keywords 'marketing manager hiring'");
      process.exit(1);
    }
    console.log(`Searching hiring managers: "${args.keywords}" | location: ${args.location ?? "any"}`);
    const profiles = await searchPeople(context, {
      keywords: args.keywords,
      location: args.location,
      pages: args.pages ? parseInt(args.pages) : 2,
    });
    console.log(`Total found: ${profiles.length}`);
    await pushContacts(profiles);

  } else if (command === "jobs") {
    if (!args.keywords) {
      console.error("--keywords is required. e.g. --keywords 'remote marketing manager'");
      process.exit(1);
    }
    console.log(`Searching jobs: "${args.keywords}" | location: ${args.location ?? "any"}`);
    const jobs = await searchJobs(context, {
      keywords: args.keywords,
      location: args.location,
      pages: args.pages ? parseInt(args.pages) : 2,
    });
    console.log(`Total found: ${jobs.length}`);
    await pushJobs(jobs);

  } else {
    console.log(`
Commands:
  managers  --keywords <text> [--location <city>] [--pages <n>]
  jobs      --keywords <text> [--location <city>] [--pages <n>]
  clear-session
    `);
  }

  await context.browser()?.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
