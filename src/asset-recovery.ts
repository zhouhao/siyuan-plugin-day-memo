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

async function listFiles(dir: string): Promise<Set<string>> {
  const entries = await readDir(dir);
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

async function backupOne(filename: string): Promise<boolean> {
  const blob = await getFile(`${ASSETS_DIR}${filename}`);
  if (!blob) return false;
  try {
    await putFile(`${ASSETS_BACKUP_DIR}${filename}`, blob);
    return true;
  } catch {
    return false;
  }
}

/**
 * One-time-style backfill: copy any memo-referenced asset that exists in
 * data/assets/ but is missing from the plugin backup directory. Ensures
 * users who installed pre-backup versions of the plugin still get their
 * existing images protected on the next startup.
 *
 * Performance: 2 readDir calls + a set difference. Network copies only run
 * for files not yet backed up — after the first run, this is a no-op.
 */
export async function backfillAssetBackups(
  store: MemoDataStore,
): Promise<void> {
  console.log("[DayMemo] Asset backfill starting");
  const referenced = collectReferencedAssets(
    store.getAllMemos().map((m) => m.content),
  );
  if (referenced.size === 0) {
    console.log("[DayMemo] No referenced assets — skipping backfill");
    return;
  }

  const [present, alreadyBacked] = await Promise.all([
    listFiles(ASSETS_DIR),
    listFiles(ASSETS_BACKUP_DIR),
  ]);

  const toBackup = [...referenced].filter(
    (f) => present.has(f) && !alreadyBacked.has(f),
  );
  console.log(
    `[DayMemo] Referenced=${referenced.size}, present-in-assets=${present.size}, already-backed-up=${alreadyBacked.size}, to-backup=${toBackup.length}`,
  );
  if (toBackup.length === 0) return;

  let copied = 0;
  for (const filename of toBackup) {
    if (await backupOne(filename)) copied++;
  }
  console.log(`[DayMemo] Backfill copied ${copied}/${toBackup.length} files`);
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

  const existing = await listFiles(ASSETS_DIR);
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
      (i18n.assetsRestored || "DayMemo: restored {count} image(s).").replace(
        "{count}",
        String(restored),
      ),
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
