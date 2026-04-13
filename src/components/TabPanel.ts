import { MemoDataStore } from "../store";
import { Memo } from "../types";
import { toggleChecklistItem } from "../utils";
import { MemoEditor } from "./MemoEditor";
import { MemoList } from "./MemoList";
import { FilterBar } from "./FilterBar";
import { Sidebar } from "./Sidebar";
import { showReminderDialog } from "./ReminderDialog";
import {
  handleDelete,
  handleAddToDailyNote,
  handleSendToFlomo,
  navigateToMemo,
} from "./panelActions";

export class TabPanel {
  private rootElement: HTMLElement;
  private store: MemoDataStore;
  private i18n: Record<string, string>;

  private sidebar: Sidebar;
  private editor: MemoEditor;
  private filterBar: FilterBar;
  private memoList: MemoList;

  constructor(
    rootElement: HTMLElement,
    store: MemoDataStore,
    i18n: Record<string, string>,
  ) {
    this.rootElement = rootElement;
    this.store = store;
    this.i18n = i18n;
    this.render();
  }

  private render(): void {
    this.rootElement.innerHTML = "";
    this.rootElement.className = "day-memo__tab fn__flex-1";

    const sidebarEl = document.createElement("div");
    sidebarEl.className = "day-memo__tab-sidebar";

    const mainEl = document.createElement("div");
    mainEl.className = "day-memo__tab-main";

    this.rootElement.appendChild(sidebarEl);
    this.rootElement.appendChild(mainEl);

    this.sidebar = new Sidebar(
      sidebarEl,
      this.store,
      this.i18n,
      (tag) => {
        this.store.setSelectedTag(tag);
        this.filterBar.updateTagFilter(tag);
      },
      (date) => {
        this.store.setSelectedDate(date);
        this.filterBar.updateDateFilter(date);
      },
    );

    const editorContainer = document.createElement("div");
    editorContainer.className = "day-memo__editor-container";
    mainEl.appendChild(editorContainer);

    const filterContainer = document.createElement("div");
    mainEl.appendChild(filterContainer);

    const listContainer = document.createElement("div");
    listContainer.className = "day-memo__tab-list-area";
    mainEl.appendChild(listContainer);

    this.editor = new MemoEditor(editorContainer, this.store, this.i18n);

    this.filterBar = new FilterBar(filterContainer, this.store, this.i18n);

    const callbacks = {
      onEdit: (memo: Memo) => this.editor.startEdit(memo),
      onDelete: (memo: Memo) => handleDelete(memo, this.store, this.i18n),
      onTogglePin: (memo: Memo) => {
        this.store.togglePin(memo.id);
      },
      onToggleArchive: (memo: Memo) => {
        this.store.toggleArchive(memo.id);
      },
      onTagClick: (tag: string) => {
        this.store.setSelectedTag(tag);
        this.filterBar.updateTagFilter(tag);
      },
      onToggleCheck: (memo: Memo, checkIndex: number) => {
        const newContent = toggleChecklistItem(memo.content, checkIndex);
        this.store.updateMemo(memo.id, newContent);
      },
      onAddToDailyNote: (memo: Memo) =>
        handleAddToDailyNote(memo, this.store, this.i18n),
      onSendToFlomo: (memo: Memo) =>
        handleSendToFlomo(memo, this.store, this.i18n),
      onSetReminder: (memo: Memo) =>
        showReminderDialog(memo, this.store, this.i18n),
      onAnnotate: (memo: Memo) => this.editor.startAnnotation(memo),
      onNavigateToMemo: (memoId: string) =>
        navigateToMemo(memoId, listContainer),
    };

    this.memoList = new MemoList(
      listContainer,
      this.store,
      this.i18n,
      callbacks,
    );
  }

  destroy(): void {
    this.sidebar?.destroy();
    this.editor?.destroy();
    this.filterBar?.destroy();
    this.memoList?.destroy();
    this.rootElement.innerHTML = "";
  }
}
