import { chromium, BrowserContext } from "playwright";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const COOKIES_PATH = path.join(__dirname, "session.json");

export async function getContext(): Promise<BrowserContext> {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  if (fs.existsSync(COOKIES_PATH)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, "utf-8"));
    await context.addCookies(cookies);
    console.log("Loaded saved LinkedIn session.");
  } else {
    console.log("No saved session found. Opening LinkedIn for login...");
    const page = await context.newPage();
    await page.goto("https://www.linkedin.com/login");

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    await new Promise<void>((resolve) => {
      rl.question("Log in to LinkedIn in the browser, then press Enter here...", () => {
        rl.close();
        resolve();
      });
    });

    const cookies = await context.cookies();
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    console.log("Session saved to scraper/session.json");
    await page.close();
  }

  return context;
}

export async function clearSession(): Promise<void> {
  if (fs.existsSync(COOKIES_PATH)) {
    fs.unlinkSync(COOKIES_PATH);
    console.log("Session cleared.");
  }
}
