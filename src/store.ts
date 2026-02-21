import type { Plugin } from "siyuan";
import { Memo, MemoStore, STORAGE_MEMOS, FilterState, MemoFilter } from "./types";
import { generateId, extractTags, formatDate } from "./utils";

const INITIAL_STORE: MemoStore = { memos: [], version: 1 };

export class MemoDataStore {
    private plugin: Plugin;
    private store: MemoStore = { ...INITIAL_STORE };
    private listeners: Array<() => void> = [];
    private filterState: FilterState = {
        filter: "all",
        searchQuery: "",
        selectedTag: null,
        showArchived: false,
    };

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async load(): Promise<void> {
        const data = await this.plugin.loadData(STORAGE_MEMOS);
        if (data && data.memos) {
            this.store = data as MemoStore;
        } else {
            this.store = { ...INITIAL_STORE };
        }
    }

    private async persist(): Promise<void> {
        await this.plugin.saveData(STORAGE_MEMOS, this.store);
    }

    private notify(): void {
        this.listeners.forEach((fn) => fn());
    }

    subscribe(listener: () => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((fn) => fn !== listener);
        };
    }

    createMemo(content: string): Memo {
        const now = Date.now();
        const memo: Memo = {
            id: generateId(),
            content: content.trim(),
            tags: extractTags(content),
            pinned: false,
            archived: false,
            createdAt: now,
            updatedAt: now,
        };
        this.store.memos.unshift(memo);
        this.persist();
        this.notify();
        return memo;
    }

    updateMemo(id: string, content: string): Memo | null {
        const memo = this.store.memos.find((m) => m.id === id);
        if (!memo) return null;
        memo.content = content.trim();
        memo.tags = extractTags(content);
        memo.updatedAt = Date.now();
        this.persist();
        this.notify();
        return memo;
    }

    deleteMemo(id: string): boolean {
        const idx = this.store.memos.findIndex((m) => m.id === id);
        if (idx === -1) return false;
        this.store.memos.splice(idx, 1);
        this.persist();
        this.notify();
        return true;
    }

    togglePin(id: string): Memo | null {
        const memo = this.store.memos.find((m) => m.id === id);
        if (!memo) return null;
        memo.pinned = !memo.pinned;
        memo.updatedAt = Date.now();
        this.persist();
        this.notify();
        return memo;
    }

    toggleArchive(id: string): Memo | null {
        const memo = this.store.memos.find((m) => m.id === id);
        if (!memo) return null;
        memo.archived = !memo.archived;
        memo.updatedAt = Date.now();
        this.persist();
        this.notify();
        return memo;
    }

    getMemo(id: string): Memo | undefined {
        return this.store.memos.find((m) => m.id === id);
    }

    getFilteredMemos(): Memo[] {
        let memos = [...this.store.memos];
        const { filter, searchQuery, selectedTag, showArchived } = this.filterState;

        if (filter === "pinned") {
            memos = memos.filter((m) => m.pinned && !m.archived);
        } else if (filter === "archived") {
            memos = memos.filter((m) => m.archived);
        } else {
            if (!showArchived) {
                memos = memos.filter((m) => !m.archived);
            }
        }

        if (selectedTag) {
            memos = memos.filter((m) => m.tags.includes(selectedTag));
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            memos = memos.filter((m) => m.content.toLowerCase().includes(q));
        }

        // Pinned first, then by creation date descending
        memos.sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return b.createdAt - a.createdAt;
        });

        return memos;
    }

    getAllTags(): Array<{ tag: string; count: number }> {
        const tagMap = new Map<string, number>();
        for (const memo of this.store.memos) {
            if (memo.archived) continue;
            for (const tag of memo.tags) {
                tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
            }
        }
        return Array.from(tagMap.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count);
    }

    getTotalCount(): number {
        return this.store.memos.filter((m) => !m.archived).length;
    }

    getFilter(): FilterState {
        return { ...this.filterState };
    }

    setFilter(filter: MemoFilter): void {
        this.filterState.filter = filter;
        this.notify();
    }

    setSearchQuery(query: string): void {
        this.filterState.searchQuery = query;
        this.notify();
    }

    setSelectedTag(tag: string | null): void {
        this.filterState.selectedTag = tag;
        this.notify();
    }

    setShowArchived(show: boolean): void {
        this.filterState.showArchived = show;
        this.notify();
    }

    clearFilters(): void {
        this.filterState = {
            filter: "all",
            searchQuery: "",
            selectedTag: null,
            showArchived: false,
        };
        this.notify();
    }

    getMemosCountByDate(): Map<string, number> {
        const counts = new Map<string, number>();
        for (const memo of this.store.memos) {
            const dateKey = formatDate(memo.createdAt);
            counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
        }
        return counts;
    }

    getDaysActive(): number {
        const uniqueDays = new Set<string>();
        for (const memo of this.store.memos) {
            uniqueDays.add(formatDate(memo.createdAt));
        }
        return uniqueDays.size;
    }
}
