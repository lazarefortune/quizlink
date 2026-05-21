/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuizQuestionImage } from "./quiz-question-image";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    onLoad,
    onError,
    className,
  }: {
    src: string;
    alt: string;
    onLoad?: () => void;
    onError?: () => void;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      data-testid="quiz-question-img"
      onLoad={onLoad}
      onError={onError}
    />
  ),
}));

describe("QuizQuestionImage", () => {
  it("renders nothing when src is null", () => {
    const { container } = render(<QuizQuestionImage src={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows a skeleton while the image is loading", () => {
    render(<QuizQuestionImage src="/api/question-images/u/q/test.webp" />);
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.getByTestId("quiz-question-img")).toHaveClass("opacity-0");
  });

  it("reveals the image after load", () => {
    render(<QuizQuestionImage src="/api/question-images/u/q/test.webp" />);
    fireEvent.load(screen.getByTestId("quiz-question-img"));
    expect(document.querySelector(".animate-pulse")).not.toBeInTheDocument();
    expect(screen.getByTestId("quiz-question-img")).toHaveClass("opacity-100");
  });

  it("shows a fallback when the image fails to load", () => {
    render(<QuizQuestionImage src="/api/question-images/u/q/broken.webp" />);
    fireEvent.error(screen.getByTestId("quiz-question-img"));
    expect(screen.queryByTestId("quiz-question-img")).not.toBeInTheDocument();
    expect(document.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });
});
