import {
    Plugin,
    getFrontend,
    Dialog,
    showMessage,
    openTab,
} from "siyuan";
import "./index.scss";

import { TAB_TYPE } from "./types";
import { MemoDataStore } from "./store";
import { TabPanel } from "./components/TabPanel";

export default class DayMemoPlugin extends Plugin {
    private store: MemoDataStore;
    private isMobile: boolean;
    private tabPanel: TabPanel | null = null;

    onload(): void {
        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        this.addIcons(`<symbol id="iconDayMemo" viewBox="0 0 1024 1024">
<path d="M192 64h480l192 192v640c0 35.3-28.7 64-64 64H192c-35.3 0-64-28.7-64-64V128c0-35.3 28.7-64 64-64zm480 32v160h160"/>
<path d="M256 400h400v48H256zm0 128h336v48H256zm0 128h368v48H256z"/>
</symbol>`);

        this.store = new MemoDataStore(this);

        const plugin = this;
        this.addTab({
            type: TAB_TYPE,
            init() {
                const tabEl = (this as { element: Element }).element as HTMLElement;
                plugin.store.load().then(() => {
                    plugin.tabPanel = new TabPanel(
                        tabEl,
                        plugin.store,
                        plugin.i18n,
                    );
                });
            },
            destroy() {
                plugin.tabPanel?.destroy();
                plugin.tabPanel = null;
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
                this.openDayMemoTab();
            },
        });
    }

    onunload(): void {
        this.tabPanel?.destroy();
    }

    private openDayMemoTab(): void {
        openTab({
            app: this.app,
            custom: {
                icon: "iconDayMemo",
                title: this.i18n.pluginName,
                data: {},
                id: this.name + TAB_TYPE,
            },
        });
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
