import { MemoDataStore } from "../store";
import { debounce } from "../utils";
import { Heatmap } from "./Heatmap";
import { TagList } from "./TagList";

export class Sidebar {
    private container: HTMLElement;
    private store: MemoDataStore;
    private i18n: Record<string, string>;
    private heatmap: Heatmap;
    private tagList: TagList;
    private unsubscribe: (() => void) | null = null;
    private onTagSelect: (tag: string | null) => void;
    private onDateClick: (date: string) => void;

    constructor(
        container: HTMLElement,
        store: MemoDataStore,
        i18n: Record<string, string>,
        onTagSelect: (tag: string | null) => void,
        onDateClick: (date: string) => void,
    ) {
        this.container = container;
        this.store = store;
        this.i18n = i18n;
        this.onTagSelect = onTagSelect;
        this.onDateClick = onDateClick;
        this.render();
        this.unsubscribe = this.store.subscribe(() => this.updateStats());
    }

    private render(): void {
        this.container.innerHTML = "";
        this.container.className = "day-memo__sidebar";

        const searchWrapper = document.createElement("div");
        searchWrapper.className = "day-memo__sidebar-search";

        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "day-memo__search-input b3-text-field";
        searchInput.placeholder = this.i18n.search;

        const debouncedSearch = debounce((value: string) => {
            this.store.setSearchQuery(value);
        }, 200);

        searchInput.addEventListener("input", () => {
            debouncedSearch(searchInput.value);
        });

        const clearBtn = document.createElement("button");
        clearBtn.className = "day-memo__search-clear";
        clearBtn.innerHTML = "&#x2715;";
        clearBtn.addEventListener("click", () => {
            searchInput.value = "";
            this.store.setSearchQuery("");
        });

        searchWrapper.appendChild(searchInput);
        searchWrapper.appendChild(clearBtn);
        this.container.appendChild(searchWrapper);

        const heatmapSection = document.createElement("div");
        heatmapSection.className = "day-memo__sidebar-section";

        const heatmapHeader = document.createElement("div");
        heatmapHeader.className = "day-memo__sidebar-section-header";
        heatmapHeader.textContent = this.i18n.heatmapTitle || "Activity";
        heatmapSection.appendChild(heatmapHeader);

        const heatmapContainer = document.createElement("div");
        heatmapSection.appendChild(heatmapContainer);
        this.heatmap = new Heatmap(heatmapContainer, this.store, this.i18n, this.onDateClick);
        this.container.appendChild(heatmapSection);

        const tagSection = document.createElement("div");
        tagSection.className = "day-memo__sidebar-section";

        const tagContainer = document.createElement("div");
        tagSection.appendChild(tagContainer);
        this.tagList = new TagList(tagContainer, this.store, this.i18n, this.onTagSelect);
        this.container.appendChild(tagSection);

        const statsSection = document.createElement("div");
        statsSection.className = "day-memo__sidebar-stats";
        this.container.appendChild(statsSection);

        this.updateStats();
    }

    private updateStats(): void {
        const statsEl = this.container.querySelector(".day-memo__sidebar-stats");
        if (!statsEl) return;
        const total = this.store.getTotalCount();
        const daysActive = this.store.getDaysActive();
        const tags = this.store.getAllTags().length;

        statsEl.innerHTML = "";

        const items: Array<{ label: string; value: number }> = [
            { label: this.i18n.statMemos || "Memos", value: total },
            { label: this.i18n.statDays || "Days", value: daysActive },
            { label: this.i18n.statTags || "Tags", value: tags },
        ];

        for (const item of items) {
            const el = document.createElement("div");
            el.className = "day-memo__stat-item";
            el.innerHTML = `<span class="day-memo__stat-value">${item.value}</span><span class="day-memo__stat-label">${item.label}</span>`;
            statsEl.appendChild(el);
        }
    }

    destroy(): void {
        this.unsubscribe?.();
        this.heatmap?.destroy();
        this.tagList?.destroy();
        this.container.innerHTML = "";
    }
}
