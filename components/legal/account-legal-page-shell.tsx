import type { ReactNode } from "react";

import { AccountLegalBackLink } from "@/components/legal/account-legal-back-link";

type AccountLegalPageShellProps = {
  title: string;
  versionLabel?: string;
  description?: string;
  children: ReactNode;
};

export function AccountLegalPageShell({
  title,
  versionLabel,
  description,
  children,
}: AccountLegalPageShellProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-5 md:py-8 lg:px-8">
        <AccountLegalBackLink />
        <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {versionLabel ? (
          <p className="mb-4 text-sm text-muted-foreground sm:mb-6">{versionLabel}</p>
        ) : null}
        {description ? (
          <p className="mb-6 text-muted-foreground sm:mb-8">{description}</p>
        ) : null}
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
