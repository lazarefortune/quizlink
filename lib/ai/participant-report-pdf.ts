/**
 * Client-side only: build report PDF with jsPDF.
 * Used for download and for sending by email (output as base64).
 */
import type { ParticipantReportOutput } from "./participant-report-schema";

const FONT_SIZE_TITLE = 16;
const FONT_SIZE_HEADING = 12;
const FONT_SIZE_BODY = 10;
const MARGIN = 20;
const LINE_HEIGHT = 6;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const TEXT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

function escapeText(text: string): string {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ").trim() || " ";
}

type JsPDFDoc = {
  setFontSize: (n: number) => JsPDFDoc;
  text: (s: string | string[], x: number, y: number) => JsPDFDoc;
  splitTextToSize: (text: string, maxWidth: number) => string[];
  addPage: () => JsPDFDoc;
  output: (type: "blob") => Blob;
};

function addBlock(
  doc: JsPDFDoc,
  text: string,
  x: number,
  y: number,
  maxWidth: number
): number {
  const lines = doc.splitTextToSize(escapeText(text), maxWidth);
  lines.forEach((line) => {
    doc.text(line, x, y);
    y += LINE_HEIGHT;
  });
  return y;
}

function checkNewPage(doc: JsPDFDoc, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

export function buildReportPdfBlob(
  report: ParticipantReportOutput,
  meta: { participantName: string; quizName: string },
  locale: "fr" | "en"
): Blob {
  const { jsPDF } = require("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as JsPDFDoc;
  let y = MARGIN;

  const t = (key: "title" | "summary" | "strengths" | "weaknesses" | "recurring" | "review" | "plan" | "tips" | "warnings") =>
    locale === "fr"
      ? { title: "Rapport IA", summary: "Résumé", strengths: "Forces", weaknesses: "Faiblesses", recurring: "Erreurs récurrentes", review: "Questions à revoir", plan: "Plan 7 jours", tips: "Conseils", warnings: "Points d'attention" }[key]
      : { title: "AI Report", summary: "Summary", strengths: "Strengths", weaknesses: "Weaknesses", recurring: "Recurring mistakes", review: "Questions to review", plan: "7-day plan", tips: "Tips", warnings: "Warnings" }[key];

  doc.setFontSize(FONT_SIZE_TITLE);
  y = addBlock(doc, meta.participantName + " · " + meta.quizName, MARGIN, y, TEXT_WIDTH);
  y += LINE_HEIGHT;

  doc.setFontSize(FONT_SIZE_HEADING);
  doc.text(t("summary"), MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFontSize(FONT_SIZE_BODY);
  y = addBlock(doc, report.summary.overallLevel, MARGIN, y, TEXT_WIDTH);
  y = addBlock(doc, report.summary.oneSentence, MARGIN, y, TEXT_WIDTH);
  report.summary.keyNumbers.forEach((n) => {
    y = addBlock(doc, "• " + n, MARGIN, y, TEXT_WIDTH);
  });
  y += LINE_HEIGHT;

  doc.setFontSize(FONT_SIZE_HEADING);
  doc.text(t("strengths"), MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFontSize(FONT_SIZE_BODY);
  report.strengths.forEach((s) => {
    y = checkNewPage(doc, y, LINE_HEIGHT * 4);
    y = addBlock(doc, s.title, MARGIN, y, TEXT_WIDTH);
    y = addBlock(doc, s.evidence, MARGIN + 5, y, TEXT_WIDTH - 5);
    y = addBlock(doc, s.metric, MARGIN + 5, y, TEXT_WIDTH - 5);
    y += LINE_HEIGHT;
  });
  y += LINE_HEIGHT;

  doc.setFontSize(FONT_SIZE_HEADING);
  doc.text(t("weaknesses"), MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFontSize(FONT_SIZE_BODY);
  report.weaknesses.forEach((w) => {
    y = checkNewPage(doc, y, LINE_HEIGHT * 4);
    y = addBlock(doc, w.title, MARGIN, y, TEXT_WIDTH);
    y = addBlock(doc, w.evidence, MARGIN + 5, y, TEXT_WIDTH - 5);
    y = addBlock(doc, w.metric, MARGIN + 5, y, TEXT_WIDTH - 5);
    y += LINE_HEIGHT;
  });
  y += LINE_HEIGHT;

  doc.setFontSize(FONT_SIZE_HEADING);
  doc.text(t("recurring"), MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFontSize(FONT_SIZE_BODY);
  report.recurringMistakes.forEach((m) => {
    y = checkNewPage(doc, y, LINE_HEIGHT * 6);
    y = addBlock(doc, m.pattern, MARGIN, y, TEXT_WIDTH);
    y = addBlock(doc, m.whyLikely, MARGIN + 5, y, TEXT_WIDTH - 5);
    y = addBlock(doc, (locale === "fr" ? "Corriger: " : "Fix: ") + m.howToFix, MARGIN + 5, y, TEXT_WIDTH - 5);
    y += LINE_HEIGHT * 2;
  });
  y += LINE_HEIGHT;

  doc.setFontSize(FONT_SIZE_HEADING);
  doc.text(t("review"), MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFontSize(FONT_SIZE_BODY);
  report.mostImportantQuestionsToReview.forEach((q) => {
    y = checkNewPage(doc, y, LINE_HEIGHT * 6);
    y = addBlock(doc, q.question, MARGIN, y, TEXT_WIDTH);
    y = addBlock(doc, q.whyMissed, MARGIN + 5, y, TEXT_WIDTH - 5);
    y = addBlock(doc, q.whatToRemember, MARGIN + 5, y, TEXT_WIDTH - 5);
    y += LINE_HEIGHT * 2;
  });
  y += LINE_HEIGHT;

  doc.setFontSize(FONT_SIZE_HEADING);
  doc.text(t("plan"), MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFontSize(FONT_SIZE_BODY);
  report.studyPlan7Days.forEach((d) => {
    y = checkNewPage(doc, y, LINE_HEIGHT * (3 + d.tasks.length));
    y = addBlock(doc, (locale === "fr" ? "Jour " : "Day ") + d.day + ": " + d.focus, MARGIN, y, TEXT_WIDTH);
    d.tasks.forEach((task) => {
      y = addBlock(doc, "• " + task, MARGIN + 5, y, TEXT_WIDTH - 5);
    });
    y += LINE_HEIGHT;
  });

  if (report.tips.length > 0) {
    y += LINE_HEIGHT;
    doc.setFontSize(FONT_SIZE_HEADING);
    doc.text(t("tips"), MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFontSize(FONT_SIZE_BODY);
    report.tips.forEach((tip) => {
      y = addBlock(doc, "• " + tip, MARGIN, y, TEXT_WIDTH);
    });
  }

  if (report.warnings.length > 0) {
    y += LINE_HEIGHT;
    doc.setFontSize(FONT_SIZE_HEADING);
    doc.text(t("warnings"), MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFontSize(FONT_SIZE_BODY);
    report.warnings.forEach((w) => {
      y = addBlock(doc, "• " + w, MARGIN, y, TEXT_WIDTH);
    });
  }

  return doc.output("blob");
}

export function reportPdfBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve(base64 ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
