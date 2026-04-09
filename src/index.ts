import {
    Plugin,
    getFrontend,
    Dialog,
    showMessage,
    openTab,
    Setting,
} from "siyuan";
import "./index.scss";

import { TAB_TYPE, DOCK_TYPE, PluginSettings } from "./types";
import { MemoDataStore } from "./store";
import { ReminderService } from "./ReminderService";
import { TabPanel } from "./components/TabPanel";
import { DockPanel } from "./components/DockPanel";

export default class DayMemoPlugin extends Plugin {
    private store: MemoDataStore;
    private isMobile: boolean;
    private tabPanel: TabPanel | null = null;
    private dockPanel: DockPanel | null = null;
    private reminderService: ReminderService | null = null;

    onload(): void {
        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        this.addIcons(`<symbol id="iconDayMemo" viewBox="0 0 1024 1024">
<path d="M896 128H128c-35.3 0-64 28.7-64 64v640c0 35.3 28.7 64 64 64h768c35.3 0 64-28.7 64-64V192c0-35.3-28.7-64-64-64zM128 192h768v640H128V192z"/>
<path d="M256 384h512v64H256zM256 512h512v64H256zM256 640h320v64H256z"/>
<path d="M192 128h64v64H192zM768 128h64v64H768z"/>
</symbol>`);

        this.store = new MemoDataStore(this);
        this.store.loadSettings();
        this.store.load().then(() => {
            this.reminderService = new ReminderService(this.store, this.i18n);
        });

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

        this.addDock({
            config: {
                position: "LeftBottom",
                size: { width: 320, height: 0 },
                icon: "iconDayMemo",
                title: this.i18n.dockTitle,
            },
            data: {},
            type: DOCK_TYPE,
            init() {
                const dockEl = (this as { element: Element }).element as HTMLElement;
                plugin.store.load().then(() => {
                    plugin.dockPanel = new DockPanel(
                        dockEl,
                        plugin.store,
                        plugin.i18n,
                        plugin.isMobile,
                    );
                });
            },
            destroy() {
                plugin.dockPanel?.destroy();
                plugin.dockPanel = null;
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
        this.reminderService?.destroy();
        this.tabPanel?.destroy();
    }

    openSetting(): void {
        const currentSettings = this.store.getSettings();

        const pathInput = document.createElement("textarea");
        pathInput.className = "b3-text-field fn__block";
        pathInput.style.resize = "vertical";
        pathInput.rows = 2;
        pathInput.placeholder = this.i18n.settingDailyNotePathPlaceholder;
        pathInput.value = currentSettings.dailyNotePathTemplate;

        const convertTaskInput = document.createElement("input");
        convertTaskInput.className = "b3-switch fn__flex-center";
        convertTaskInput.type = "checkbox";
        convertTaskInput.checked = !!currentSettings.convertTask;

        const setting = new Setting({
            confirmCallback: () => {
                const newSettings: PluginSettings = {
                    dailyNotePathTemplate: pathInput.value.trim(),
                    convertTask: convertTaskInput.checked,
                };
                this.store.saveSettings(newSettings);
                showMessage(this.i18n.settingsSaved);
            },
        });

        setting.addItem({
            title: this.i18n.settingDailyNotePath,
            description: this.i18n.settingDailyNotePathDesc,
            direction: "column",
            actionElement: pathInput,
        });

        setting.addItem({
            title: this.i18n.settingConvertTask || "转换任务列表",
            description: this.i18n.settingConvertTaskDesc || "将以 #任务 开头的行自动转换为 Markdown 任务列表 (- [ ])",
            direction: "row",
            actionElement: convertTaskInput,
        });

        setting.open(this.name);
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
