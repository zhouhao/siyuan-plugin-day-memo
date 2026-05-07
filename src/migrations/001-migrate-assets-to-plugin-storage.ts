import type { Migration } from "./index";
import { uploadAsset, pushMsg } from "../api";
import { MemoDataStore } from "../store";

const OLD_ASSET_RE = /\((\/?assets\/[^)\s]+)\)/g;
const PLUGIN_ASSETS_PREFIX = "/storage/petal/siyuan-plugin-day-memo/assets/";

function collectOldAssetPaths(contents: string[]): Set<string> {
  const paths = new Set<string>();
  for (const content of contents) {
    const re = new RegExp(OLD_ASSET_RE.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      const path = m[1].startsWith("/") ? m[1] : `/${m[1]}`;
      if (!path.startsWith(PLUGIN_ASSETS_PREFIX)) {
        paths.add(path);
      }
    }
  }
  return paths;
}

async function reuploadAsset(assetPath: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/file/getFile?path=/data${assetPath}`);
    if (!response.ok) return null;
    const blob = await response.blob();
    const filename = assetPath.split("/").pop()!;
    const file = new File([blob], filename, {
      type: blob.type || "application/octet-stream",
    });
    const succMap = await uploadAsset([file]);
    return succMap[filename] ?? null;
  } catch {
    return null;
  }
}

// Idempotency: after migration, paths start with PLUGIN_ASSETS_PREFIX which
// does not match OLD_ASSET_RE, so re-running always exits early at the
// collectOldAssetPaths check — safe to run multiple times.
async function run(
  store: MemoDataStore,
  i18n: Record<string, string>,
): Promise<void> {
  const memos = store.getAllMemos();
  const oldPaths = collectOldAssetPaths(memos.map((m) => m.content));
  if (oldPaths.size === 0) return;

  await pushMsg(
    (
      i18n.migratingAssets ||
      "DayMemo: migrating {count} file(s) to safe storage..."
    ).replace("{count}", String(oldPaths.size)),
    3000,
  );

  const pathMap = new Map<string, string>();
  for (const oldPath of oldPaths) {
    const newPath = await reuploadAsset(oldPath);
    if (newPath) pathMap.set(oldPath, newPath);
  }

  if (pathMap.size === 0) return;

  let migratedCount = 0;
  for (const memo of memos) {
    const newContent = memo.content.replace(
      new RegExp(OLD_ASSET_RE.source, "g"),
      (match, rawPath) => {
        const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
        const newPath = pathMap.get(path);
        return newPath ? `(${newPath})` : match;
      },
    );
    if (newContent !== memo.content) {
      store.updateMemo(memo.id, newContent);
      migratedCount++;
    }
  }

  if (migratedCount > 0) {
    // Flush memo content changes to disk before the runner records this
    // migration as applied, so a crash between the two saves can't leave
    // stale /assets/ paths in storage while migration-state marks 001 done.
    await store.persistNow();
    await pushMsg(
      (
        i18n.assetsMigrated ||
        "DayMemo: migration complete — {count} memo(s) updated."
      ).replace("{count}", String(migratedCount)),
      5000,
    );
  }
}

export const migration001: Migration = {
  id: "001-migrate-assets-to-plugin-storage",
  run,
};
