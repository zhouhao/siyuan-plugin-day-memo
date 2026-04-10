import { Dialog } from "siyuan";
import { MemoDataStore } from "../store";
import { renderMarkdown, formatDate, formatTime, renderMermaidBlocks } from "../utils";

const REVIEW_BATCH_SIZE = 5;

export function showReviewDialog(
    store: MemoDataStore,
    i18n: Record<string, string>,
): void {
    const memos = store.getRandomMemos(REVIEW_BATCH_SIZE);

    if (memos.length === 0) {
        const dialog = new Dialog({
            title: i18n.reviewTitle || "Random Review",
            content: `<div class="b3-dialog__content">
                <div class="day-memo__review-empty">${i18n.reviewEmpty || "No memos to review."}</div>
            </div>
            <div class="b3-dialog__action">
                <button class="b3-button b3-button--cancel">${i18n.reviewClose || "Close"}</button>
            </div>`,
            width: "520px",
        });
        dialog.element.querySelector(".b3-button--cancel")!
            .addEventListener("click", () => dialog.destroy());
        return;
    }

    let currentIndex = 0;

    const dialog = new Dialog({
        title: i18n.reviewTitle || "Random Review",
        content: `<div class="b3-dialog__content day-memo__review-content">
            <div class="day-memo__review-card">
                <div class="day-memo__review-card-header">
                    <span class="day-memo__review-card-time"></span>
                    <span class="day-memo__review-counter"></span>
                </div>
                <div class="day-memo__review-card-body"></div>
            </div>
        </div>
        <div class="b3-dialog__action">
            <button class="b3-button b3-button--cancel">${i18n.reviewClose || "Close"}</button>
            <div class="fn__space"></div>
            <button class="b3-button day-memo__review-prev" disabled>&#x276E;</button>
            <div class="fn__space"></div>
            <button class="b3-button day-memo__review-next-one">&#x276F;</button>
            <div class="fn__space"></div>
            <button class="b3-button b3-button--text day-memo__review-shuffle">${i18n.reviewNext || "Next"}</button>
        </div>`,
        width: "520px",
    });

    const timeEl = dialog.element.querySelector(".day-memo__review-card-time") as HTMLElement;
    const counterEl = dialog.element.querySelector(".day-memo__review-counter") as HTMLElement;
    const bodyEl = dialog.element.querySelector(".day-memo__review-card-body") as HTMLElement;
    const closeBtn = dialog.element.querySelector(".b3-button--cancel") as HTMLButtonElement;
    const prevBtn = dialog.element.querySelector(".day-memo__review-prev") as HTMLButtonElement;
    const nextOneBtn = dialog.element.querySelector(".day-memo__review-next-one") as HTMLButtonElement;
    const shuffleBtn = dialog.element.querySelector(".day-memo__review-shuffle") as HTMLButtonElement;

    const renderCurrent = () => {
        const memo = memos[currentIndex];
        timeEl.textContent = `${formatDate(memo.createdAt)} ${formatTime(memo.createdAt)}`;
        counterEl.textContent = (i18n.reviewCounter || "{current} / {total}")
            .replace("{current}", String(currentIndex + 1))
            .replace("{total}", String(memos.length));
        bodyEl.innerHTML = renderMarkdown(memo.content);
        renderMermaidBlocks(bodyEl);

        prevBtn.disabled = currentIndex === 0;
        nextOneBtn.disabled = currentIndex === memos.length - 1;
    };

    renderCurrent();

    closeBtn.addEventListener("click", () => dialog.destroy());

    prevBtn.addEventListener("click", () => {
        if (currentIndex > 0) {
            currentIndex--;
            renderCurrent();
        }
    });

    nextOneBtn.addEventListener("click", () => {
        if (currentIndex < memos.length - 1) {
            currentIndex++;
            renderCurrent();
        }
    });

    shuffleBtn.addEventListener("click", () => {
        const newMemos = store.getRandomMemos(REVIEW_BATCH_SIZE);
        if (newMemos.length === 0) return;
        memos.length = 0;
        memos.push(...newMemos);
        currentIndex = 0;
        renderCurrent();
    });
}
