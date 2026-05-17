import type { BuilderSaveStatusDisplayKind } from "@/lib/builder/builderSaveStatusDisplay";

/** Save controls (primary / draft save buttons) show these states instead of a header row. */
const BUILDER_SAVE_STATUS_KINDS_IN_SAVE_CONTROLS = new Set<BuilderSaveStatusDisplayKind>([
  "server_error",
  "server_idle",
  "server_idle_manual",
  "manual_save_active",
  "server_pending",
  "server_saved_flash",
  "server_saved_recent",
  "server_saving",
]);

export function shouldShowBuilderSaveStatusRow(
  kind: BuilderSaveStatusDisplayKind,
): boolean {
  if (kind === "hidden") {
    return false;
  }
  return !BUILDER_SAVE_STATUS_KINDS_IN_SAVE_CONTROLS.has(kind);
}
