import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildQuizPreviewPath } from "@/lib/quiz/quiz-preview-routes";

describe("builder preview integration", () => {
  it("page-content uses Link target _blank and preview-ready dialog after save", () => {
    const pagePath = resolve(process.cwd(), "app/(app)/builder/page-content.tsx");
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain("handlePreviewQuiz");
    expect(source).toContain("buildQuizPreviewPath");
    expect(source).toContain('target="_blank"');
    expect(source).toContain("canOpenPreviewViaLink");
    expect(source).toContain("showPreviewReadyDialog");
    expect(source).toContain("previewReadyQuizId");
    expect(source).not.toContain("window.open");
    expect(source).not.toContain("previewPopupBlocked");
    expect(source).toContain("builder.previewQuiz");
    expect(source).toContain("isPreparingPreview");
    expect(source).not.toContain("createOrGetQuizLink");
    expect(buildQuizPreviewPath("q-1")).toBe("/preview/quiz/q-1");
  });
});
