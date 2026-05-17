import { describe, expect, it } from "vitest";
import { shouldShowBuilderSaveStatusRow } from "@/lib/builder/builderSaveStatusRowVisibility";

describe("shouldShowBuilderSaveStatusRow", () => {
  it("returns false for hidden", () => {
    expect(shouldShowBuilderSaveStatusRow("hidden")).toBe(false);
  });

  it("returns false for kinds merged into save controls", () => {
    expect(shouldShowBuilderSaveStatusRow("server_idle")).toBe(false);
    expect(shouldShowBuilderSaveStatusRow("server_idle_manual")).toBe(false);
    expect(shouldShowBuilderSaveStatusRow("manual_save_active")).toBe(false);
    expect(shouldShowBuilderSaveStatusRow("server_pending")).toBe(false);
    expect(shouldShowBuilderSaveStatusRow("server_saving")).toBe(false);
    expect(shouldShowBuilderSaveStatusRow("server_saved_flash")).toBe(false);
    expect(shouldShowBuilderSaveStatusRow("server_saved_recent")).toBe(false);
    expect(shouldShowBuilderSaveStatusRow("server_error")).toBe(false);
  });

  it("returns true for kinds that still need a header hint", () => {
    expect(shouldShowBuilderSaveStatusRow("local_draft")).toBe(true);
    expect(shouldShowBuilderSaveStatusRow("archived_readonly")).toBe(true);
  });
});
