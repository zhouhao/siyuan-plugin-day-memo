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

export interface ReplacementRule {
    match: string;
    replace: string;
}

export interface PluginSettings {
    dailyNotePathTemplate: string;
    convertTask?: boolean;
    replacementRules?: ReplacementRule[];
}

export const DEFAULT_SETTINGS: PluginSettings = {
    dailyNotePathTemplate: "",
    convertTask: false,
    replacementRules: [{ match: "^#任务 ", replace: "- [ ] " }],
};

export const STORAGE_MEMOS = "memos-data";
export const STORAGE_SETTINGS = "settings";
export const TAB_TYPE = "day-memo-tab";
export const DOCK_TYPE = "day-memo-dock";
