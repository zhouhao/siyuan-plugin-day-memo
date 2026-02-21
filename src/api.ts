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
