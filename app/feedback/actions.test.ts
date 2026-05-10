import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockCreate = vi.fn();
const mockCount = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    feedback: {
      create: (...args: unknown[]) => mockCreate(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

import { createFeedbackAction } from "./actions";

describe("createFeedbackAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({});
  });

  it("creates feedback with userId when session exists", async () => {
    const result = await createFeedbackAction({
      type: "BUG",
      message: "Something is broken here",
      page: "/dashboard",
      userAgent: "Mozilla/5.0",
    });

    expect(result).toEqual({ success: true });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "BUG",
        message: "Something is broken here",
        page: "/dashboard",
        userAgent: "Mozilla/5.0",
        status: "NEW",
      },
    });
  });

  it("creates feedback with null userId when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createFeedbackAction({
      type: "FEEDBACK",
      message: "Anonymous note",
      page: "/foo",
      userAgent: "",
    });

    expect(result).toEqual({ success: true });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: null,
        type: "FEEDBACK",
        message: "Anonymous note",
        page: "/foo",
        userAgent: "",
        status: "NEW",
      },
    });
  });

  it("returns validation error without creating when page is invalid", async () => {
    const result = await createFeedbackAction({
      type: "BUG",
      message: "hellohello",
      page: "no-leading-slash",
      userAgent: "ua",
    });

    expect(result).toEqual({ success: false, error: "Chemin de page invalide" });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
