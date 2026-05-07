import type { Plugin } from "siyuan";
import { MemoDataStore } from "../store";
import { migration001 } from "./001-migrate-assets-to-plugin-storage";

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
  // Add future migrations here in order
];

export async function runMigrations(
  plugin: Plugin,
  store: MemoDataStore,
  i18n: Record<string, string>,
): Promise<void> {
  const raw = await plugin.loadData(STORAGE_KEY);
  const state: MigrationState = raw || { applied: [] };
  const applied = new Set(state.applied);

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
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
  }
}
