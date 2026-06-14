import { loadScriptEnv } from "../env/loadScriptEnv";
import { parseSeedQuotaDemoOptions } from "./seedQuotaDemoData";

export async function runSeedQuotaDemoDataCli(
  argv: string[] = process.argv.slice(2),
): Promise<void> {
  loadScriptEnv();

  const {
    runSeedQuotaDemoData,
    printSeedSummary,
    printSeedQuotaDemoUsage,
  } = await import("../../scripts/seed-quota-demo-data");

  try {
    const summary = await runSeedQuotaDemoData(parseSeedQuotaDemoOptions(argv));
    printSeedSummary(summary);
  } catch (error) {
    console.error("Erreur seed quota demo:", error);
    printSeedQuotaDemoUsage();
    throw error;
  }
}
