import fs from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockDotenvConfig = vi.fn();

vi.mock("dotenv", () => ({
  default: {
    config: (...args: unknown[]) => mockDotenvConfig(...args),
  },
}));

import { loadScriptEnv, resetScriptEnvForTests } from "./loadScriptEnv";

describe("loadScriptEnv", () => {
  afterEach(() => {
    resetScriptEnvForTests();
    mockDotenvConfig.mockClear();
    vi.restoreAllMocks();
  });

  it("loads .env.local then .env once per process", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);

    loadScriptEnv("/tmp/quizsnap");
    loadScriptEnv("/tmp/quizsnap");

    expect(mockDotenvConfig).toHaveBeenCalledTimes(2);
    expect(mockDotenvConfig).toHaveBeenNthCalledWith(1, {
      path: "/tmp/quizsnap/.env.local",
      override: false,
    });
    expect(mockDotenvConfig).toHaveBeenNthCalledWith(2, {
      path: "/tmp/quizsnap/.env",
      override: false,
    });
  });
});
