import { QuizLinkLogo, type QuizLinkLogoSize } from "@/components/QuizLinkLogo";

type BrandQuizLinkTextProps = {
  className?: string;
  size?: QuizLinkLogoSize;
};

export function BrandQuizLinkText({ className, size }: BrandQuizLinkTextProps) {
  const resolvedSize = size ?? (className?.includes("inline") ? "xs" : "md");

  return <QuizLinkLogo className={className} size={resolvedSize} />;
}
