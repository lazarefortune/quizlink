/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRawMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => queryRawMock(...args),
  },
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    queryRawMock.mockReset();
    vi.resetModules();
  });

  it("returns 200 and status ok when the database responds", async () => {
    queryRawMock.mockResolvedValueOnce([{ ok: 1 }]);
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "ok" });
    expect(body).not.toHaveProperty("database");
    expect(body).not.toHaveProperty("error");
  });

  it("returns 503 and status unavailable when the database fails", async () => {
    queryRawMock.mockRejectedValueOnce(new Error("connection refused"));
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ status: "unavailable" });
    expect(JSON.stringify(body)).not.toContain("connection refused");
  });
});
