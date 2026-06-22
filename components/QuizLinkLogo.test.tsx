/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuizLinkLogo } from "./QuizLinkLogo";

describe("QuizLinkLogo", () => {
  it("renders light and dark inline logo assets", () => {
    render(<QuizLinkLogo />);

    expect(screen.getByTestId("quizlink-logo-light")).toHaveAttribute(
      "src",
      "/quizlink-inline-light.svg",
    );
    expect(screen.getByTestId("quizlink-logo-dark")).toHaveAttribute(
      "src",
      "/quizlink-inline-dark.svg",
    );
    expect(screen.getByRole("img", { name: "QuizLink" })).toBeInTheDocument();
  });
});
