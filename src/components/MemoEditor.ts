import { MemoDataStore } from "../store";
import { Memo } from "../types";
import { uploadAsset, pushErrMsg } from "../api";

const IMAGE_ACCEPT = "image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/bmp";

export class MemoEditor {
    private container: HTMLElement;
    private store: MemoDataStore;
    private i18n: Record<string, string>;
    private textarea: HTMLTextAreaElement;
    private saveBtn: HTMLButtonElement;
    private cancelBtn: HTMLButtonElement;
    private uploadBtn: HTMLButtonElement;
    private attachBtn: HTMLButtonElement;
    private fileInput: HTMLInputElement;
    private attachInput: HTMLInputElement;
    private previewContainer: HTMLElement;
    private editingMemo: Memo | null = null;
    private onSaved: (() => void) | null = null;
    private uploading = false;

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
        this.textarea.addEventListener("paste", (e) => this.handlePaste(e));
        this.textarea.addEventListener("dragover", (e) => {
            e.preventDefault();
            this.textarea.classList.add("day-memo__editor-textarea--dragover");
        });
        this.textarea.addEventListener("dragleave", () => {
            this.textarea.classList.remove("day-memo__editor-textarea--dragover");
        });
        this.textarea.addEventListener("drop", (e) => this.handleDrop(e));

        this.previewContainer = document.createElement("div");
        this.previewContainer.className = "day-memo__editor-preview";
        this.previewContainer.style.display = "none";

        this.fileInput = document.createElement("input");
        this.fileInput.type = "file";
        this.fileInput.accept = IMAGE_ACCEPT;
        this.fileInput.multiple = true;
        this.fileInput.style.display = "none";
        this.fileInput.addEventListener("change", () => {
            if (this.fileInput.files?.length) {
                this.handleUpload(Array.from(this.fileInput.files), "image");
                this.fileInput.value = "";
            }
        });

        this.attachInput = document.createElement("input");
        this.attachInput.type = "file";
        this.attachInput.multiple = true;
        this.attachInput.style.display = "none";
        this.attachInput.addEventListener("change", () => {
            if (this.attachInput.files?.length) {
                this.handleUpload(Array.from(this.attachInput.files), "attachment");
                this.attachInput.value = "";
            }
        });

        const actions = document.createElement("div");
        actions.className = "day-memo__editor-actions";

        const leftActions = document.createElement("div");
        leftActions.className = "day-memo__editor-actions-left";

        this.uploadBtn = document.createElement("button");
        this.uploadBtn.className = "day-memo__editor-upload b3-tooltips b3-tooltips__n";
        this.uploadBtn.setAttribute("aria-label", this.i18n.uploadImage || "Upload image");
        this.uploadBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
        this.uploadBtn.addEventListener("click", () => this.fileInput.click());

        this.attachBtn = document.createElement("button");
        this.attachBtn.className = "day-memo__editor-upload b3-tooltips b3-tooltips__n";
        this.attachBtn.setAttribute("aria-label", this.i18n.uploadAttachment || "Upload attachment");
        this.attachBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;
        this.attachBtn.addEventListener("click", () => this.attachInput.click());

        leftActions.appendChild(this.uploadBtn);
        leftActions.appendChild(this.attachBtn);
        leftActions.appendChild(this.fileInput);
        leftActions.appendChild(this.attachInput);

        const rightActions = document.createElement("div");
        rightActions.className = "day-memo__editor-actions-right";

        this.cancelBtn = document.createElement("button");
        this.cancelBtn.className = "b3-button b3-button--outline day-memo__editor-cancel";
        this.cancelBtn.textContent = this.i18n.cancel;
        this.cancelBtn.style.display = "none";
        this.cancelBtn.addEventListener("click", () => this.handleCancel());

        this.saveBtn = document.createElement("button");
        this.saveBtn.className = "b3-button day-memo__editor-save";
        this.saveBtn.textContent = this.i18n.saveMemo;
        this.saveBtn.addEventListener("click", () => this.handleSave());

        rightActions.appendChild(this.cancelBtn);
        rightActions.appendChild(this.saveBtn);

        actions.appendChild(leftActions);
        actions.appendChild(rightActions);

        this.container.appendChild(this.textarea);
        this.container.appendChild(this.previewContainer);
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
        this.refreshPreview();
    }

    private handleCancel(): void {
        this.editingMemo = null;
        this.textarea.value = "";
        this.cancelBtn.style.display = "none";
        this.textarea.style.height = "auto";
        this.clearPreview();
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
        this.clearPreview();
        this.onSaved?.();
    }

    private handlePaste(e: ClipboardEvent): void {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
                const file = items[i].getAsFile();
                if (file) imageFiles.push(file);
            }
        }

        if (imageFiles.length > 0) {
            e.preventDefault();
            this.handleUpload(imageFiles, "image");
        }
    }

    private handleDrop(e: DragEvent): void {
        e.preventDefault();
        this.textarea.classList.remove("day-memo__editor-textarea--dragover");

        const files = e.dataTransfer?.files;
        if (!files?.length) return;

        const allFiles = Array.from(files);
        const imageFiles = allFiles.filter((f) => f.type.startsWith("image/"));
        const otherFiles = allFiles.filter((f) => !f.type.startsWith("image/"));

        if (imageFiles.length > 0) {
            this.handleUpload(imageFiles, "image");
        }
        if (otherFiles.length > 0) {
            this.handleUpload(otherFiles, "attachment");
        }
    }

    private async handleUpload(files: File[], mode: "image" | "attachment"): Promise<void> {
        if (this.uploading) return;
        this.uploading = true;
        this.setUploadLoading(true);

        try {
            const succMap = await uploadAsset(files);
            const insertParts: string[] = [];
            for (const [originalName, assetPath] of Object.entries(succMap)) {
                if (mode === "image") {
                    const alt = originalName.replace(/\.[^.]+$/, "");
                    insertParts.push(`![${alt}](${assetPath})`);
                } else {
                    insertParts.push(`[${originalName}](${assetPath})`);
                }
            }
            if (insertParts.length > 0) {
                this.insertAtCursor(insertParts.join("\n"));
                if (mode === "image") {
                    this.refreshPreview();
                }
            }
        } catch (err) {
            const msg = this.i18n.uploadFailed || "Upload failed";
            pushErrMsg(`${msg}: ${(err as Error).message}`);
        } finally {
            this.uploading = false;
            this.setUploadLoading(false);
        }
    }

    private setUploadLoading(loading: boolean): void {
        const btns = [this.uploadBtn, this.attachBtn];
        for (const btn of btns) {
            if (loading) {
                btn.classList.add("day-memo__editor-upload--loading");
                btn.setAttribute("disabled", "true");
            } else {
                btn.classList.remove("day-memo__editor-upload--loading");
                btn.removeAttribute("disabled");
            }
        }
    }

    private insertAtCursor(text: string): void {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const value = this.textarea.value;

        const before = value.substring(0, start);
        const after = value.substring(end);
        const needNewlineBefore = before.length > 0 && !before.endsWith("\n");
        const needNewlineAfter = after.length > 0 && !after.startsWith("\n");

        const insert =
            (needNewlineBefore ? "\n" : "") +
            text +
            (needNewlineAfter ? "\n" : "");

        this.textarea.value = before + insert + after;
        const newPos = before.length + insert.length;
        this.textarea.selectionStart = newPos;
        this.textarea.selectionEnd = newPos;
        this.textarea.focus();
        this.autoResize();
    }

    private refreshPreview(): void {
        const imageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
        const content = this.textarea.value;
        const matches: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = imageRegex.exec(content)) !== null) {
            matches.push(match[1]);
        }

        if (matches.length === 0) {
            this.clearPreview();
            return;
        }

        this.previewContainer.innerHTML = "";
        this.previewContainer.style.display = "";
        for (const src of matches) {
            const thumb = document.createElement("img");
            thumb.className = "day-memo__editor-preview-thumb";
            thumb.src = src;
            thumb.loading = "lazy";
            this.previewContainer.appendChild(thumb);
        }
    }

    private clearPreview(): void {
        this.previewContainer.innerHTML = "";
        this.previewContainer.style.display = "none";
    }

    destroy(): void {
        this.container.innerHTML = "";
    }
}
