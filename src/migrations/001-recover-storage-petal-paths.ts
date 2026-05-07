import type { Migration } from "./index";
import { uploadAsset, pushMsg } from "../api";
import { MemoDataStore } from "../store";

// Plugin v0.6.1 (briefly) uploaded images to /storage/petal/.../assets/ which
// SiYuan's HTTP server does not serve as static files, so those images
// rendered as broken icons. This migration finds any such paths in memo
// content, re-uploads the files to /assets/ (where SiYuan does serve them),
// and rewrites the memo content with the new asset paths.
const BROKEN_PATH_RE =
  /\((\/storage\/petal\/siyuan-plugin-day-memo\/assets\/[^)\s]+)\)/g;

function collectBrokenPaths(contents: string[]): Set<string> {
  const paths = new Set<string>();
  for (const content of contents) {
    const re = new RegExp(BROKEN_PATH_RE.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      paths.add(m[1]);
    }
  }
  return paths;
}

async function recoverAsset(brokenPath: string): Promise<string | null> {
  try {
    const response = await fetch(
      `/api/file/getFile?path=${encodeURIComponent(`/data${brokenPath}`)}`,
    );
    if (!response.ok) return null;
    const blob = await response.blob();
    const filename = brokenPath.split("/").pop()!;
    const file = new File([blob], filename, {
      type: blob.type || "application/octet-stream",
    });
    const succMap = await uploadAsset([file]);
    return succMap[filename] ?? null;
  } catch {
    return null;
  }
}

// Idempotency: rewritten paths no longer match BROKEN_PATH_RE, so re-running
// this migration is always a no-op for memos that have already been fixed.
async function run(
  store: MemoDataStore,
  i18n: Record<string, string>,
): Promise<void> {
  console.log("[DayMemo] Migration 001 (recover-storage-petal-paths) starting");
  const memos = store.getAllMemos();
  const brokenPaths = collectBrokenPaths(memos.map((m) => m.content));
  console.log(
    `[DayMemo] Scanned ${memos.length} memo(s), found ${brokenPaths.size} broken /storage/petal/ path(s)`,
  );
  if (brokenPaths.size === 0) return;

  await pushMsg(
    (
      i18n.recoveringAssets ||
      "DayMemo: recovering {count} broken image(s)..."
    ).replace("{count}", String(brokenPaths.size)),
    3000,
  );

  const pathMap = new Map<string, string>();
  for (const brokenPath of brokenPaths) {
    const newPath = await recoverAsset(brokenPath);
    if (newPath) pathMap.set(brokenPath, newPath);
  }

  if (pathMap.size === 0) {
    console.warn(
      "[DayMemo] Could not recover any broken paths — files may already be deleted",
    );
    return;
  }

  let recoveredCount = 0;
  for (const memo of memos) {
    const newContent = memo.content.replace(
      new RegExp(BROKEN_PATH_RE.source, "g"),
      (match, rawPath) => {
        const newPath = pathMap.get(rawPath);
        return newPath ? `(${newPath})` : match;
      },
    );
    if (newContent !== memo.content) {
      store.updateMemo(memo.id, newContent);
      recoveredCount++;
    }
  }

  if (recoveredCount > 0) {
    await store.persistNow();
    await pushMsg(
      (
        i18n.assetsRecovered ||
        "DayMemo: recovered images in {count} memo(s)."
      ).replace("{count}", String(recoveredCount)),
      5000,
    );
  }
}

export const migration001: Migration = {
  id: "001-recover-storage-petal-paths",
  run,
};
