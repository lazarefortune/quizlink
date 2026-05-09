import { describe, expect, it } from "vitest";

import { getDisplayTitle, getUserInitials } from "./userProfileDisplay";

describe("getUserInitials", () => {
  it("uses first letters of first and last name when both exist", () => {
    expect(getUserInitials("Jean Dupont", "j@x.com")).toBe("JD");
  });

  it("uses first two letters of a single word name", () => {
    expect(getUserInitials("Jean", "j@x.com")).toBe("JE");
  });

  it("falls back to email local part", () => {
    expect(getUserInitials("", "hello@example.com")).toBe("HE");
  });

  it("returns question mark when nothing usable", () => {
    expect(getUserInitials("", "")).toBe("?");
  });
});

describe("getDisplayTitle", () => {
  it("prefers trimmed name", () => {
    expect(getDisplayTitle("Marie Curie", "m@c.com")).toBe("Marie Curie");
  });

  it("uses email local part when name empty", () => {
    expect(getDisplayTitle("", "student@school.edu")).toBe("student");
  });

  it("falls back to ellipsis when empty", () => {
    expect(getDisplayTitle("", "")).toBe("…");
  });
});
