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
  const content = `> ${sourceLabel}\n\n${processedMemoContent}`;
  await appendBlock(docId, content);
}

/**
 * Upload asset files to SiYuan's assets directory.
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
