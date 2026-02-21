import { MemoDataStore } from "../store";
import { getHeatmapDateRange, getHeatmapLevel } from "../utils";

export class Heatmap {
    private container: HTMLElement;
    private store: MemoDataStore;
    private i18n: Record<string, string>;
    private onDateClick: (date: string) => void;
    private unsubscribe: (() => void) | null = null;

    constructor(
        container: HTMLElement,
        store: MemoDataStore,
        i18n: Record<string, string>,
        onDateClick: (date: string) => void,
    ) {
        this.container = container;
        this.store = store;
        this.i18n = i18n;
        this.onDateClick = onDateClick;
        this.unsubscribe = this.store.subscribe(() => this.render());
        this.render();
    }

    render(): void {
        this.container.innerHTML = "";
        this.container.className = "day-memo__heatmap";

        const dates = getHeatmapDateRange(15);
        const counts = this.store.getMemosCountByDate();
        const weeks = 15;

        const grid = document.createElement("div");
        grid.className = "day-memo__heatmap-grid";
        grid.style.gridTemplateColumns = `repeat(${weeks}, 1fr)`;

        // Build cells column-by-column (each column = 1 week, 7 rows = Sun-Sat)
        for (let col = 0; col < weeks; col++) {
            for (let row = 0; row < 7; row++) {
                const idx = col * 7 + row;
                const dateStr = dates[idx];
                if (!dateStr) continue;

                const count = counts.get(dateStr) || 0;
                const level = getHeatmapLevel(count);

                const cell = document.createElement("div");
                cell.className = `day-memo__heatmap-cell day-memo__heatmap-cell--l${level}`;
                cell.dataset.date = dateStr;
                cell.dataset.count = String(count);
                cell.title = `${dateStr}: ${count} ${count === 1 ? "memo" : "memos"}`;

                const today = new Date();
                const cellDate = new Date(dateStr + "T00:00:00");
                if (cellDate > today) {
                    cell.classList.add("day-memo__heatmap-cell--future");
                }

                cell.addEventListener("click", () => {
                    if (count > 0) {
                        this.onDateClick(dateStr);
                    }
                });

                grid.appendChild(cell);
            }
        }

        this.container.appendChild(grid);
    }

    destroy(): void {
        this.unsubscribe?.();
        this.container.innerHTML = "";
    }
}
