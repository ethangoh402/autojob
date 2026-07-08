# AutoJob Auto-Apply (Chrome extension)

Picks up the tailored resume + cover letter generated on the `/apply` page of
the AutoJob web app, and auto-fills + submits job application forms on
whatever company site you open next. Runs in your real Chrome profile on
your laptop — it needs your actual logged-in sessions (Workday, Greenhouse
accounts, etc.), so it can't run in a cloud sandbox.

## Install (unpacked, dev mode)

1. `chrome://extensions` → enable **Developer mode** (top right).
2. **Load unpacked** → select this `extension/` folder.
3. Click the extension icon → set **AutoJob backend URL** to wherever the
   Next.js app is running (`http://localhost:3000` for local dev, or your
   deployed URL) → **Save**.

## Usage

1. Run the AutoJob app (`npm run dev`) and open `/apply`.
2. Paste a job link, or upload a screenshot of the posting → **Analyze job
   posting** → **Generate resume + cover letter**.
3. That page automatically hands the tailored package to the extension (you
   should see "Sent to the AutoJob Chrome extension…"). The extension icon
   badge shows a green **1** while a package is waiting to be used.
4. Open the company's actual application form (their careers site, or
   whatever the JD linked to). The content script detects application-form
   pages and, once it finds matching fields, **fills them in and clicks
   submit automatically** — no confirmation step. Watch the tab the first
   few times you use this on a new site.
5. Status (submitted / failed, with a reason) is written back to the
   Applications tab of your Google Sheet automatically.

## How field-matching works (and its limits)

`content.js` only activates on pages that look like an application form:
a known ATS domain (Greenhouse, Lever, Workday, iCIMS, SmartRecruiters,
Ashby, Workable, Breezy, BambooHR, Taleo, SuccessFactors, JazzHR), a URL
path containing `/apply`, or a file upload input near the words
"resume"/"cv"/"cover letter". It then matches form fields by label text,
`aria-label`, `placeholder`, `name`/`id` — name, email, phone, resume
upload, and cover letter (upload or text field).

This is heuristic, not exhaustive. Multi-step forms, custom question sets
("Why do you want to work here?", work authorization, salary expectations),
and unusual ATS layouts are **not** filled — the extension fills what it
recognizes and clicks submit regardless, so **check the first submission on
each new ATS** to make sure nothing required was left blank before trusting
it to run unattended.

## If your AutoJob app isn't on localhost or `autojob.pages.dev`

`manifest.json`'s `content_scripts` only injects `bridge.js` (the
web-app-to-extension relay) on a fixed list of origins, on purpose — so an
arbitrary website can't spoof a fake application package into your browser.
If you deploy the app somewhere else, add that origin to the first
`matches` array in `manifest.json` before loading the extension.

## Privacy / safety notes

- The extension never holds your Anthropic API key or Apps Script token —
  all Claude calls and Google Sheets writes happen server-side in the
  Next.js app. The extension only exchanges job/resume/cover-letter JSON
  with your backend.
- Submission is fully automatic (no per-application confirmation) by
  design — that means a bad JD match, a missing required question, or an
  unusual form layout can result in a real application going out with
  gaps. Review the first few runs on each ATS you use.
