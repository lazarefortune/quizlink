import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";

let isLoaded = false;

/**
 * Loads `.env.local` then `.env` for CLI scripts executed outside Next.js.
 * Mirrors Next.js env file priority without requiring a direct `@next/env` import.
 */
export function loadScriptEnv(cwd: string = process.cwd()): void {
  if (isLoaded) {
    return;
  }

  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(cwd, fileName);
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
    }
  }

  isLoaded = true;
}

/** Test-only reset so env loading can be exercised in isolation. */
export function resetScriptEnvForTests(): void {
  isLoaded = false;
}
