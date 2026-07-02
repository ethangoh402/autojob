import { BrowserContext, Page } from "playwright";

export type LinkedInProfile = {
  linkedinUrl: string;
  name: string;
  title: string;
  company: string;
  location: string;
};

export type LinkedInJob = {
  jobUrl: string;
  title: string;
  company: string;
  location: string;
  postedAt?: string;
};

async function slowScroll(page: Page) {
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(500 + Math.random() * 500);
  }
}

/**
 * Search LinkedIn for people (hiring managers) by keyword + optional location.
 */
export async function searchPeople(
  context: BrowserContext,
  params: { keywords: string; location?: string; pages?: number }
): Promise<LinkedInProfile[]> {
  const page = await context.newPage();
  const results: LinkedInProfile[] = [];
  const totalPages = params.pages ?? 2;

  for (let p = 1; p <= totalPages; p++) {
    const url = new URL("https://www.linkedin.com/search/results/people/");
    url.searchParams.set("keywords", params.keywords);
    if (params.location) url.searchParams.set("geoUrn", params.location);
    url.searchParams.set("page", String(p));

    await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000 + Math.random() * 1000);
    await slowScroll(page);

    const cards = await page.$$eval(
      "li.reusable-search__result-container",
      (nodes) =>
        nodes.map((node) => {
          const anchor = node.querySelector("a.app-aware-link[href*='/in/']") as HTMLAnchorElement | null;
          const nameEl = node.querySelector(".entity-result__title-text a span[aria-hidden='true']");
          const titleEl = node.querySelector(".entity-result__primary-subtitle");
          const companyEl = node.querySelector(".entity-result__secondary-subtitle");
          const locationEl = node.querySelector(".entity-result__tertiary-subtitle");

          return {
            linkedinUrl: anchor?.href?.split("?")[0] ?? "",
            name: nameEl?.textContent?.trim() ?? "",
            title: titleEl?.textContent?.trim() ?? "",
            company: companyEl?.textContent?.trim() ?? "",
            location: locationEl?.textContent?.trim() ?? "",
          };
        })
    );

    results.push(...cards.filter((c) => c.linkedinUrl));
    console.log(`Page ${p}: found ${cards.length} profiles`);

    // Random delay between pages to avoid detection
    if (p < totalPages) await page.waitForTimeout(3000 + Math.random() * 2000);
  }

  await page.close();
  return results;
}

/**
 * Search LinkedIn Jobs for remote marketing roles.
 */
export async function searchJobs(
  context: BrowserContext,
  params: { keywords: string; location?: string; pages?: number }
): Promise<LinkedInJob[]> {
  const page = await context.newPage();
  const results: LinkedInJob[] = [];
  const totalPages = params.pages ?? 2;

  for (let p = 0; p < totalPages; p++) {
    const url = new URL("https://www.linkedin.com/jobs/search/");
    url.searchParams.set("keywords", params.keywords);
    if (params.location) url.searchParams.set("location", params.location);
    url.searchParams.set("f_WT", "2"); // remote filter
    url.searchParams.set("start", String(p * 25));

    await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000 + Math.random() * 1000);
    await slowScroll(page);

    const cards = await page.$$eval(
      "li.jobs-search-results__list-item",
      (nodes) =>
        nodes.map((node) => {
          const anchor = node.querySelector("a.job-card-container__link") as HTMLAnchorElement | null;
          const titleEl = node.querySelector(".job-card-list__title");
          const companyEl = node.querySelector(".job-card-container__primary-description");
          const locationEl = node.querySelector(".job-card-container__metadata-item");
          const timeEl = node.querySelector("time");

          return {
            jobUrl: anchor?.href?.split("?")[0] ?? "",
            title: titleEl?.textContent?.trim() ?? "",
            company: companyEl?.textContent?.trim() ?? "",
            location: locationEl?.textContent?.trim() ?? "",
            postedAt: timeEl?.getAttribute("datetime") ?? undefined,
          };
        })
    );

    results.push(...cards.filter((c) => c.jobUrl));
    console.log(`Page ${p + 1}: found ${cards.length} jobs`);

    if (p < totalPages - 1) await page.waitForTimeout(3000 + Math.random() * 2000);
  }

  await page.close();
  return results;
}
