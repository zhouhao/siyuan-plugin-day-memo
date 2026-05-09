import type { Plugin } from "siyuan";
import { MemoDataStore } from "../store";
import { migration001 } from "./001-recover-storage-petal-paths";
import { migration002 } from "./002-recover-storage-petal-paths-retry";
import { migration003 } from "./003-recover-storage-petal-paths-retry-2";

export interface Migration {
  id: string;
  run(store: MemoDataStore, i18n: Record<string, string>): Promise<void>;
}

interface MigrationState {
  applied: string[];
}

const STORAGE_KEY = "migration-state";

const MIGRATIONS: Migration[] = [
  migration001,
  migration002,
  migration003,
  // Add future migrations here in order
];

export async function runMigrations(
  plugin: Plugin,
  store: MemoDataStore,
  i18n: Record<string, string>,
): Promise<void> {
  console.log("[DayMemo] runMigrations called");
  const raw = await plugin.loadData(STORAGE_KEY);
  const state: MigrationState = raw || { applied: [] };
  const applied = new Set(state.applied);
  console.log(
    `[DayMemo] Already-applied migrations: ${JSON.stringify(state.applied)}`,
  );

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) {
      console.log(
        `[DayMemo] Skipping already-applied migration ${migration.id}`,
      );
      continue;
    }
    console.log(`[DayMemo] Running migration ${migration.id}`);
    try {
      await migration.run(store, i18n);
    } catch (err) {
      // Non-fatal: skip failed migration, retry next startup
      console.error(`[DayMemo] Migration "${migration.id}" failed:`, err);
      continue;
    }
    applied.add(migration.id);
    state.applied = Array.from(applied);
    await plugin.saveData(STORAGE_KEY, state);
    console.log(`[DayMemo] Migration ${migration.id} completed and recorded`);
  }
}
