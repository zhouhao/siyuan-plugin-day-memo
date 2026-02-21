import { confirm, showMessage } from "siyuan";
import { MemoDataStore } from "../store";
import { Memo } from "../types";
import { MemoEditor } from "./MemoEditor";
import { MemoList } from "./MemoList";
import { FilterBar } from "./FilterBar";
import { Sidebar } from "./Sidebar";

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
            onDelete: (memo: Memo) => this.handleDelete(memo),
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
        };

        this.memoList = new MemoList(listContainer, this.store, this.i18n, callbacks);
    }

    private handleDelete(memo: Memo): void {
        confirm(
            "\u26a0\ufe0f",
            this.i18n.confirmDelete,
            () => {
                this.store.deleteMemo(memo.id);
                showMessage(this.i18n.memoDeleted);
            },
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
