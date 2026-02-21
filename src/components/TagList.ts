import { MemoDataStore } from "../store";

export class TagList {
    private container: HTMLElement;
    private store: MemoDataStore;
    private i18n: Record<string, string>;
    private onTagSelect: (tag: string | null) => void;
    private unsubscribe: (() => void) | null = null;

    constructor(
        container: HTMLElement,
        store: MemoDataStore,
        i18n: Record<string, string>,
        onTagSelect: (tag: string | null) => void,
    ) {
        this.container = container;
        this.store = store;
        this.i18n = i18n;
        this.onTagSelect = onTagSelect;
        this.container.className = "day-memo__tag-list";
        this.unsubscribe = this.store.subscribe(() => this.render());
        this.render();
    }

    render(): void {
        this.container.innerHTML = "";
        const tags = this.store.getAllTags();
        const currentFilter = this.store.getFilter();

        if (tags.length === 0) return;

        const header = document.createElement("div");
        header.className = "day-memo__tag-list-header";
        header.textContent = this.i18n.tags;
        this.container.appendChild(header);

        const list = document.createElement("div");
        list.className = "day-memo__tag-list-items";

        for (const { tag, count } of tags) {
            const item = document.createElement("button");
            item.className = "day-memo__tag-list-item";
            if (currentFilter.selectedTag === tag) {
                item.classList.add("day-memo__tag-list-item--active");
            }

            const tagName = document.createElement("span");
            tagName.className = "day-memo__tag-list-name";
            tagName.textContent = `#${tag}`;

            const tagCount = document.createElement("span");
            tagCount.className = "day-memo__tag-list-count";
            tagCount.textContent = String(count);

            item.appendChild(tagName);
            item.appendChild(tagCount);

            item.addEventListener("click", () => {
                const isActive = currentFilter.selectedTag === tag;
                this.onTagSelect(isActive ? null : tag);
            });

            list.appendChild(item);
        }

        this.container.appendChild(list);
    }

    destroy(): void {
        this.unsubscribe?.();
        this.container.innerHTML = "";
    }
}
