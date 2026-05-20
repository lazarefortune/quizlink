import { describe, expect, it } from "vitest";

import {
  applyBackspace,
  applyDigitInput,
  applyPaste,
  codeFromDigits,
  digitsFromCode,
} from "./verification-code-input-logic";

const emptyDigits = ["", "", "", "", "", ""];

describe("verification-code-input-logic", () => {
  it("splits and joins code strings", () => {
    expect(digitsFromCode("123456")).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect(codeFromDigits(["1", "2", "3", "", "", ""])).toBe("123");
  });

  it("advances focus after entering a digit", () => {
    const result = applyDigitInput(emptyDigits, 0, "4");

    expect(result.digits[0]).toBe("4");
    expect(result.focusIndex).toBe(1);
  });

  it("stays on last cell when the final digit is entered", () => {
    const digits = ["1", "2", "3", "4", "5", ""];
    const result = applyDigitInput(digits, 5, "6");

    expect(codeFromDigits(result.digits)).toBe("123456");
    expect(result.focusIndex).toBe(5);
  });

  it("fills multiple cells when pasting", () => {
    const result = applyPaste(emptyDigits, "123456", 0);

    expect(codeFromDigits(result.digits)).toBe("123456");
    expect(result.focusIndex).toBe(5);
  });

  it("clears current cell on backspace when filled", () => {
    const digits = ["1", "2", "", "", "", ""];
    const result = applyBackspace(digits, 1);

    expect(result.digits[1]).toBe("");
    expect(result.focusIndex).toBe(1);
  });

  it("moves to previous cell on backspace when empty", () => {
    const digits = ["1", "2", "", "", "", ""];
    const result = applyBackspace(digits, 2);

    expect(result.digits[1]).toBe("");
    expect(result.focusIndex).toBe(1);
  });
});
