type BrandQuizLinkTextProps = {
  className?: string;
};

/**
 * Wordmark: “Quiz” in primary, “Link” inherits the parent text color.
 */
export function BrandQuizLinkText({ className }: BrandQuizLinkTextProps) {
  return (
    <span className={className}>
      <span className="text-primary">Quiz</span>Link
    </span>
  );
}
