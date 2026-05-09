import type { Migration } from "./index";
import { MemoDataStore } from "../store";
import { recoverStoragePetalPaths } from "./_recover-storage-petal-helper";

// Re-run of migration 001 with a fresh ID. The original 001 used GET on
// /api/file/getFile (which is actually a POST endpoint) and silently
// failed on every fetch — but the runner still recorded it as applied,
// so it can never run again under the same ID. This duplicate runs the
// same recovery with the corrected getFile() helper.
async function run(
  store: MemoDataStore,
  i18n: Record<string, string>,
): Promise<void> {
  await recoverStoragePetalPaths(
    store,
    i18n,
    "Migration 002 (recover-storage-petal-paths-retry)",
  );
}

export const migration002: Migration = {
  id: "002-recover-storage-petal-paths-retry",
  run,
};
