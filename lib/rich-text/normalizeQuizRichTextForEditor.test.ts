import { describe, expect, it } from "vitest";

import { normalizeQuizRichTextForEditor } from "./normalizeQuizRichTextForEditor";

describe("normalizeQuizRichTextForEditor", () => {
  it("returns empty string for empty input", () => {
    expect(normalizeQuizRichTextForEditor("")).toBe("");
    expect(normalizeQuizRichTextForEditor(null)).toBe("");
    expect(normalizeQuizRichTextForEditor(undefined)).toBe("");
  });

  it("wraps legacy plain text in <p>", () => {
    expect(normalizeQuizRichTextForEditor("Hello world")).toBe(
      "<p>Hello world</p>",
    );
  });

  it("escapes plain text containing < and >", () => {
    expect(normalizeQuizRichTextForEditor("a < b > c")).toBe(
      "<p>a &lt; b &gt; c</p>",
    );
  });

  it("escapes plain text containing & and double quotes", () => {
    expect(normalizeQuizRichTextForEditor('Tom & "Jerry"')).toBe(
      "<p>Tom &amp; &quot;Jerry&quot;</p>",
    );
  });

  it("converts plain text line breaks to <br>", () => {
    expect(normalizeQuizRichTextForEditor("a\nb")).toBe("<p>a<br>b</p>");
  });

  it("passes whitelisted HTML through the sanitizer instead of escaping", () => {
    const html = "<p><strong>hi</strong></p>";
    expect(normalizeQuizRichTextForEditor(html)).toBe(html);
  });

  it("sanitizes HTML that contains unsafe tags", () => {
    const html = "<p>hi<script>alert(1)</script></p>";
    expect(normalizeQuizRichTextForEditor(html)).toBe("<p>hi</p>");
  });
});
