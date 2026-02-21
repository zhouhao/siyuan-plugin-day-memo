import { confirm, showMessage } from "siyuan";
import { MemoDataStore } from "../store";
import { Memo } from "../types";
import { MemoEditor } from "./MemoEditor";
import { MemoList } from "./MemoList";
import { FilterBar } from "./FilterBar";
import { TagList } from "./TagList";

export class DockPanel {
    private rootElement: HTMLElement;
    private store: MemoDataStore;
    private i18n: Record<string, string>;
    private isMobile: boolean;

    private editor: MemoEditor;
    private filterBar: FilterBar;
    private tagList: TagList;
    private memoList: MemoList;

    constructor(
        rootElement: HTMLElement,
        store: MemoDataStore,
        i18n: Record<string, string>,
        isMobile: boolean,
    ) {
        this.rootElement = rootElement;
        this.store = store;
        this.i18n = i18n;
        this.isMobile = isMobile;
        this.render();
    }

    private render(): void {
        this.rootElement.innerHTML = "";
        this.rootElement.className = "day-memo__dock fn__flex-1 fn__flex-column";

        if (!this.isMobile) {
            const toolbar = document.createElement("div");
            toolbar.className = "block__icons day-memo__toolbar";
            toolbar.innerHTML = `
                <div class="block__logo">
                    <svg class="block__logoicon"><use xlink:href="#iconDayMemo"></use></svg>
                    <span>${this.i18n.dockTitle}</span>
                </div>
                <span class="fn__flex-1 fn__space"></span>
                <span class="day-memo__memo-count"></span>
            `;
            this.rootElement.appendChild(toolbar);
        }

        const editorContainer = document.createElement("div");
        editorContainer.className = "day-memo__editor-container";
        this.rootElement.appendChild(editorContainer);

        const filterContainer = document.createElement("div");
        this.rootElement.appendChild(filterContainer);

        const body = document.createElement("div");
        body.className = "day-memo__body fn__flex-1";

        const tagContainer = document.createElement("div");
        body.appendChild(tagContainer);

        const listContainer = document.createElement("div");
        listContainer.className = "fn__flex-1";
        body.appendChild(listContainer);

        this.rootElement.appendChild(body);

        this.editor = new MemoEditor(editorContainer, this.store, this.i18n);
        this.editor.setOnSaved(() => this.updateCount());

        this.filterBar = new FilterBar(filterContainer, this.store, this.i18n);

        const callbacks = {
            onEdit: (memo: Memo) => this.editor.startEdit(memo),
            onDelete: (memo: Memo) => this.handleDelete(memo),
            onTogglePin: (memo: Memo) => {
                this.store.togglePin(memo.id);
            },
            onToggleArchive: (memo: Memo) => {
                this.store.toggleArchive(memo.id);
                this.updateCount();
            },
            onTagClick: (tag: string) => {
                this.store.setSelectedTag(tag);
                this.filterBar.updateTagFilter(tag);
            },
        };

        this.tagList = new TagList(tagContainer, this.store, this.i18n, (tag) => {
            this.store.setSelectedTag(tag);
            this.filterBar.updateTagFilter(tag);
        });

        this.memoList = new MemoList(listContainer, this.store, this.i18n, callbacks);

        this.store.subscribe(() => this.updateCount());
        this.updateCount();
    }

    private handleDelete(memo: Memo): void {
        confirm(
            "⚠️",
            this.i18n.confirmDelete,
            () => {
                this.store.deleteMemo(memo.id);
                showMessage(this.i18n.memoDeleted);
                this.updateCount();
            },
        );
    }

    private updateCount(): void {
        const countEl = this.rootElement.querySelector(".day-memo__memo-count");
        if (countEl) {
            const count = this.store.getTotalCount();
            countEl.textContent = this.i18n.totalMemos.replace("{count}", String(count));
        }
    }

    destroy(): void {
        this.editor?.destroy();
        this.filterBar?.destroy();
        this.tagList?.destroy();
        this.memoList?.destroy();
        this.rootElement.innerHTML = "";
    }
}
