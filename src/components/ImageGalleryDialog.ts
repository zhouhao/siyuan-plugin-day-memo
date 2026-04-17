import { Dialog } from "siyuan";
import { MemoDataStore } from "../store";
import { Lightbox, LightboxImage } from "./Lightbox";
import { formatDate } from "../utils";

const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

export interface GalleryImage {
  url: string;
  alt: string;
  memoId: string;
  createdAt: number;
}

function extractAllImages(store: MemoDataStore): GalleryImage[] {
  const images: GalleryImage[] = [];
  const memos = store.getAllMemos().filter((m) => !m.deleted);
  for (const memo of memos) {
    let match: RegExpExecArray | null;
    IMAGE_REGEX.lastIndex = 0;
    while ((match = IMAGE_REGEX.exec(memo.content)) !== null) {
      images.push({
        alt: match[1],
        url: match[2],
        memoId: memo.id,
        createdAt: memo.createdAt,
      });
    }
  }
  images.sort((a, b) => b.createdAt - a.createdAt);
  return images;
}

export function showImageGalleryDialog(
  store: MemoDataStore,
  i18n: Record<string, string>,
  onNavigateToMemo?: (memoId: string) => void,
): void {
  const images = extractAllImages(store);

  if (images.length === 0) {
    new Dialog({
      title: i18n.gallery || "Gallery",
      content: `<div class="b3-dialog__content">
        <div class="day-memo__review-empty">${i18n.galleryEmpty || "No images yet."}</div>
      </div>
      <div class="b3-dialog__action">
        <button class="b3-button b3-button--cancel">${i18n.reviewClose || "Close"}</button>
      </div>`,
      width: "520px",
    }).element
      .querySelector(".b3-button--cancel")!
      .addEventListener("click", function () {
        (this as HTMLElement).closest(".b3-dialog--open")
          ?.querySelector<HTMLElement>(".b3-dialog__close")
          ?.click();
      });
    return;
  }

  const dialog = new Dialog({
    title: `${i18n.gallery || "Gallery"} (${images.length})`,
    content: `<div class="b3-dialog__content day-memo__gallery-content">
      <div class="day-memo__gallery-grid"></div>
    </div>
    <div class="b3-dialog__action">
      <button class="b3-button b3-button--cancel">${i18n.reviewClose || "Close"}</button>
    </div>`,
    width: "680px",
    height: "520px",
  });

  const gridEl = dialog.element.querySelector(
    ".day-memo__gallery-grid",
  ) as HTMLElement;
  const closeBtn = dialog.element.querySelector(
    ".b3-button--cancel",
  ) as HTMLButtonElement;

  const lightboxImages: LightboxImage[] = images.map((img) => ({
    url: img.url,
    memoId: img.memoId,
    alt: img.alt,
  }));

  const lightbox = new Lightbox(i18n, {
    onNavigateToMemo: (memoId) => {
      lightbox.close();
      dialog.destroy();
      onNavigateToMemo?.(memoId);
    },
  });

  images.forEach((img, idx) => {
    const cell = document.createElement("div");
    cell.className = "day-memo__gallery-cell";

    const imgEl = document.createElement("img");
    imgEl.src = img.url;
    imgEl.alt = img.alt;
    imgEl.loading = "lazy";
    imgEl.className = "day-memo__gallery-thumb";
    imgEl.addEventListener("click", () => lightbox.open(lightboxImages, idx));

    const dateLabel = document.createElement("span");
    dateLabel.className = "day-memo__gallery-date";
    dateLabel.textContent = formatDate(img.createdAt);

    cell.appendChild(imgEl);
    cell.appendChild(dateLabel);
    gridEl.appendChild(cell);
  });

  closeBtn.addEventListener("click", () => {
    lightbox.destroy();
    dialog.destroy();
  });
}
