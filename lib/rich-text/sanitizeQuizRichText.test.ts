import { afterEach, describe, expect, it, vi } from "vitest";

import { sanitizeQuizRichText } from "./sanitizeQuizRichText";

describe("sanitizeQuizRichText (DOMPurify branch)", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizeQuizRichText("")).toBe("");
  });

  it("keeps whitelisted tags untouched", () => {
    const input = "<p>Hello <strong>world</strong> <em>!</em></p>";
    expect(sanitizeQuizRichText(input)).toBe(input);
  });

  it("strips <script> tag and its content", () => {
    const input = "<p>hi</p><script>alert(1)</script><p>ok</p>";
    expect(sanitizeQuizRichText(input)).toBe("<p>hi</p><p>ok</p>");
  });

  it("strips inline event handlers like onClick", () => {
    const input = '<p onclick="alert(1)">click me</p>';
    expect(sanitizeQuizRichText(input)).toBe("<p>click me</p>");
  });

  it("strips style attributes", () => {
    const input = '<p style="color:red">red</p>';
    expect(sanitizeQuizRichText(input)).toBe("<p>red</p>");
  });

  it("preserves strong, em, u, s, p, br", () => {
    const input =
      "<p><strong>a</strong><em>b</em><u>c</u><s>d</s><br></p>";
    expect(sanitizeQuizRichText(input)).toBe(input);
  });

  it("strips <a> tags but keeps their inner text", () => {
    const input = '<p>before <a href="https://example.com">link text</a> after</p>';
    expect(sanitizeQuizRichText(input)).toBe("<p>before link text after</p>");
  });

  it("strips <a href='javascript:...'> without keeping the URL", () => {
    const input = '<p><a href="javascript:alert(1)">click me</a></p>';
    expect(sanitizeQuizRichText(input)).toBe("<p>click me</p>");
  });

  it("drops unknown tags but keeps their text content", () => {
    const input = "<div>kept <span>also kept</span></div>";
    expect(sanitizeQuizRichText(input)).toBe("kept also kept");
  });

  it("strips iframe blocks entirely", () => {
    const input = '<p>before</p><iframe src="x">payload</iframe><p>after</p>';
    expect(sanitizeQuizRichText(input)).toBe("<p>before</p><p>after</p>");
  });

  it("strips <img onerror=...> entirely", () => {
    const input = '<p>before</p><img src=x onerror="alert(1)"><p>after</p>';
    expect(sanitizeQuizRichText(input)).toBe("<p>before</p><p>after</p>");
  });
});

describe("sanitizeQuizRichText (string-only branch, no DOM available)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function withoutDom() {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
  }

  it("keeps whitelisted formatting", () => {
    withoutDom();
    expect(
      sanitizeQuizRichText("<p><strong>hi</strong></p>"),
    ).toBe("<p><strong>hi</strong></p>");
  });

  it("strips script tag and content", () => {
    withoutDom();
    expect(
      sanitizeQuizRichText("<p>ok</p><script>alert(1)</script>"),
    ).toBe("<p>ok</p>");
  });

  it("strips inline event handlers", () => {
    withoutDom();
    expect(
      sanitizeQuizRichText('<p onclick="alert(1)">x</p>'),
    ).toBe("<p>x</p>");
  });

  it("strips style attributes", () => {
    withoutDom();
    expect(
      sanitizeQuizRichText('<p style="color:red">x</p>'),
    ).toBe("<p>x</p>");
  });

  it("strips <a> tags but keeps their inner text", () => {
    withoutDom();
    expect(
      sanitizeQuizRichText('<p><a href="https://example.com">link text</a></p>'),
    ).toBe("<p>link text</p>");
  });

  it("strips <a href='javascript:...'> without keeping the URL", () => {
    withoutDom();
    expect(
      sanitizeQuizRichText('<a href="javascript:alert(1)">click me</a>'),
    ).toBe("click me");
  });
});
