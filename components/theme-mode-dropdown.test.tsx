/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ThemeModeDropdown } from "./theme-mode-dropdown";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: vi.fn(),
  }),
}));

describe("ThemeModeDropdown", () => {
  it("renders theme trigger with current mode label", () => {
    render(<ThemeModeDropdown locale="en" />);

    expect(
      screen.getByRole("button", { name: /Display theme/i }),
    ).toBeInTheDocument();
  });
});
