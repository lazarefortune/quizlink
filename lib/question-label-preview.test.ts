import { describe, expect, it } from "vitest";
import { buildQuestionLabelPreview } from "./question-label-preview";

describe("buildQuestionLabelPreview", () => {
  it("returns plain text unchanged when short enough", () => {
    expect(buildQuestionLabelPreview("Hello world", 80)).toBe("Hello world");
  });

  it("strips tags and collapses whitespace", () => {
    expect(buildQuestionLabelPreview("<b>Hi</b>  <i>there</i>", 80)).toBe("Hi there");
  });

  it("truncates with ellipsis when longer than maxLength", () => {
    expect(buildQuestionLabelPreview("abcdefghijklmnop", 8)).toBe("abcdefgh…");
  });
});
