import { showMessage } from "siyuan";
import type { Plugin } from "siyuan";
import { MemoDataStore } from "./store";

const DEBOUNCE_MS = 500;

interface TransactionOp {
    action: string;
    data: string;
    id: string;
}

interface TransactionDetail {
    cmd: string;
    data: Array<{
        doOperations: TransactionOp[];
    }>;
}

export class TagTriggerService {
    private plugin: Plugin;
    private store: MemoDataStore;
    private i18n: Record<string, string>;
    private debounceTimer: number | null = null;
    private pendingBlocks: Map<string, string> = new Map();
    private boundHandler: (event: CustomEvent) => void;

    constructor(plugin: Plugin, store: MemoDataStore, i18n: Record<string, string>) {
        this.plugin = plugin;
        this.store = store;
        this.i18n = i18n;
        this.boundHandler = this.handleWsMessage.bind(this) as (event: CustomEvent) => void;
        this.plugin.eventBus.on("ws-main", this.boundHandler);
    }

    private handleWsMessage(event: CustomEvent<TransactionDetail>): void {
        const settings = this.store.getSettings();
        if (!settings.tagTriggerEnabled) return;

        const detail = event.detail;
        if (detail.cmd !== "transactions") return;

        const triggerTag = "#" + (settings.triggerTag || "to-memo");

        for (const tx of detail.data || []) {
            for (const op of tx.doOperations || []) {
                if (op.action !== "insert" && op.action !== "update") continue;
                if (!op.data || !op.id) continue;

                const text = this.extractTextFromDom(op.data);
                if (!text.includes(triggerTag)) continue;

                this.pendingBlocks.set(op.id, text);
            }
        }

        if (this.pendingBlocks.size > 0) {
            this.scheduleProcess();
        }
    }

    private extractTextFromDom(domString: string): string {
        const parser = new DOMParser();
        const doc = parser.parseFromString(domString, "text/html");
        return doc.body.textContent || "";
    }

    private scheduleProcess(): void {
        if (this.debounceTimer !== null) {
            window.clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = window.setTimeout(() => {
            this.processPendingBlocks();
            this.debounceTimer = null;
        }, DEBOUNCE_MS);
    }

    private processPendingBlocks(): void {
        const settings = this.store.getSettings();
        const triggerTag = "#" + (settings.triggerTag || "to-memo");
        const tagPattern = new RegExp(
            triggerTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*",
            "g",
        );

        for (const [blockId, rawText] of this.pendingBlocks) {
            const cleanedContent = rawText.replace(tagPattern, "").trim();
            if (!cleanedContent) continue;

            const result = this.store.createMemoFromBlock(cleanedContent, blockId);
            if (result) {
                const existing = this.store.findBySourceBlockId(blockId);
                const isUpdate = existing && existing.id === result.id && existing.createdAt !== result.createdAt;
                const msg = isUpdate
                    ? (this.i18n.memoUpdated || "Memo updated")
                    : (this.i18n.tagTriggerCreated || "Memo created from tag");
                showMessage(msg);
            }
        }

        this.pendingBlocks.clear();
    }

    destroy(): void {
        this.plugin.eventBus.off("ws-main", this.boundHandler);
        if (this.debounceTimer !== null) {
            window.clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        this.pendingBlocks.clear();
    }
}
