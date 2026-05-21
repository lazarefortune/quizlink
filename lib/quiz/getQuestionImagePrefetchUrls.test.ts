import { describe, expect, it } from "vitest";

import { getQuestionImagePrefetchUrls } from "./getQuestionImagePrefetchUrls";

const KEY_A = "u/q/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp";
const KEY_B = "u/q/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.webp";
const KEY_C = "u/q/cccccccccccccccccccccccccccccc.webp";
const KEY_D = "u/q/dddddddddddddddddddddddddddddd.webp";
const KEY_E = "u/q/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.webp";

describe("getQuestionImagePrefetchUrls", () => {
  const questions = [
    { imageKey: KEY_A },
    { imageKey: KEY_B },
    { imageKey: KEY_C },
    { image: null, imageKey: null },
    { imageKey: KEY_E },
  ];

  it("returns URLs for the next two questions with images", () => {
    const urls = getQuestionImagePrefetchUrls(questions, 0, { lookahead: 2 });
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain(KEY_B);
    expect(urls[1]).toContain(KEY_C);
  });

  it("does not include the current question image", () => {
    const urls = getQuestionImagePrefetchUrls(questions, 0, { lookahead: 2 });
    expect(urls.some((u) => u.includes(KEY_A))).toBe(false);
  });

  it("skips questions without an image within the lookahead window", () => {
    const urls = getQuestionImagePrefetchUrls(questions, 2, { lookahead: 2 });
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain(KEY_E);
  });

  it("deduplicates identical URLs in the lookahead window", () => {
    const withDupes = [
      { imageKey: KEY_A },
      { imageKey: KEY_B },
      { imageKey: KEY_B },
    ];
    const urls = getQuestionImagePrefetchUrls(withDupes, 0, { lookahead: 2 });
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain(KEY_B);
  });

  it("returns an empty list when lookahead is zero", () => {
    expect(getQuestionImagePrefetchUrls(questions, 0, { lookahead: 0 })).toEqual([]);
  });

  it("returns an empty list when there are no upcoming questions", () => {
    expect(getQuestionImagePrefetchUrls(questions, questions.length - 1, { lookahead: 2 })).toEqual(
      [],
    );
  });

  it("returns an empty list for an empty question array", () => {
    expect(getQuestionImagePrefetchUrls([], 0, { lookahead: 2 })).toEqual([]);
  });
});
