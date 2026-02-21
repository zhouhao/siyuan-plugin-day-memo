import { MemoDataStore } from "../store";
import { Memo } from "../types";

export class MemoEditor {
    private container: HTMLElement;
    private store: MemoDataStore;
    private i18n: Record<string, string>;
    private textarea: HTMLTextAreaElement;
    private saveBtn: HTMLButtonElement;
    private cancelBtn: HTMLButtonElement;
    private editingMemo: Memo | null = null;
    private onSaved: (() => void) | null = null;

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

    setOnSaved(callback: () => void): void {
        this.onSaved = callback;
    }

    private render(): void {
        this.container.innerHTML = "";
        this.container.className = "day-memo__editor";

        this.textarea = document.createElement("textarea");
        this.textarea.className = "day-memo__editor-textarea b3-text-field";
        this.textarea.placeholder = this.i18n.editorPlaceholder;
        this.textarea.rows = 3;
        this.textarea.addEventListener("input", () => this.autoResize());
        this.textarea.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                this.handleSave();
            }
        });

        const actions = document.createElement("div");
        actions.className = "day-memo__editor-actions";

        this.cancelBtn = document.createElement("button");
        this.cancelBtn.className = "b3-button b3-button--outline day-memo__editor-cancel";
        this.cancelBtn.textContent = this.i18n.cancel;
        this.cancelBtn.style.display = "none";
        this.cancelBtn.addEventListener("click", () => this.handleCancel());

        this.saveBtn = document.createElement("button");
        this.saveBtn.className = "b3-button day-memo__editor-save";
        this.saveBtn.textContent = this.i18n.saveMemo;
        this.saveBtn.addEventListener("click", () => this.handleSave());

        actions.appendChild(this.cancelBtn);
        actions.appendChild(this.saveBtn);

        this.container.appendChild(this.textarea);
        this.container.appendChild(actions);
    }

    private autoResize(): void {
        this.textarea.style.height = "auto";
        this.textarea.style.height = Math.min(this.textarea.scrollHeight, 200) + "px";
    }

    startEdit(memo: Memo): void {
        this.editingMemo = memo;
        this.textarea.value = memo.content;
        this.cancelBtn.style.display = "";
        this.saveBtn.textContent = this.i18n.saveMemo;
        this.textarea.focus();
        this.autoResize();
    }

    private handleCancel(): void {
        this.editingMemo = null;
        this.textarea.value = "";
        this.cancelBtn.style.display = "none";
        this.textarea.style.height = "auto";
    }

    private handleSave(): void {
        const content = this.textarea.value.trim();
        if (!content) return;

        if (this.editingMemo) {
            this.store.updateMemo(this.editingMemo.id, content);
            this.editingMemo = null;
            this.cancelBtn.style.display = "none";
        } else {
            this.store.createMemo(content);
        }

        this.textarea.value = "";
        this.textarea.style.height = "auto";
        this.onSaved?.();
    }

    destroy(): void {
        this.container.innerHTML = "";
    }
}
