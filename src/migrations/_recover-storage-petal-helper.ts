import { uploadAsset, pushMsg, getFile } from "../api";
import { MemoDataStore } from "../store";

// Plugin v0.6.1 (briefly) uploaded images to /storage/petal/.../assets/ which
// SiYuan's HTTP server does not serve as static files, so those images
// rendered as broken icons. This helper finds any such paths in memo
// content, re-uploads the files to /assets/ (where SiYuan does serve them),
// and rewrites the memo content with the new asset paths.
//
// Used by both migration 001 and 002; 002 exists to re-run on installs
// where 001 was recorded as applied under the original buggy implementation
// (which used GET /api/file/getFile and silently failed on every fetch).
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
    const blob = await getFile(`/data${brokenPath}`);
    if (!blob) return null;
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
// is always a no-op for memos that have already been fixed.
export async function recoverStoragePetalPaths(
  store: MemoDataStore,
  i18n: Record<string, string>,
  migrationLabel: string,
): Promise<void> {
  console.log(`[DayMemo] ${migrationLabel} starting`);
  const memos = store.getAllMemos();
  const brokenPaths = collectBrokenPaths(memos.map((m) => m.content));
  console.log(
    `[DayMemo] Scanned ${memos.length} memo(s), found ${brokenPaths.size} broken /storage/petal/ path(s)`,
  );
  if (brokenPaths.size === 0) return;

  await pushMsg(
    (
      i18n.recoveringAssets || "DayMemo: recovering {count} broken image(s)..."
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
        i18n.assetsRecovered || "DayMemo: recovered images in {count} memo(s)."
      ).replace("{count}", String(recoveredCount)),
      5000,
    );
  }
}
