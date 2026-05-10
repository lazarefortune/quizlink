import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockUserUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  },
}));

import { acceptLegalDocumentsAction } from "./actions";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal-versions";

describe("acceptLegalDocumentsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => {
      throw new Error("redirect");
    });
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUserUpdate.mockResolvedValue({});
  });

  it("returns error when legalAccepted is not strictly true", async () => {
    const result = await acceptLegalDocumentsAction(false, "fr");
    expect(result).toEqual({
      success: false,
      error:
        "Tu dois accepter les CGU et la politique de confidentialité pour continuer.",
    });
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("updates user legal fields and returns success", async () => {
    const result = await acceptLegalDocumentsAction(true, "en");

    expect(result).toEqual({ success: true });
    expect(mockUserUpdate).toHaveBeenCalledTimes(1);
    const arg = mockUserUpdate.mock.calls[0][0];
    expect(arg.where).toEqual({ id: "user-1" });
    expect(arg.data.termsVersion).toBe(CURRENT_TERMS_VERSION);
    expect(arg.data.privacyVersion).toBe(CURRENT_PRIVACY_VERSION);
    expect(arg.data.termsAcceptedAt).toBeInstanceOf(Date);
    expect(arg.data.privacyAcceptedAt).toBeInstanceOf(Date);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to signin when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(acceptLegalDocumentsAction(true, "fr")).rejects.toThrow("redirect");
    expect(redirectMock).toHaveBeenCalledWith("/auth/signin");
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("returns error when update fails", async () => {
    redirectMock.mockReset();
    mockUserUpdate.mockRejectedValue(new Error("db error"));

    const result = await acceptLegalDocumentsAction(true, "fr");
    expect(result).toEqual({
      success: false,
      error: "Impossible d'enregistrer ton acceptation. Réessaie.",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
