/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div data-testid="motion-panel" {...props}>
        {children}
      </div>
    ),
  },
}));

import { BuilderMobileOrganizeTabPanel } from "./builder-mobile-organize-tab-panel";

describe("BuilderMobileOrganizeTabPanel", () => {
  it("renders children inside the animated panel", () => {
    render(
      <BuilderMobileOrganizeTabPanel animationKey={1} prefersReducedMotion={false}>
        <p>Liste organiser</p>
      </BuilderMobileOrganizeTabPanel>,
    );

    expect(screen.getByText("Liste organiser")).toBeTruthy();
    expect(screen.getByTestId("motion-panel")).toBeTruthy();
  });
});
