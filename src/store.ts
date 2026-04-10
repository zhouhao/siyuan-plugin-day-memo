import type { Plugin } from "siyuan";
import {
  Memo,
  MemoStore,
  STORAGE_MEMOS,
  STORAGE_SETTINGS,
  FilterState,
  MemoFilter,
  TagTreeNode,
  PluginSettings,
  DEFAULT_SETTINGS,
} from "./types";
import { generateId, extractTags, formatDate } from "./utils";

const INITIAL_STORE: MemoStore = { memos: [], version: 1 };

export class MemoDataStore {
  private plugin: Plugin;
  private store: MemoStore = { ...INITIAL_STORE };
  private settings: PluginSettings = { ...DEFAULT_SETTINGS };
  private listeners: Array<() => void> = [];
  private filterState: FilterState = {
    filter: "all",
    searchQuery: "",
    selectedTag: null,
    selectedDate: null,
    showArchived: false,
  };

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  async load(): Promise<void> {
    const remote = await this.plugin.loadData(STORAGE_MEMOS);
    if (!remote || !remote.memos) {
      this.store = { ...INITIAL_STORE };
      return;
    }
    const remoteMemos = (remote as MemoStore).memos;
    if (this.store.memos.length === 0) {
      this.store = {
        ...(remote as MemoStore),
        memos: remoteMemos.filter((m) => !m.deleted),
      };
      return;
    }
    this.store.memos = this.mergeMemos(this.store.memos, remoteMemos);
  }

  private mergeMemos(local: Memo[], remote: Memo[]): Memo[] {
    const merged = new Map<string, Memo>();
    for (const m of remote) {
      merged.set(m.id, m);
    }
    for (const m of local) {
      const existing = merged.get(m.id);
      if (!existing || m.updatedAt >= existing.updatedAt) {
        merged.set(m.id, m);
      }
    }
    return Array.from(merged.values())
      .filter((m) => !m.deleted)
      .sort((a, b) => b.createdAt - a.createdAt);
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

  createAnnotation(parentId: string, content: string): Memo | null {
    const parent = this.store.memos.find((m) => m.id === parentId);
    if (!parent) return null;
    const now = Date.now();
    const annotation: Memo = {
      id: generateId(),
      content: content.trim(),
      tags: extractTags(content),
      pinned: false,
      archived: false,
      annotationOf: parentId,
      createdAt: now,
      updatedAt: now,
    };
    this.store.memos.unshift(annotation);
    if (!parent.annotations) parent.annotations = [];
    parent.annotations.push(annotation.id);
    parent.updatedAt = now;
    this.persist();
    this.notify();
    return annotation;
  }

  removeAnnotationLink(annotationId: string, parentId: string): void {
    const parent = this.store.memos.find((m) => m.id === parentId);
    if (parent && parent.annotations) {
      parent.annotations = parent.annotations.filter((id) => id !== annotationId);
      parent.updatedAt = Date.now();
    }
    this.persist();
    this.notify();
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
    const memo = this.store.memos.find((m) => m.id === id);
    if (!memo) return false;
    // Clean up annotation links
    if (memo.annotationOf) {
      const parent = this.store.memos.find((m) => m.id === memo.annotationOf);
      if (parent && parent.annotations) {
        parent.annotations = parent.annotations.filter((aid) => aid !== id);
        parent.updatedAt = Date.now();
      }
    }
    // Clean up child annotations' back-references when deleting a parent memo
    if (memo.annotations && memo.annotations.length > 0) {
      for (const aid of memo.annotations) {
        const child = this.store.memos.find((m) => m.id === aid);
        if (child && child.annotationOf === id) {
          delete child.annotationOf;
          child.updatedAt = Date.now();
        }
      }
    }
    memo.deleted = true;
    memo.updatedAt = Date.now();
    this.persist();
    this.store.memos = this.store.memos.filter((m) => !m.deleted);
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

  setReminder(id: string, reminderAt: number): Memo | null {
    const memo = this.store.memos.find((m) => m.id === id);
    if (!memo) return null;
    memo.reminderAt = reminderAt;
    memo.updatedAt = Date.now();
    this.persist();
    this.notify();
    return memo;
  }

  clearReminder(id: string): Memo | null {
    const memo = this.store.memos.find((m) => m.id === id);
    if (!memo) return null;
    delete memo.reminderAt;
    memo.updatedAt = Date.now();
    this.persist();
    this.notify();
    return memo;
  }

  getAllMemos(): Memo[] {
    return [...this.store.memos];
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
      const prefix = selectedTag + "/";
      memos = memos.filter((m) =>
        m.tags.some((t) => t === selectedTag || t.startsWith(prefix)),
      );
    }

    if (this.filterState.selectedDate) {
      const dateStr = this.filterState.selectedDate;
      memos = memos.filter((m) => formatDate(m.createdAt) === dateStr);
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

  getTagTree(): TagTreeNode[] {
    const tags = this.getAllTags();
    const root: TagTreeNode[] = [];

    for (const { tag, count } of tags) {
      const parts = tag.split("/");
      let siblings = root;

      for (let i = 0; i < parts.length; i++) {
        const fullPath = parts.slice(0, i + 1).join("/");
        let node = siblings.find((n) => n.fullPath === fullPath);
        if (!node) {
          node = { name: parts[i], fullPath, count: 0, children: [] };
          siblings.push(node);
        }
        if (i === parts.length - 1) {
          node.count += count;
        }
        siblings = node.children;
      }
    }

    const sortTree = (nodes: TagTreeNode[]): void => {
      nodes.sort((a, b) => {
        const totalA = this.getSubtreeCount(a);
        const totalB = this.getSubtreeCount(b);
        return totalB - totalA;
      });
      nodes.forEach((n) => sortTree(n.children));
    };
    sortTree(root);

    return root;
  }

  getSubtreeCount(node: TagTreeNode): number {
    let total = node.count;
    for (const child of node.children) {
      total += this.getSubtreeCount(child);
    }
    return total;
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

  setSelectedDate(date: string | null): void {
    this.filterState.selectedDate = date;
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
      selectedDate: null,
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

  getRandomMemos(count: number): Memo[] {
    const activeMemos = this.store.memos.filter((m) => !m.archived);
    if (activeMemos.length === 0) return [];
    const shuffled = [...activeMemos];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  getDaysActive(): number {
    const uniqueDays = new Set<string>();
    for (const memo of this.store.memos) {
      uniqueDays.add(formatDate(memo.createdAt));
    }
    return uniqueDays.size;
  }

  async loadSettings(): Promise<void> {
    const data = await this.plugin.loadData(STORAGE_SETTINGS);
    if (data) {
      this.settings = { ...DEFAULT_SETTINGS, ...data };
    }
  }

  async saveSettings(settings: PluginSettings): Promise<void> {
    this.settings = { ...settings };
    await this.plugin.saveData(STORAGE_SETTINGS, this.settings);
  }

  getSettings(): PluginSettings {
    return { ...this.settings };
  }
}
