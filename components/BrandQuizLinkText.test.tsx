/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandQuizLinkText } from "./BrandQuizLinkText";

describe("BrandQuizLinkText", () => {
  it("should render Quiz in primary and Link as sibling text", () => {
    render(<BrandQuizLinkText />);

    const quiz = screen.getByText("Quiz");
    expect(quiz).toHaveClass("text-primary");
    expect(screen.getByText("Link")).toBeInTheDocument();
  });
});
