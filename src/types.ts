export interface Memo {
    id: string;
    content: string;
    tags: string[];
    pinned: boolean;
    archived: boolean;
    deleted?: boolean;
    reminderAt?: number;
    createdAt: number;
    updatedAt: number;
}

export interface MemoStore {
    memos: Memo[];
    version: number;
}

export type MemoFilter = "all" | "pinned" | "archived";

export interface FilterState {
    filter: MemoFilter;
    searchQuery: string;
    selectedTag: string | null;
    selectedDate: string | null;
    showArchived: boolean;
}

export interface TagTreeNode {
    name: string;
    fullPath: string;
    count: number;
    children: TagTreeNode[];
}

export const STORAGE_MEMOS = "memos-data";
export const TAB_TYPE = "day-memo-tab";
export const DOCK_TYPE = "day-memo-dock";
