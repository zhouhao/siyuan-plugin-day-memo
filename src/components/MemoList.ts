import { MemoDataStore } from "../store";
import { Memo } from "../types";
import { groupByDate, formatRelativeDate } from "../utils";
import { MemoItem, MemoItemCallbacks } from "./MemoItem";

export class MemoList {
    private container: HTMLElement;
    private store: MemoDataStore;
    private i18n: Record<string, string>;
    private callbacks: MemoItemCallbacks;
    private unsubscribe: (() => void) | null = null;

    constructor(
        container: HTMLElement,
        store: MemoDataStore,
        i18n: Record<string, string>,
        callbacks: MemoItemCallbacks,
    ) {
        this.container = container;
        this.store = store;
        this.i18n = i18n;
        this.callbacks = callbacks;
        this.container.className = "day-memo__list";
        this.unsubscribe = this.store.subscribe(() => this.render());
        this.render();
    }

    render(): void {
        this.container.innerHTML = "";
        const memos = this.store.getFilteredMemos();

        if (memos.length === 0) {
            const empty = document.createElement("div");
            empty.className = "day-memo__empty";
            const filter = this.store.getFilter();
            empty.textContent =
                filter.searchQuery || filter.selectedTag
                    ? this.i18n.noResults
                    : this.i18n.noMemos;
            this.container.appendChild(empty);
            return;
        }

        const groups = groupByDate(memos);
        const sortedDays = Array.from(groups.keys()).sort((a, b) => b - a);

        for (const dayStart of sortedDays) {
            const dayMemos = groups.get(dayStart)!;

            const dateHeader = document.createElement("div");
            dateHeader.className = "day-memo__date-header";
            dateHeader.textContent = formatRelativeDate(dayStart, this.i18n);
            this.container.appendChild(dateHeader);

            for (const memo of dayMemos) {
                const item = new MemoItem(memo, this.callbacks, this.i18n);
                this.container.appendChild(item.getElement());
            }
        }
    }

    destroy(): void {
        this.unsubscribe?.();
        this.container.innerHTML = "";
    }
}
