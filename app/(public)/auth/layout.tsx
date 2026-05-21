import { AUTH_LAYOUT_MIN_HEIGHT_CLASS } from "@/lib/layout/public-chrome";
import { cn } from "@/lib/utils";

/**
 * Auth section layout: no public header (hidden via public-chrome); focused form chrome only.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn(AUTH_LAYOUT_MIN_HEIGHT_CLASS, "bg-background")}>
      {children}
    </div>
  );
}
