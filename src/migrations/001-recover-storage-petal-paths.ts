import type { Migration } from "./index";
import { MemoDataStore } from "../store";
import { recoverStoragePetalPaths } from "./_recover-storage-petal-helper";

async function run(
  store: MemoDataStore,
  i18n: Record<string, string>,
): Promise<void> {
  await recoverStoragePetalPaths(
    store,
    i18n,
    "Migration 001 (recover-storage-petal-paths)",
  );
}

export const migration001: Migration = {
  id: "001-recover-storage-petal-paths",
  run,
};
