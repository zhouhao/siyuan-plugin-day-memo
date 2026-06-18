import { fetchPost } from "siyuan";
import { renderDailyNotePath, convertTagsToSiYuanFormat } from "./utils";

/**
 * Wrapper for SiYuan kernel API calls.
 */
export function request(
  url: string,
  data?: Record<string, unknown>,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    fetchPost(url, data || {}, (response) => {
      if (response.code === 0) {
        resolve(response.data);
      } else {
        reject(new Error(response.msg || `API error: ${url}`));
      }
    });
  });
}

/**
 * Push a notification message to SiYuan.
 */
export function pushMsg(msg: string, timeout = 3000): Promise<unknown> {
  return request("/api/notification/pushMsg", { msg, timeout });
}

/**
 * Push an error message to SiYuan.
 */
export function pushErrMsg(msg: string, timeout = 5000): Promise<unknown> {
  return request("/api/notification/pushErrMsg", { msg, timeout });
}

export interface Notebook {
  id: string;
  name: string;
  closed: boolean;
}

const DEFAULT_DAILY_NOTE_PATH =
  '/daily note/{{now | date "2006/01"}}/{{now | date "2006-01-02"}}';

export async function lsNotebooks(): Promise<Notebook[]> {
  const data = (await request("/api/notebook/lsNotebooks")) as {
    notebooks: Notebook[];
  };
  return data.notebooks;
}

export async function getNotebookConf(
  notebook: string,
): Promise<{ dailyNoteSavePath: string }> {
  const data = (await request("/api/notebook/getNotebookConf", {
    notebook,
  })) as { conf: { dailyNoteSavePath: string } };
  return data.conf;
}

export async function getIDsByHPath(
  notebook: string,
  path: string,
): Promise<string[]> {
  const data = await request("/api/filetree/getIDsByHPath", { notebook, path });
  return (data as string[]) || [];
}

export async function createDocWithMd(
  notebook: string,
  path: string,
  markdown: string,
): Promise<string> {
  const data = await request("/api/filetree/createDocWithMd", {
    notebook,
    path,
    markdown,
  });
  return data as string;
}

export async function appendBlock(
  parentID: string,
  markdown: string,
): Promise<void> {
  await request("/api/block/appendBlock", {
    data: markdown,
    dataType: "markdown",
    parentID,
  });
}

export async function addToDailyNote(
  memoContent: string,
  targetDate: number,
  sourceLabel: string,
  customPathTemplate?: string,
  enableReplacementRules?: boolean,
  replacementRules?: import("./types").ReplacementRule[],
): Promise<void> {
  const notebooks = await lsNotebooks();
  const openNotebooks = notebooks.filter((nb) => !nb.closed);
  if (openNotebooks.length === 0) {
    throw new Error("NO_NOTEBOOK");
  }
  const notebookId = openNotebooks[0].id;

  let savePath: string;
  if (customPathTemplate) {
    savePath = customPathTemplate;
  } else {
    const conf = await getNotebookConf(notebookId);
    savePath = conf.dailyNoteSavePath || DEFAULT_DAILY_NOTE_PATH;
  }
  const memoDate = new Date(targetDate);
  const dailyNotePath = renderDailyNotePath(savePath, memoDate);

  const ids = await getIDsByHPath(notebookId, dailyNotePath);
  let docId: string;
  if (ids.length > 0) {
    docId = ids[0];
  } else {
    docId = await createDocWithMd(notebookId, dailyNotePath, "");
  }

  let processedMemoContent = memoContent;
  if (
    enableReplacementRules &&
    replacementRules &&
    replacementRules.length > 0
  ) {
    for (const rule of replacementRules) {
      if (!rule.match) continue;
      try {
        const regex = new RegExp(rule.match, "gm");
        processedMemoContent = processedMemoContent.replace(
          regex,
          rule.replace || "",
        );
      } catch {
        // skip invalid regex rules silently
      }
    }
  }

  processedMemoContent = convertTagsToSiYuanFormat(processedMemoContent);
  const content = sourceLabel
    ? `> ${sourceLabel}\n\n${processedMemoContent}`
    : processedMemoContent;
  await appendBlock(docId, content);
}

/**
 * Send a memo's content to flomo via webhook API.
 * Requires a valid flomo PRO webhook URL.
 */
export async function sendToFlomo(
  webhookUrl: string,
  content: string,
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error(`Flomo API error: ${response.status}`);
  }
  const result = await response.json();
  if (result.code !== 0) {
    throw new Error(result.message || "Failed to send to flomo");
  }
}

/**
 * Upload asset files to SiYuan's assets directory.
 * NOTE: We must use /assets/ here because SiYuan's HTTP server only serves
 * static files from data/assets/. Files in data/storage/petal/... cannot be
 * rendered as <img src>. The "delete unreferenced assets" issue (#31) is
 * handled separately by a backup-and-restore migration.
 * Uses /api/asset/upload (multipart/form-data).
 * Returns a map of original filename → uploaded asset path.
 */
export async function uploadAsset(
  files: File[],
): Promise<Record<string, string>> {
  const form = new FormData();
  form.append("assetsDirPath", "/assets/");
  for (const file of files) {
    form.append("file[]", file);
  }

  const response = await fetch("/api/asset/upload", {
    method: "POST",
    body: form,
  });
  const result = await response.json();
  if (result.code !== 0) {
    throw new Error(result.msg || "Upload failed");
  }
  return result.data.succMap as Record<string, string>;
}

/**
 * Generic file API helpers — used to back up assets to plugin storage and
 * restore them when SiYuan's "delete unreferenced assets" wipes data/assets/.
 */

export const ASSETS_BACKUP_DIR =
  "/data/storage/petal/siyuan-plugin-day-memo/assets-backup/";
export const ASSETS_DIR = "/data/assets/";

export interface DirEntry {
  name: string;
  isDir: boolean;
  updated?: number;
}

export async function readDir(path: string): Promise<DirEntry[]> {
  try {
    const data = (await request("/api/file/readDir", { path })) as DirEntry[];
    return data || [];
  } catch {
    return [];
  }
}

export async function putFile(path: string, file: File | Blob): Promise<void> {
  const form = new FormData();
  form.append("path", path);
  form.append("isDir", "false");
  form.append("modTime", String(Date.now()));
  form.append("file", file);
  const response = await fetch("/api/file/putFile", {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    throw new Error(`putFile failed: ${response.status}`);
  }
  const result = await response.json();
  if (result.code !== 0) {
    throw new Error(result.msg || "putFile failed");
  }
}

export async function getFile(path: string): Promise<Blob | null> {
  // SiYuan's /api/file/getFile is POST with a JSON body, not GET with a
  // query parameter. On success it streams the raw file bytes; on error it
  // returns a JSON envelope, so we must check Content-Type before treating
  // the response as a Blob.
  const response = await fetch("/api/file/getFile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  if (!response.ok) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return null;
  }
  return await response.blob();
}

/**
 * Save a copy of an uploaded asset to plugin storage so it can be restored
 * if SiYuan's cleanup later deletes the original from data/assets/.
 */
export async function backupAsset(
  file: File | Blob,
  filename: string,
): Promise<void> {
  await putFile(`${ASSETS_BACKUP_DIR}${filename}`, file);
}
