"use client";

import { useCallback, useEffect, useRef } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  VERIFICATION_CODE_LENGTH,
  applyBackspace,
  applyDigitInput,
  applyPaste,
  codeFromDigits,
  digitsFromCode,
} from "@/lib/auth/verification-code-input-logic";

type VerificationCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
};

export function VerificationCodeInput({
  value,
  onChange,
  length = VERIFICATION_CODE_LENGTH,
  disabled = false,
  id = "verification-code",
  className,
  "aria-label": ariaLabel = "Verification code",
}: VerificationCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = digitsFromCode(value, length);

  const focusIndex = useCallback((index: number) => {
    const input = inputRefs.current[index];
    if (!input) {
      return;
    }
    input.focus();
    input.select();
  }, []);

  const commitDigits = useCallback(
    (nextDigits: string[], focusAt: number) => {
      onChange(codeFromDigits(nextDigits));
      requestAnimationFrame(() => focusIndex(focusAt));
    },
    [onChange, focusIndex],
  );

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleDigitChange = (index: number, rawInput: string) => {
    const { digits: nextDigits, focusIndex: nextFocus } = applyDigitInput(digits, index, rawInput);
    commitDigits(nextDigits, nextFocus);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const { digits: nextDigits, focusIndex: nextFocus } = applyBackspace(digits, index);
      commitDigits(nextDigits, nextFocus);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const { digits: nextDigits, focusIndex: nextFocus } = applyPaste(
      digits,
      event.clipboardData.getData("text"),
      index,
    );
    commitDigits(nextDigits, nextFocus);
  };

  const handleAutofill = (rawValue: string) => {
    const { digits: nextDigits, focusIndex: nextFocus } = applyPaste(digits, rawValue, 0);
    commitDigits(nextDigits, nextFocus);
  };

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-2", className)}>
      <div
        role="group"
        aria-label={ariaLabel}
        className="relative grid w-full grid-cols-6 gap-2 sm:gap-3"
        onPaste={(event) => {
          const target = event.target as HTMLElement;
          if (target.tagName === "INPUT") {
            return;
          }
          event.preventDefault();
          const { digits: nextDigits, focusIndex: nextFocus } = applyPaste(
            digits,
            event.clipboardData.getData("text"),
            0,
          );
          commitDigits(nextDigits, nextFocus);
        }}
      >
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          disabled={disabled}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          value={value}
          onChange={(event) => handleAutofill(event.target.value)}
        />
        {digits.map((digit, index) => (
          <Input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            id={`${id}-${index}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            disabled={disabled}
            value={digit}
            maxLength={1}
            aria-label={`${ariaLabel}, digit ${index + 1} of ${length}`}
            className="h-12 w-full min-w-0 p-0 text-center text-xl font-mono tracking-widest sm:h-14 sm:text-2xl"
            onChange={(event) => handleDigitChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            onFocus={(event) => event.target.select()}
          />
        ))}
      </div>
    </div>
  );
}
