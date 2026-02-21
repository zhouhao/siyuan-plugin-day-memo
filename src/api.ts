import { fetchPost } from "siyuan";

/**
 * Wrapper for SiYuan kernel API calls.
 */
export function request(url: string, data?: Record<string, unknown>): Promise<unknown> {
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

/**
 * Upload asset files to SiYuan's assets directory.
 * Uses /api/asset/upload (multipart/form-data).
 * Returns a map of original filename → uploaded asset path.
 */
export async function uploadAsset(files: File[]): Promise<Record<string, string>> {
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
