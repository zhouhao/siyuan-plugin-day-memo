import { confirm, showMessage } from "siyuan";
import { MemoDataStore } from "../store";
import { Memo } from "../types";
import { addToDailyNote, sendToFlomo } from "../api";
import { LightboxImage } from "./Lightbox";

const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

export function handleDelete(
  memo: Memo,
  store: MemoDataStore,
  i18n: Record<string, string>,
): void {
  confirm("\u26a0\ufe0f", i18n.confirmDelete, () => {
    store.deleteMemo(memo.id);
    showMessage(i18n.memoDeleted);
  });
}

export async function handleAddToDailyNote(
  memo: Memo,
  store: MemoDataStore,
  i18n: Record<string, string>,
): Promise<void> {
  try {
    const settings = store.getSettings();
    const template = settings.dailyNotePathTemplate || undefined;
    const dateToUse = settings.useCurrentDateForDailyNote
      ? Date.now()
      : memo.createdAt;
    await addToDailyNote(
      memo.content,
      dateToUse,
      i18n.fromDayMemo,
      template,
      settings.enableReplacementRules,
      settings.replacementRules,
    );
    showMessage(i18n.addedToDailyNote);
  } catch {
    showMessage(i18n.addToDailyNoteFailed);
  }
}

export async function handleSendToFlomo(
  memo: Memo,
  store: MemoDataStore,
  i18n: Record<string, string>,
): Promise<void> {
  const settings = store.getSettings();
  if (!settings.flomoSyncEnabled || !settings.flomoWebhookUrl) {
    showMessage(i18n.flomoNotConfigured);
    return;
  }
  try {
    await sendToFlomo(settings.flomoWebhookUrl, memo.content);
    showMessage(i18n.flomoSentSuccess);
  } catch {
    showMessage(i18n.flomoSentFailed);
  }
}

export function extractMemoImages(
  memoId: string,
  store: MemoDataStore,
): LightboxImage[] {
  const memo = store.getMemo(memoId);
  if (!memo) return [];
  const images: LightboxImage[] = [];
  let match: RegExpExecArray | null;
  IMAGE_REGEX.lastIndex = 0;
  while ((match = IMAGE_REGEX.exec(memo.content)) !== null) {
    images.push({ url: match[2], memoId: memo.id, alt: match[1] });
  }
  return images;
}

export function navigateToMemo(
  memoId: string,
  listContainer: HTMLElement,
): void {
  const el = listContainer.querySelector(
    `[data-memo-id="${memoId}"]`,
  ) as HTMLElement;
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("day-memo__item--highlight");
    setTimeout(() => el.classList.remove("day-memo__item--highlight"), 2000);
  }
}
