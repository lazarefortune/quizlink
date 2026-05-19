import { describe, expect, it } from "vitest";

import { richTextToPlainText } from "./richTextToPlainText";

describe("richTextToPlainText", () => {
  it("returns empty string for empty input", () => {
    expect(richTextToPlainText("")).toBe("");
  });

  it("returns plain text unchanged", () => {
    expect(richTextToPlainText("Hello world")).toBe("Hello world");
  });

  it("strips tags but keeps content", () => {
    expect(richTextToPlainText("<p><strong>Hi</strong> <em>there</em></p>")).toBe(
      "Hi there",
    );
  });

  it("treats <p><br></p> as empty", () => {
    expect(richTextToPlainText("<p><br></p>")).toBe("");
  });

  it("collapses whitespace produced by line breaks", () => {
    expect(richTextToPlainText("<p>line one</p><p>line two</p>")).toBe(
      "line one line two",
    );
  });

  it("decodes common HTML entities", () => {
    expect(richTextToPlainText("<p>Tom &amp; Jerry &lt;3</p>")).toBe(
      "Tom & Jerry <3",
    );
  });

  it("decodes numeric entities", () => {
    expect(richTextToPlainText("<p>Caf&#233;</p>")).toBe("Café");
  });
});
