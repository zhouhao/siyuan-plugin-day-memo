import { Dialog, showMessage } from "siyuan";
import { Memo } from "../types";
import { MemoDataStore } from "../store";

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function showReminderDialog(
  memo: Memo,
  store: MemoDataStore,
  i18n: Record<string, string>,
): void {
  const hasReminder = !!(memo.reminderAt && memo.reminderAt > Date.now());

  let defaultValue: string;
  if (hasReminder) {
    defaultValue = formatDateTimeLocal(new Date(memo.reminderAt!));
  } else {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    defaultValue = formatDateTimeLocal(tenMinutesLater);
  }

  const nowStr = formatDateTimeLocal(new Date());

  const dialog = new Dialog({
    title: hasReminder
      ? i18n.editReminder || "Edit Reminder"
      : i18n.setReminder || "Set Reminder",
    content: `<div class="b3-dialog__content">
            <label class="day-memo__reminder-label" style="display:block; font-size:14px; color:var(--b3-theme-on-surface-light); margin-bottom:6px;">
                ${i18n.reminderTime || "Reminder Time"}
            </label>
            <input type="datetime-local"
                class="b3-text-field fn__block day-memo__reminder-input"
                value="${defaultValue}"
                min="${nowStr}"
                style="font-size: 15px;">
            <div class="day-memo__reminder-error" style="color: var(--b3-theme-error); font-size: 13px; margin-top: 6px; display: none;"></div>
        </div>
        <div class="b3-dialog__action">
            <button class="b3-button b3-button--cancel">${i18n.cancel}</button>
            ${hasReminder ? `<div class="fn__space"></div><button class="b3-button b3-button--error day-memo__reminder-clear">${i18n.clearReminder || "Clear Reminder"}</button>` : ""}
            <div class="fn__space"></div>
            <button class="b3-button b3-button--text day-memo__reminder-save">${i18n.saveMemo || "Save"}</button>
        </div>`,
    width: "360px",
  });

  const input = dialog.element.querySelector(
    ".day-memo__reminder-input",
  ) as HTMLInputElement;
  const errorEl = dialog.element.querySelector(
    ".day-memo__reminder-error",
  ) as HTMLElement;
  const cancelBtn = dialog.element.querySelector(
    ".b3-button--cancel",
  ) as HTMLButtonElement;
  const saveBtn = dialog.element.querySelector(
    ".day-memo__reminder-save",
  ) as HTMLButtonElement;
  const clearBtn = dialog.element.querySelector(
    ".day-memo__reminder-clear",
  ) as HTMLButtonElement | null;

  cancelBtn.addEventListener("click", () => dialog.destroy());

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      store.clearReminder(memo.id);
      showMessage(i18n.reminderCleared || "Reminder cleared");
      dialog.destroy();
    });
  }

  saveBtn.addEventListener("click", () => {
    const value = input.value;
    if (!value) {
      errorEl.textContent =
        i18n.reminderPastTime || "Please select a future time";
      errorEl.style.display = "block";
      return;
    }

    const timestamp = new Date(value).getTime();
    if (timestamp <= Date.now()) {
      errorEl.textContent =
        i18n.reminderPastTime || "Please select a future time";
      errorEl.style.display = "block";
      return;
    }

    store.setReminder(memo.id, timestamp);
    showMessage(i18n.reminderSet || "Reminder set");
    dialog.destroy();
  });

  input.addEventListener("input", () => {
    errorEl.style.display = "none";
  });

  input.focus();
}
