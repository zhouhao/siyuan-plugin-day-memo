export interface Memo {
  id: string;
  content: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  deleted?: boolean;
  reminderAt?: number;
  annotationOf?: string;
  annotations?: string[];
  sourceBlockId?: string;
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

export interface MemoTemplate {
  id: string;
  name: string;
  content: string;
}

export interface PluginSettings {
  dailyNotePathTemplate: string;
  enableReplacementRules?: boolean;
  replacementRules?: ReplacementRule[];
  useCurrentDateForDailyNote?: boolean;
  templates?: MemoTemplate[];
  tagTriggerEnabled?: boolean;
  triggerTag?: string;
  flomoWebhookUrl?: string;
  flomoSyncEnabled?: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  dailyNotePathTemplate: "",
  enableReplacementRules: false,
  replacementRules: [{ match: "^#任务 ", replace: "- [ ] " }],
  useCurrentDateForDailyNote: false,
  tagTriggerEnabled: false,
  triggerTag: "to-memo",
  flomoWebhookUrl: "",
  flomoSyncEnabled: false,
};

export const STORAGE_MEMOS = "memos-data";
export const STORAGE_SETTINGS = "settings";
export const TAB_TYPE = "day-memo-tab";
export const DOCK_TYPE = "day-memo-dock";
