import { MemoDataStore } from "../store";
import { MemoFilter } from "../types";
import { debounce } from "../utils";

export class FilterBar {
    private container: HTMLElement;
    private store: MemoDataStore;
    private i18n: Record<string, string>;
    private searchInput: HTMLInputElement;

    constructor(
        container: HTMLElement,
        store: MemoDataStore,
        i18n: Record<string, string>,
    ) {
        this.container = container;
        this.store = store;
        this.i18n = i18n;
        this.render();
    }

    private render(): void {
        this.container.innerHTML = "";
        this.container.className = "day-memo__filter-bar";

        const tabs = document.createElement("div");
        tabs.className = "day-memo__filter-tabs";

        const filters: Array<{ key: MemoFilter; label: string }> = [
            { key: "all", label: this.i18n.allMemos },
            { key: "pinned", label: this.i18n.pinned },
            { key: "archived", label: this.i18n.archived },
        ];

        const currentFilter = this.store.getFilter();

        for (const f of filters) {
            const btn = document.createElement("button");
            btn.className = "day-memo__filter-tab";
            if (currentFilter.filter === f.key) {
                btn.classList.add("day-memo__filter-tab--active");
            }
            btn.textContent = f.label;
            btn.addEventListener("click", () => {
                this.store.setFilter(f.key);
                this.updateActiveTab(f.key);
            });
            btn.dataset.filter = f.key;
            tabs.appendChild(btn);
        }

        const searchWrapper = document.createElement("div");
        searchWrapper.className = "day-memo__search-wrapper";

        this.searchInput = document.createElement("input");
        this.searchInput.type = "text";
        this.searchInput.className = "day-memo__search-input b3-text-field";
        this.searchInput.placeholder = this.i18n.search;
        this.searchInput.value = currentFilter.searchQuery;

        const debouncedSearch = debounce((value: string) => {
            this.store.setSearchQuery(value);
        }, 200);

        this.searchInput.addEventListener("input", () => {
            debouncedSearch(this.searchInput.value);
        });

        const clearBtn = document.createElement("button");
        clearBtn.className = "day-memo__search-clear";
        clearBtn.innerHTML = "✕";
        clearBtn.title = this.i18n.clearFilter;
        clearBtn.addEventListener("click", () => {
            this.searchInput.value = "";
            this.store.setSearchQuery("");
        });

        searchWrapper.appendChild(this.searchInput);
        searchWrapper.appendChild(clearBtn);

        this.container.appendChild(tabs);
        this.container.appendChild(searchWrapper);
    }

    private updateActiveTab(activeFilter: MemoFilter): void {
        const tabs = this.container.querySelectorAll(".day-memo__filter-tab");
        tabs.forEach((tab) => {
            const el = tab as HTMLElement;
            el.classList.toggle(
                "day-memo__filter-tab--active",
                el.dataset.filter === activeFilter,
            );
        });
    }

    updateDateFilter(date: string | null): void {
        const existing = this.container.querySelector(".day-memo__active-date");
        if (existing) existing.remove();

        if (date) {
            const dateBadge = document.createElement("div");
            dateBadge.className = "day-memo__active-date";
            dateBadge.innerHTML = `<span>📅 ${date}</span><button class="day-memo__active-date-clear">✕</button>`;
            dateBadge.querySelector(".day-memo__active-date-clear")!.addEventListener(
                "click",
                () => {
                    this.store.setSelectedDate(null);
                    dateBadge.remove();
                },
            );
            this.container.appendChild(dateBadge);
        }
    }

    updateTagFilter(tag: string | null): void {
        const existing = this.container.querySelector(".day-memo__active-tag");
        if (existing) existing.remove();

        if (tag) {
            const tagBadge = document.createElement("div");
            tagBadge.className = "day-memo__active-tag";
            tagBadge.innerHTML = `<span>#${tag}</span><button class="day-memo__active-tag-clear">✕</button>`;
            tagBadge.querySelector(".day-memo__active-tag-clear")!.addEventListener(
                "click",
                () => {
                    this.store.setSelectedTag(null);
                    tagBadge.remove();
                },
            );
            this.container.appendChild(tagBadge);
        }
    }

    destroy(): void {
        this.container.innerHTML = "";
    }
}
