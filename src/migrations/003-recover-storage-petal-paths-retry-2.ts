import type { Migration } from "./index";
import { MemoDataStore } from "../store";
import { recoverStoragePetalPaths } from "./_recover-storage-petal-helper";

// Re-run with corrected regex. Migration 002 used a regex that required a
// leading `/` before `storage/` and rejected spaces in filenames; in real
// data the paths have no leading slash and filenames can contain spaces
// (e.g. `2026-04-20 13.11.01-...jpg`), so 002 found 0 matches and was
// recorded as applied without doing anything. Fresh ID re-runs the
// recovery against the same memos with the fixed regex.
async function run(
  store: MemoDataStore,
  i18n: Record<string, string>,
): Promise<void> {
  await recoverStoragePetalPaths(
    store,
    i18n,
    "Migration 003 (recover-storage-petal-paths-retry-2)",
  );
}

export const migration003: Migration = {
  id: "003-recover-storage-petal-paths-retry-2",
  run,
};
