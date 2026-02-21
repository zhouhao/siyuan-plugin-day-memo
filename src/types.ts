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
    showArchived: boolean;
}

export interface PluginConfig {
    dockPosition: "LeftTop" | "LeftBottom" | "RightTop" | "RightBottom";
}

export const DEFAULT_CONFIG: PluginConfig = {
    dockPosition: "RightTop",
};

export const STORAGE_MEMOS = "memos-data";
export const STORAGE_CONFIG = "plugin-config";
export const DOCK_TYPE = "day-memo-dock";
