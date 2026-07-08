// Simple text-based PDF rendering for tailored resumes + cover letters.
// jsPDF's core text/vector APIs don't need a DOM or canvas, so this runs fine server-side.
import { jsPDF } from "jspdf";
import { RESUME } from "./resume";
import { TailoredResume } from "./anthropic";

const PAGE_WIDTH = 612; // US Letter, points
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function newDoc(): jsPDF {
  return new jsPDF({ unit: "pt", format: "letter" });
}

function addWrapped(doc: jsPDF, text: string, x: number, y: number, opts?: { lineHeight?: number }): number {
  const lineHeight = opts?.lineHeight ?? 13;
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH - (x - MARGIN));
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function ensureSpace(doc: jsPDF, y: number, needed = 40): number {
  if (y > 792 - MARGIN - needed) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

export function renderResumePdf(resume: TailoredResume): Uint8Array {
  const doc = newDoc();
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(RESUME.name, MARGIN, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(resume.headline, MARGIN, y);
  y += 14;
  doc.setFontSize(9);
  doc.text(`${RESUME.email}  |  ${RESUME.phone}  |  ${RESUME.openTo}`, MARGIN, y);
  y += 20;
  doc.setTextColor(0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("SUMMARY", MARGIN, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = addWrapped(doc, resume.summary, MARGIN, y) + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("SKILLS", MARGIN, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = addWrapped(doc, resume.skills.join("  •  "), MARGIN, y) + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("EXPERIENCE", MARGIN, y);
  y += 16;

  for (const job of resume.experience) {
    y = ensureSpace(doc, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${job.role} — ${job.company}`, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    const periodWidth = doc.getTextWidth(job.period);
    doc.text(job.period, PAGE_WIDTH - MARGIN - periodWidth, y);
    doc.setTextColor(0);
    y += 14;

    doc.setFontSize(10);
    for (const h of job.highlights) {
      y = ensureSpace(doc, y);
      y = addWrapped(doc, `•  ${h}`, MARGIN + 8, y) + 2;
    }
    y += 10;
  }

  y = ensureSpace(doc, y, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("EDUCATION", MARGIN, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = addWrapped(doc, `${RESUME.education.degree} — ${RESUME.education.university} (${RESUME.education.period})`, MARGIN, y) + 4;
  doc.setFontSize(9);
  doc.setTextColor(100);
  y = addWrapped(doc, `${RESUME.education.cgpa}. ${RESUME.education.note}`, MARGIN, y);

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

export function renderCoverLetterPdf(params: { coverLetterText: string; companyName: string; jobTitle: string }): Uint8Array {
  const doc = newDoc();
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(RESUME.name, MARGIN, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`${RESUME.email}  |  ${RESUME.phone}`, MARGIN, y);
  doc.setTextColor(0);
  y += 30;

  doc.setFontSize(10);
  doc.text(`Re: ${params.jobTitle} at ${params.companyName}`, MARGIN, y);
  y += 24;

  const paragraphs = params.coverLetterText.split(/\n{2,}/);
  for (const para of paragraphs) {
    y = ensureSpace(doc, y, 60);
    y = addWrapped(doc, para.trim(), MARGIN, y, { lineHeight: 14 }) + 12;
  }

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

export function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}
