import { showMessage } from "siyuan";
import { MemoDataStore } from "./store";

const CHECK_INTERVAL_MS = 30_000;

export class ReminderService {
    private store: MemoDataStore;
    private i18n: Record<string, string>;
    private intervalId: number | null = null;
    private firedIds: Set<string> = new Set();

    constructor(store: MemoDataStore, i18n: Record<string, string>) {
        this.store = store;
        this.i18n = i18n;
        this.requestNotificationPermission();
        this.start();
    }

    private requestNotificationPermission(): void {
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }

    private start(): void {
        this.checkReminders();
        this.intervalId = window.setInterval(() => this.checkReminders(), CHECK_INTERVAL_MS);
    }

    private checkReminders(): void {
        const now = Date.now();
        const memos = this.store.getAllMemos();

        for (const memo of memos) {
            if (memo.reminderAt && memo.reminderAt <= now && !this.firedIds.has(memo.id)) {
                this.firedIds.add(memo.id);
                this.fireReminder(memo.id, memo.content);
                this.store.clearReminder(memo.id);
            }
        }
    }

    private fireReminder(id: string, content: string): void {
        const preview = content.length > 80
            ? content.substring(0, 80) + "..."
            : content;

        const title = this.i18n.reminderNotification || "🔔 Memo Reminder";

        showMessage(`${title}\n${preview}`, 10_000);

        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(this.i18n.pluginName || "DayMemo", {
                body: preview,
                tag: `day-memo-reminder-${id}`,
            });
        }
    }

    destroy(): void {
        if (this.intervalId !== null) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
