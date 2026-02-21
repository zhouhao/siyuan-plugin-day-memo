import {
    Plugin,
    getFrontend,
    adaptHotkey,
    Dialog,
    showMessage,
} from "siyuan";
import "./index.scss";

import { DOCK_TYPE, STORAGE_CONFIG, DEFAULT_CONFIG, PluginConfig } from "./types";
import { MemoDataStore } from "./store";
import { DockPanel } from "./components/DockPanel";

export default class DayMemoPlugin extends Plugin {
    private store: MemoDataStore;
    private isMobile: boolean;
    private dockPanel: DockPanel | null = null;
    private config: PluginConfig = { ...DEFAULT_CONFIG };

    async onload(): Promise<void> {
        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        this.addIcons(`<symbol id="iconDayMemo" viewBox="0 0 1024 1024">
<path d="M896 128H128c-35.3 0-64 28.7-64 64v640c0 35.3 28.7 64 64 64h768c35.3 0 64-28.7 64-64V192c0-35.3-28.7-64-64-64zM128 192h768v640H128V192z"/>
<path d="M256 384h512v64H256zM256 512h512v64H256zM256 640h320v64H256z"/>
<path d="M192 128h64v64H192zM768 128h64v64H768z"/>
</symbol>`);

        this.store = new MemoDataStore(this);

        const configData = await this.loadData(STORAGE_CONFIG);
        if (configData) {
            this.config = { ...DEFAULT_CONFIG, ...configData };
        }

        this.addDock({
            config: {
                position: this.config.dockPosition,
                size: { width: 320, height: 0 },
                icon: "iconDayMemo",
                title: this.i18n.dockTitle,
                hotkey: "⌥⌘M",
            },
            data: {},
            type: DOCK_TYPE,
            init: async (dock) => {
                await this.store.load();
                this.dockPanel = new DockPanel(
                    dock.element,
                    this.store,
                    this.i18n,
                    this.isMobile,
                );
            },
            destroy: () => {
                this.dockPanel?.destroy();
                this.dockPanel = null;
            },
        });

        this.addCommand({
            langKey: "quickCapture",
            hotkey: "⌥⌘N",
            callback: () => {
                this.showQuickCaptureDialog();
            },
        });
    }

    onLayoutReady(): void {
        this.addTopBar({
            icon: "iconDayMemo",
            title: this.i18n.topBarTip,
            position: "right",
            callback: () => {
                this.showQuickCaptureDialog();
            },
        });
    }

    onunload(): void {
        this.dockPanel?.destroy();
    }

    private showQuickCaptureDialog(): void {
        const dialog = new Dialog({
            title: this.i18n.quickCapture,
            content: `<div class="b3-dialog__content">
                <textarea class="b3-text-field fn__block day-memo__quick-textarea" 
                    placeholder="${this.i18n.editorPlaceholder}" 
                    rows="5" 
                    style="resize: vertical;"></textarea>
            </div>
            <div class="b3-dialog__action">
                <button class="b3-button b3-button--cancel">${this.i18n.cancel}</button>
                <div class="fn__space"></div>
                <button class="b3-button b3-button--text">${this.i18n.saveMemo}</button>
            </div>`,
            width: this.isMobile ? "92vw" : "520px",
        });

        const textarea = dialog.element.querySelector("textarea") as HTMLTextAreaElement;
        const buttons = dialog.element.querySelectorAll(".b3-button");

        dialog.bindInput(textarea, () => {
            (buttons[1] as HTMLButtonElement).click();
        });
        textarea.focus();

        buttons[0].addEventListener("click", () => dialog.destroy());
        buttons[1].addEventListener("click", async () => {
            const content = textarea.value.trim();
            if (!content) return;

            await this.store.load();
            this.store.createMemo(content);
            showMessage(this.i18n.memoSaved);
            dialog.destroy();
        });
    }
}
