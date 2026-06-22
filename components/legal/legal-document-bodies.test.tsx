/* @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/use-locale", () => ({
  useLocale: () => ({ locale: "fr" as const }),
}));

import { SalesDocumentBody } from "@/components/legal/document-bodies/sales-document-body";
import { PrivacyDocumentBody } from "@/components/legal/document-bodies/privacy-document-body";
import { TermsDocumentBody } from "@/components/legal/document-bodies/terms-document-body";

describe("Legal document bodies", () => {
  it("CGV mentions Free, Coins and Pro models", () => {
    render(<SalesDocumentBody />);

    expect(screen.getByText(/Plan gratuit \(rappel\)/)).toBeTruthy();
    expect(screen.getByText(/40 coins permettent de débloquer définitivement un quiz/)).toBeTruthy();
    expect(screen.getByText(/Abonnement Pro/)).toBeTruthy();
    expect(
      screen.getByText(/Si Pro expire ou est annulé, les quiz non débloqués avec coins reviennent au plan gratuit/),
    ).toBeTruthy();
  });

  it("privacy policy mentions detailed response purge", () => {
    render(<PrivacyDocumentBody />);

    expect(screen.getByText(/Conservation et purge/)).toBeTruthy();
    expect(
      screen.getByText(/les quiz Pro ou débloqués avec coins ne sont pas concernés par cette purge automatique/),
    ).toBeTruthy();
  });

  it("CGU describes quiz creation and creator responsibility", () => {
    render(<TermsDocumentBody />);

    expect(screen.getByText(/Création et partage de quiz/)).toBeTruthy();
    expect(screen.getByText(/Responsabilité du créateur/)).toBeTruthy();
    expect(screen.queryByText(/prolonger/i)).toBeNull();
    expect(screen.queryByText(/campagne 7 jours/i)).toBeNull();
  });
});
