import { Menu } from "siyuan";
import { Memo } from "../types";
import { MemoDataStore } from "../store";
import { renderMarkdown, formatDate, formatTime, renderMermaidBlocks } from "../utils";

export interface MemoItemCallbacks {
    onEdit: (memo: Memo) => void;
    onDelete: (memo: Memo) => void;
    onTogglePin: (memo: Memo) => void;
    onToggleArchive: (memo: Memo) => void;
    onTagClick: (tag: string) => void;
    onToggleCheck?: (memo: Memo, checkIndex: number) => void;
    onAddToDailyNote?: (memo: Memo) => void;
    onSetReminder?: (memo: Memo) => void;
    onAnnotate?: (memo: Memo) => void;
    onNavigateToMemo?: (memoId: string) => void;
}

export class MemoItem {
    private element: HTMLElement;
    private memo: Memo;
    private callbacks: MemoItemCallbacks;
    private i18n: Record<string, string>;
    private store: MemoDataStore;

    constructor(
        memo: Memo,
        callbacks: MemoItemCallbacks,
        i18n: Record<string, string>,
        store: MemoDataStore,
    ) {
        this.memo = memo;
        this.callbacks = callbacks;
        this.i18n = i18n;
        this.store = store;
        this.element = this.createElement();
    }

    getElement(): HTMLElement {
        return this.element;
    }

    private createElement(): HTMLElement {
        const el = document.createElement("div");
        el.className = "day-memo__item";
        if (this.memo.pinned) el.classList.add("day-memo__item--pinned");
        if (this.memo.archived) el.classList.add("day-memo__item--archived");
        el.dataset.memoId = this.memo.id;

        const header = document.createElement("div");
        header.className = "day-memo__item-header";

        const time = document.createElement("span");
        time.className = "day-memo__item-time";
        time.textContent = `${formatDate(this.memo.createdAt)} ${formatTime(this.memo.createdAt)}`;
        if (this.memo.updatedAt > this.memo.createdAt + 1000) {
            time.textContent += " (edited)";
        }

        const badges = document.createElement("span");
        badges.className = "day-memo__item-badges";
        if (this.memo.pinned) {
            const pin = document.createElement("span");
            pin.className = "day-memo__badge day-memo__badge--pin";
            pin.innerHTML = "📌";
            badges.appendChild(pin);
        }
        if (this.memo.reminderAt && this.memo.reminderAt > Date.now()) {
            const reminder = document.createElement("span");
            reminder.className = "day-memo__badge day-memo__badge--reminder b3-tooltips b3-tooltips__s";
            reminder.innerHTML = "🔔";
            reminder.setAttribute("aria-label", new Date(this.memo.reminderAt).toLocaleString());
            badges.appendChild(reminder);
        }

        header.appendChild(time);
        header.appendChild(badges);

        const content = document.createElement("div");
        content.className = "day-memo__item-content";
        content.innerHTML = renderMarkdown(this.memo.content);

        content.querySelectorAll(".day-memo__tag").forEach((tagEl) => {
            tagEl.addEventListener("click", (e) => {
                e.stopPropagation();
                const tag = (tagEl as HTMLElement).dataset.tag;
                if (tag) this.callbacks.onTagClick(tag);
            });
        });

        content.querySelectorAll(".day-memo__checkbox").forEach((checkbox) => {
            checkbox.addEventListener("change", (e) => {
                e.stopPropagation();
                const idx = parseInt((checkbox as HTMLElement).dataset.checkIndex || "0", 10);
                this.callbacks.onToggleCheck?.(this.memo, idx);
            });
        });

        content.addEventListener("dblclick", (e) => {
            const target = e.target as HTMLElement;
            if (target.closest(".day-memo__tag") ||
                target.closest(".day-memo__checkbox") ||
                target.closest("a")) {
                return;
            }
            e.preventDefault();
            this.callbacks.onEdit(this.memo);
        });

        el.addEventListener("contextmenu", (e) => {
            const target = e.target as HTMLElement;
            if (target.closest("a") || target.closest(".day-memo__checkbox")) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            this.showContextMenu(e.clientX, e.clientY);
        });

        const footer = document.createElement("div");
        footer.className = "day-memo__item-footer";

        const actions = document.createElement("div");
        actions.className = "day-memo__item-actions";

        const editBtn = this.createActionBtn("✏️", this.i18n.edit, () =>
            this.callbacks.onEdit(this.memo),
        );
        const pinBtn = this.createActionBtn(
            this.memo.pinned ? "📌" : "📍",
            this.memo.pinned ? this.i18n.unpin : this.i18n.pin,
            () => this.callbacks.onTogglePin(this.memo),
        );
        const archiveBtn = this.createActionBtn(
            this.memo.archived ? "📤" : "📥",
            this.memo.archived ? this.i18n.unarchive : this.i18n.archive,
            () => this.callbacks.onToggleArchive(this.memo),
        );
        const dailyNoteBtn = this.createActionBtn("📅", this.i18n.addToDailyNote || "Add to Daily Note", () =>
            this.callbacks.onAddToDailyNote?.(this.memo),
        );
        const annotateBtn = this.createActionBtn("💬", this.i18n.annotate || "Annotate", () =>
            this.callbacks.onAnnotate?.(this.memo),
        );
        const deleteBtn = this.createActionBtn("🗑️", this.i18n.delete, () =>
            this.callbacks.onDelete(this.memo),
        );
        deleteBtn.classList.add("day-memo__action--danger");

        actions.appendChild(editBtn);
        actions.appendChild(pinBtn);
        actions.appendChild(archiveBtn);
        actions.appendChild(annotateBtn);
        actions.appendChild(dailyNoteBtn);
        actions.appendChild(deleteBtn);
        footer.appendChild(actions);

        // Annotation links section
        const annotationLinks = this.createAnnotationLinks();

        el.appendChild(header);
        el.appendChild(content);
        if (annotationLinks) el.appendChild(annotationLinks);
        el.appendChild(footer);

        renderMermaidBlocks(el);

        return el;
    }

    private showContextMenu(x: number, y: number): void {
        const menu = new Menu("day-memo-context");

        menu.addItem({
            icon: "iconEdit",
            label: this.i18n.edit,
            click: () => {
                this.callbacks.onEdit(this.memo);
            },
        });

        menu.addItem({
            icon: "iconPin",
            label: this.memo.pinned ? this.i18n.unpin : this.i18n.pin,
            click: () => {
                this.callbacks.onTogglePin(this.memo);
            },
        });

        menu.addItem({
            icon: "iconInbox",
            label: this.memo.archived ? this.i18n.unarchive : this.i18n.archive,
            click: () => {
                this.callbacks.onToggleArchive(this.memo);
            },
        });

        menu.addItem({
            icon: "iconCalendar",
            label: this.i18n.addToDailyNote || "Add to Daily Note",
            click: () => {
                this.callbacks.onAddToDailyNote?.(this.memo);
            },
        });

        const hasReminder = this.memo.reminderAt && this.memo.reminderAt > Date.now();
        menu.addItem({
            iconHTML: "🔔",
            label: hasReminder
                ? (this.i18n.editReminder || "Edit Reminder")
                : (this.i18n.setReminder || "Set Reminder"),
            click: () => {
                this.callbacks.onSetReminder?.(this.memo);
            },
        });

        menu.addItem({
            iconHTML: "💬",
            label: this.i18n.annotate || "Annotate",
            click: () => {
                this.callbacks.onAnnotate?.(this.memo);
            },
        });

        menu.addSeparator();

        menu.addItem({
            icon: "iconCopy",
            label: this.i18n.copyContent || "Copy",
            click: () => {
                navigator.clipboard.writeText(this.memo.content);
            },
        });

        menu.addSeparator();

        menu.addItem({
            icon: "iconTrashcan",
            label: this.i18n.delete,
            click: () => {
                this.callbacks.onDelete(this.memo);
            },
        });

        menu.open({ x, y });
    }

    private createAnnotationLinks(): HTMLElement | null {
        const hasSource = !!this.memo.annotationOf;
        const hasAnnotations = this.memo.annotations && this.memo.annotations.length > 0;
        if (!hasSource && !hasAnnotations) return null;

        const container = document.createElement("div");
        container.className = "day-memo__annotation-links";

        if (hasSource) {
            const sourceMemo = this.store.getMemo(this.memo.annotationOf!);
            const link = document.createElement("a");
            link.className = "day-memo__annotation-link day-memo__annotation-link--source";
            link.href = "#";
            const preview = sourceMemo
                ? (sourceMemo.content.length > 40 ? sourceMemo.content.substring(0, 40) + "..." : sourceMemo.content)
                : this.memo.annotationOf!;
            link.innerHTML = `<span class="day-memo__annotation-link-icon">↩</span><span class="day-memo__annotation-link-label">${this.i18n.viewSource || "View Source"}</span><span class="day-memo__annotation-link-preview">${preview}</span>`;
            link.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.callbacks.onNavigateToMemo?.(this.memo.annotationOf!);
            });
            container.appendChild(link);
        }

        if (hasAnnotations) {
            const count = this.memo.annotations!.length;
            const label = document.createElement("a");
            label.className = "day-memo__annotation-link day-memo__annotation-link--annotations";
            label.href = "#";
            label.innerHTML = `<span class="day-memo__annotation-link-icon">💬</span><span class="day-memo__annotation-link-label">${(this.i18n.annotationCount || "{count} annotations").replace("{count}", String(count))}</span>`;
            label.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Navigate to the first annotation
                if (this.memo.annotations!.length > 0) {
                    this.callbacks.onNavigateToMemo?.(this.memo.annotations![0]);
                }
            });
            container.appendChild(label);
        }

        return container;
    }

    private createActionBtn(
        icon: string,
        title: string,
        onClick: () => void,
    ): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.className = "day-memo__action-btn b3-tooltips b3-tooltips__n";
        btn.setAttribute("aria-label", title);
        btn.innerHTML = icon;
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            onClick();
        });
        return btn;
    }
}
