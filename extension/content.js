// Detects a job application form on the current page, fills it from the
// most recent AutoJob package (tailored resume + cover letter), and submits.

const ATS_HOSTS = [
  "greenhouse.io", "lever.co", "myworkdayjobs.com", "icims.com",
  "smartrecruiters.com", "ashbyhq.com", "workable.com", "breezy.hr",
  "bamboohr.com", "taleo.net", "successfactors.com", "jazzhr.com",
];

function hostLooksLikeAts() {
  const host = location.hostname.toLowerCase();
  return ATS_HOSTS.some((h) => host.includes(h));
}

function pathLooksLikeApply() {
  return /\/(apply|application|careers?\/[^/]+\/apply)/i.test(location.pathname);
}

function pageHasResumeUpload() {
  const fileInputs = Array.from(document.querySelectorAll("input[type=file]"));
  if (fileInputs.length === 0) return false;
  const bodyText = document.body.innerText.toLowerCase();
  return bodyText.includes("resume") || bodyText.includes("cv") || bodyText.includes("cover letter");
}

function looksLikeApplicationForm() {
  return hostLooksLikeAts() || pathLooksLikeApply() || pageHasResumeUpload();
}

// ── Field label extraction ──────────────────────────────────────────────────

function clueTextFor(el) {
  const parts = [];
  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label) parts.push(label.innerText);
  }
  const closestLabel = el.closest("label");
  if (closestLabel) parts.push(closestLabel.innerText);
  if (el.getAttribute("aria-label")) parts.push(el.getAttribute("aria-label"));
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    labelledBy.split(/\s+/).forEach((id) => {
      const node = document.getElementById(id);
      if (node) parts.push(node.innerText);
    });
  }
  if (el.placeholder) parts.push(el.placeholder);
  if (el.name) parts.push(el.name);
  if (el.id) parts.push(el.id);

  // Walk up a couple of ancestor levels for a preceding label-like text node
  let node = el;
  for (let i = 0; i < 3 && node; i++) {
    const prev = node.previousElementSibling;
    if (prev && prev.tagName !== "INPUT" && prev.tagName !== "SELECT" && prev.tagName !== "TEXTAREA") {
      parts.push(prev.innerText || "");
    }
    node = node.parentElement;
  }

  return parts.join(" ").toLowerCase();
}

function matches(clue, patterns) {
  return patterns.some((p) => p.test(clue));
}

const FIELD_PATTERNS = {
  fullName: [/\bfull ?name\b/, /\byour ?name\b/],
  firstName: [/\bfirst ?name\b/, /\bgiven ?name\b/],
  lastName: [/\blast ?name\b/, /\bsurname\b/, /\bfamily ?name\b/],
  email: [/\be[-\s]?mail\b/],
  phone: [/\bphone\b/, /\bmobile\b/, /\bcontact number\b/],
  resumeUpload: [/\bresume\b/, /\bcv\b/],
  coverLetterUpload: [/\bcover ?letter\b/],
};

function findFields() {
  const inputs = Array.from(document.querySelectorAll("input, textarea"));
  const found = { fullName: null, firstName: null, lastName: null, email: null, phone: null, resumeUpload: null, coverLetterUpload: null, coverLetterText: null };

  for (const el of inputs) {
    if (el.disabled || el.type === "hidden") continue;
    const clue = clueTextFor(el);

    if (el.tagName === "INPUT" && el.type === "file") {
      if (!found.resumeUpload && matches(clue, FIELD_PATTERNS.resumeUpload)) { found.resumeUpload = el; continue; }
      if (!found.coverLetterUpload && matches(clue, FIELD_PATTERNS.coverLetterUpload)) { found.coverLetterUpload = el; continue; }
      continue;
    }

    if (el.tagName === "TEXTAREA" && matches(clue, FIELD_PATTERNS.coverLetterUpload)) {
      found.coverLetterText = el;
      continue;
    }

    if (["text", "email", "tel", undefined, ""].includes(el.type)) {
      if (!found.email && (el.type === "email" || matches(clue, FIELD_PATTERNS.email))) { found.email = el; continue; }
      if (!found.phone && (el.type === "tel" || matches(clue, FIELD_PATTERNS.phone))) { found.phone = el; continue; }
      if (!found.firstName && matches(clue, FIELD_PATTERNS.firstName)) { found.firstName = el; continue; }
      if (!found.lastName && matches(clue, FIELD_PATTERNS.lastName)) { found.lastName = el; continue; }
      if (!found.fullName && matches(clue, FIELD_PATTERNS.fullName)) { found.fullName = el; continue; }
    }
  }

  return found;
}

// ── Filling ──────────────────────────────────────────────────────────────────

function setValue(el, value) {
  const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function base64ToFile(base64, filename, mime) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  return new File([new Uint8Array(byteNumbers)], filename, { type: mime });
}

function setFileInput(input, file) {
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function findSubmitButton() {
  const candidates = Array.from(document.querySelectorAll("button, input[type=submit]"));
  const textMatch = /submit application|submit now|send application|^apply$|^submit$/i;
  return (
    candidates.find((b) => b.type === "submit" && textMatch.test((b.innerText || b.value || "").trim())) ||
    candidates.find((b) => textMatch.test((b.innerText || b.value || "").trim())) ||
    candidates.find((b) => b.type === "submit") ||
    null
  );
}

async function fillAndSubmit(pkg) {
  const fields = findFields();
  const applicant = pkg.applicant;
  const [firstName, ...rest] = applicant.name.split(" ");
  const lastName = rest.join(" ");

  if (fields.fullName) setValue(fields.fullName, applicant.name);
  if (fields.firstName) setValue(fields.firstName, firstName);
  if (fields.lastName) setValue(fields.lastName, lastName);
  if (fields.email) setValue(fields.email, applicant.email);
  if (fields.phone) setValue(fields.phone, applicant.phone);

  if (fields.resumeUpload) {
    setFileInput(fields.resumeUpload, base64ToFile(pkg.resumePdfBase64, `resume-${pkg.job.company}.pdf`, "application/pdf"));
  }
  if (fields.coverLetterUpload) {
    setFileInput(fields.coverLetterUpload, base64ToFile(pkg.coverLetterPdfBase64, `cover-letter-${pkg.job.company}.pdf`, "application/pdf"));
  } else if (fields.coverLetterText) {
    setValue(fields.coverLetterText, pkg.coverLetterText);
  }

  const filledSomething = Object.values(fields).some(Boolean);
  if (!filledSomething) {
    // Form may not have rendered yet (common on SPA-based ATS) — let the caller retry.
    return { status: "Failed", notes: "No matching form fields found on this page", attempted: false };
  }

  await new Promise((r) => setTimeout(r, 400));

  const submitBtn = findSubmitButton();
  if (!submitBtn) {
    return { status: "Failed", notes: "Filled available fields but couldn't find a submit button", attempted: true };
  }

  const urlBefore = location.href;
  submitBtn.click();
  await new Promise((r) => setTimeout(r, 2500));

  const succeeded =
    location.href !== urlBefore ||
    /thank you|application (received|submitted)|we('| a)?ll be in touch/i.test(document.body.innerText);

  return succeeded
    ? { status: "Submitted", notes: "", attempted: true }
    : { status: "Failed", notes: "Submit was clicked but no success confirmation was detected — please check the page", attempted: true };
}

async function reportStatus(pkg, result) {
  const { backendUrl } = await chrome.storage.sync.get("backendUrl");
  if (!backendUrl) return;
  try {
    await fetch(`${backendUrl}/api/apply/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobUrl: pkg.job.jobUrl,
        applyUrl: location.href,
        company: pkg.job.company,
        jobTitle: pkg.job.jobTitle,
        status: result.status,
        notes: result.notes,
      }),
    });
  } catch {
    // best-effort — the sheet is a convenience log, not a source of truth for what happened in-browser
  }
}

async function main() {
  if (!looksLikeApplicationForm()) return;

  const { autojobPackage } = await chrome.storage.local.get("autojobPackage");
  if (!autojobPackage || autojobPackage.consumed) return;

  const result = await fillAndSubmit(autojobPackage);
  if (!result.attempted) return; // form not ready yet — retry on the next tick

  await chrome.storage.local.set({ autojobPackage: { ...autojobPackage, consumed: true } });
  await reportStatus(autojobPackage, result);
}

// SPAs (Workday etc.) render the form well after document_idle — retry briefly.
let attempts = 0;
const interval = setInterval(() => {
  attempts += 1;
  main();
  if (attempts >= 8) clearInterval(interval);
}, 1000);
