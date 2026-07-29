import { describe, expect, it } from "vitest";

import { extractQuizNameFromBuilderSnapshot } from "./builderQuizTitleGate";

describe("extractQuizNameFromBuilderSnapshot", () => {
  it("returns null for invalid snapshots", () => {
    expect(extractQuizNameFromBuilderSnapshot(null)).toBeNull();
    expect(extractQuizNameFromBuilderSnapshot("not-json")).toBeNull();
  });

  it("extracts the quiz name from a builder snapshot", () => {
    expect(
      extractQuizNameFromBuilderSnapshot(JSON.stringify({ name: "Mon quiz", questions: [] })),
    ).toBe("Mon quiz");
  });
});
