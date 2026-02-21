export interface Memo {
    id: string;
    content: string;
    tags: string[];
    pinned: boolean;
    archived: boolean;
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

export const STORAGE_MEMOS = "memos-data";
export const TAB_TYPE = "day-memo-tab";
