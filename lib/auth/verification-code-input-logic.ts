export const VERIFICATION_CODE_LENGTH = 6;

export function digitsFromCode(
  code: string,
  length: number = VERIFICATION_CODE_LENGTH,
): string[] {
  const sanitized = code.replace(/\D/g, "").slice(0, length);
  return Array.from({ length }, (_, index) => sanitized[index] ?? "");
}

export function codeFromDigits(digits: string[]): string {
  return digits.join("");
}

export function applyDigitInput(
  digits: string[],
  index: number,
  rawInput: string,
): { digits: string[]; focusIndex: number } {
  const numeric = rawInput.replace(/\D/g, "");

  if (numeric.length === 0) {
    return { digits: [...digits], focusIndex: index };
  }

  if (numeric.length > 1) {
    return applyPaste(digits, numeric, index);
  }

  const next = [...digits];
  next[index] = numeric[0];
  const focusIndex = index < digits.length - 1 ? index + 1 : index;

  return { digits: next, focusIndex };
}

export function applyPaste(
  digits: string[],
  pasted: string,
  startIndex = 0,
): { digits: string[]; focusIndex: number } {
  const chars = pasted.replace(/\D/g, "").slice(0, digits.length - startIndex);
  const next = [...digits];

  for (let i = 0; i < chars.length; i += 1) {
    next[startIndex + i] = chars[i];
  }

  const lastFilledIndex = startIndex + chars.length - 1;
  const focusIndex =
    chars.length === 0
      ? startIndex
      : Math.min(lastFilledIndex + 1, digits.length - 1);

  return { digits: next, focusIndex };
}

export function applyBackspace(
  digits: string[],
  index: number,
): { digits: string[]; focusIndex: number } {
  const next = [...digits];

  if (next[index]) {
    next[index] = "";
    return { digits: next, focusIndex: index };
  }

  if (index > 0) {
    next[index - 1] = "";
    return { digits: next, focusIndex: index - 1 };
  }

  return { digits: next, focusIndex: 0 };
}
