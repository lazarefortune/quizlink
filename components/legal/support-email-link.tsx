import { SUPPORT_EMAIL } from "@/lib/contact/constants";

type SupportEmailLinkProps = {
  className?: string;
};

export function SupportEmailLink({ className }: SupportEmailLinkProps) {
  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}`}
      className={className ?? "font-medium text-primary hover:underline"}
    >
      {SUPPORT_EMAIL}
    </a>
  );
}
