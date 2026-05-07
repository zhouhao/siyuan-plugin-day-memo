import {
  readDir,
  getFile,
  putFile,
  pushMsg,
  pushErrMsg,
  ASSETS_DIR,
  ASSETS_BACKUP_DIR,
} from "./api";
import { MemoDataStore } from "./store";

// Match `(assets/...)` or `(/assets/...)` inside markdown link syntax.
const ASSET_REF_RE = /\((\/?assets\/([^)\s]+))\)/g;

function collectReferencedAssets(contents: string[]): Set<string> {
  const filenames = new Set<string>();
  for (const content of contents) {
    const re = new RegExp(ASSET_REF_RE.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      filenames.add(m[2]);
    }
  }
  return filenames;
}

async function listExistingAssets(): Promise<Set<string>> {
  const entries = await readDir(ASSETS_DIR);
  return new Set(entries.filter((e) => !e.isDir).map((e) => e.name));
}

async function restoreFromBackup(filename: string): Promise<boolean> {
  const blob = await getFile(`${ASSETS_BACKUP_DIR}${filename}`);
  if (!blob) return false;
  try {
    await putFile(`${ASSETS_DIR}${filename}`, blob);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify all assets referenced by memos exist in data/assets/. Restores any
 * missing files from the plugin's backup directory if available.
 *
 * Performance: a single readDir call regardless of asset count, then an
 * in-memory set difference. Network restore calls only happen for files that
 * are actually missing — the common case (no cleanup occurred) is one HTTP
 * call total.
 */
export async function verifyAndRestoreAssets(
  store: MemoDataStore,
  i18n: Record<string, string>,
): Promise<void> {
  console.log("[DayMemo] Asset verification starting");
  const referenced = collectReferencedAssets(
    store.getAllMemos().map((m) => m.content),
  );
  if (referenced.size === 0) {
    console.log("[DayMemo] No referenced assets — skipping verification");
    return;
  }

  const existing = await listExistingAssets();
  const missing = [...referenced].filter((f) => !existing.has(f));
  console.log(
    `[DayMemo] Referenced=${referenced.size}, existing=${existing.size}, missing=${missing.length}`,
  );

  if (missing.length === 0) return;

  await pushMsg(
    (
      i18n.restoringAssets ||
      "DayMemo: restoring {count} missing image(s) from backup..."
    ).replace("{count}", String(missing.length)),
    3000,
  );

  let restored = 0;
  let unrecoverable = 0;
  for (const filename of missing) {
    if (await restoreFromBackup(filename)) {
      restored++;
    } else {
      unrecoverable++;
    }
  }

  if (restored > 0) {
    await pushMsg(
      (
        i18n.assetsRestored ||
        "DayMemo: restored {count} image(s)."
      ).replace("{count}", String(restored)),
      4000,
    );
  }
  if (unrecoverable > 0) {
    await pushErrMsg(
      (
        i18n.assetsUnrecoverable ||
        "DayMemo: {count} image(s) could not be restored (no backup)."
      ).replace("{count}", String(unrecoverable)),
      6000,
    );
  }
}
