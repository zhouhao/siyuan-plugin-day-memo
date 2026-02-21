import { MemoDataStore } from "../store";
import { formatDate, getHeatmapLevel } from "../utils";

const WEEKDAY_KEYS = ["weekSun", "weekMon", "weekTue", "weekWed", "weekThu", "weekFri", "weekSat"];
const WEEKDAY_FALLBACK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_KEYS = [
    "monthJan", "monthFeb", "monthMar", "monthApr", "monthMay", "monthJun",
    "monthJul", "monthAug", "monthSep", "monthOct", "monthNov", "monthDec",
];
const MONTH_FALLBACK = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export class Heatmap {
    private container: HTMLElement;
    private store: MemoDataStore;
    private i18n: Record<string, string>;
    private onDateClick: (date: string | null) => void;
    private unsubscribe: (() => void) | null = null;
    private viewYear: number;
    private viewMonth: number;

    constructor(
        container: HTMLElement,
        store: MemoDataStore,
        i18n: Record<string, string>,
        onDateClick: (date: string | null) => void,
    ) {
        this.container = container;
        this.store = store;
        this.i18n = i18n;
        this.onDateClick = onDateClick;
        const now = new Date();
        this.viewYear = now.getFullYear();
        this.viewMonth = now.getMonth();
        this.unsubscribe = this.store.subscribe(() => this.renderGrid());
        this.render();
    }

    private render(): void {
        this.container.innerHTML = "";
        this.container.className = "day-memo__calendar";

        const header = document.createElement("div");
        header.className = "day-memo__calendar-header";

        const prevBtn = document.createElement("button");
        prevBtn.className = "day-memo__calendar-nav b3-button b3-button--outline";
        prevBtn.innerHTML = "&#x276E;";
        prevBtn.addEventListener("click", () => this.navigate(-1));

        const title = document.createElement("span");
        title.className = "day-memo__calendar-title";

        const nextBtn = document.createElement("button");
        nextBtn.className = "day-memo__calendar-nav b3-button b3-button--outline";
        nextBtn.innerHTML = "&#x276F;";
        nextBtn.addEventListener("click", () => this.navigate(1));

        header.appendChild(prevBtn);
        header.appendChild(title);
        header.appendChild(nextBtn);
        this.container.appendChild(header);

        const weekRow = document.createElement("div");
        weekRow.className = "day-memo__calendar-weekdays";
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement("div");
            cell.className = "day-memo__calendar-weekday";
            cell.textContent = this.i18n[WEEKDAY_KEYS[i]] || WEEKDAY_FALLBACK[i];
            weekRow.appendChild(cell);
        }
        this.container.appendChild(weekRow);

        const grid = document.createElement("div");
        grid.className = "day-memo__calendar-grid";
        this.container.appendChild(grid);

        this.renderGrid();
    }

    private renderGrid(): void {
        const title = this.container.querySelector(".day-memo__calendar-title");
        if (title) {
            const name = this.i18n[MONTH_KEYS[this.viewMonth]] || MONTH_FALLBACK[this.viewMonth];
            title.textContent = `${name} ${this.viewYear}`;
        }

        const grid = this.container.querySelector(".day-memo__calendar-grid");
        if (!grid) return;
        grid.innerHTML = "";

        const counts = this.store.getMemosCountByDate();
        const selectedDate = this.store.getFilter().selectedDate;
        const todayStr = formatDate(Date.now());

        const startDow = new Date(this.viewYear, this.viewMonth, 1).getDay();
        const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();

        for (let i = 0; i < startDow; i++) {
            const empty = document.createElement("div");
            empty.className = "day-memo__calendar-cell day-memo__calendar-cell--empty";
            grid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = formatDate(new Date(this.viewYear, this.viewMonth, day).getTime());
            const count = counts.get(dateStr) || 0;
            const level = getHeatmapLevel(count);

            const cell = document.createElement("div");
            cell.className = "day-memo__calendar-cell";
            if (level > 0) cell.classList.add(`day-memo__calendar-cell--l${level}`);
            if (dateStr === todayStr) cell.classList.add("day-memo__calendar-cell--today");
            if (dateStr === selectedDate) cell.classList.add("day-memo__calendar-cell--selected");

            const dayNum = document.createElement("span");
            dayNum.className = "day-memo__calendar-day";
            dayNum.textContent = String(day);
            cell.appendChild(dayNum);

            if (count > 0) {
                const dot = document.createElement("span");
                dot.className = "day-memo__calendar-dot";
                cell.appendChild(dot);
                cell.title = `${count} memo${count > 1 ? "s" : ""}`;
            }

            cell.addEventListener("click", () => {
                this.onDateClick(selectedDate === dateStr ? null : dateStr);
            });

            grid.appendChild(cell);
        }
    }

    private navigate(delta: number): void {
        this.viewMonth += delta;
        if (this.viewMonth > 11) {
            this.viewMonth = 0;
            this.viewYear++;
        } else if (this.viewMonth < 0) {
            this.viewMonth = 11;
            this.viewYear--;
        }
        this.renderGrid();
    }

    destroy(): void {
        this.unsubscribe?.();
        this.container.innerHTML = "";
    }
}
