/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocaleSegmentedControl } from "./locale-segmented-control";

describe("LocaleSegmentedControl", () => {
  it("calls onLocaleChange when selecting another language", () => {
    const onLocaleChange = vi.fn();

    render(
      <LocaleSegmentedControl locale="fr" onLocaleChange={onLocaleChange} />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Anglais" }));

    expect(onLocaleChange).toHaveBeenCalledWith("en");
  });

  it("marks the active locale", () => {
    render(
      <LocaleSegmentedControl locale="en" onLocaleChange={vi.fn()} />,
    );

    expect(screen.getByRole("radio", { name: "English" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "French" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });
});
