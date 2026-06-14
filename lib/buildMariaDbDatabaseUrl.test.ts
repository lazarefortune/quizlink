import { describe, expect, it } from "vitest";

import { buildMariaDbDatabaseUrl } from "@/lib/buildMariaDbDatabaseUrl";

describe("buildMariaDbDatabaseUrl", () => {
  it("appends allowPublicKeyRetrieval when no query string exists", () => {
    expect(buildMariaDbDatabaseUrl("mysql://user:pass@localhost:3306/quizlink")).toBe(
      "mysql://user:pass@localhost:3306/quizlink?allowPublicKeyRetrieval=true",
    );
  });

  it("appends allowPublicKeyRetrieval when other query params exist", () => {
    expect(buildMariaDbDatabaseUrl("mysql://user:pass@localhost:3306/quizlink?ssl=true")).toBe(
      "mysql://user:pass@localhost:3306/quizlink?ssl=true&allowPublicKeyRetrieval=true",
    );
  });

  it("does not duplicate allowPublicKeyRetrieval", () => {
    const url = "mysql://user:pass@localhost:3306/quizlink?allowPublicKeyRetrieval=false";

    expect(buildMariaDbDatabaseUrl(url)).toBe(url);
  });
});
