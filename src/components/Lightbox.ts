export interface LightboxImage {
  url: string;
  memoId: string;
  alt?: string;
}

export interface LightboxCallbacks {
  onNavigateToMemo?: (memoId: string) => void;
}

export class Lightbox {
  private overlay: HTMLElement;
  private images: LightboxImage[] = [];
  private currentIndex = 0;
  private callbacks: LightboxCallbacks;
  private i18n: Record<string, string>;
  private imgEl: HTMLImageElement;
  private counterEl: HTMLElement;
  private prevBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private boundKeyHandler: (e: KeyboardEvent) => void;

  constructor(i18n: Record<string, string>, callbacks: LightboxCallbacks) {
    this.i18n = i18n;
    this.callbacks = callbacks;

    this.overlay = document.createElement("div");
    this.overlay.className = "day-memo__lightbox";
    this.overlay.style.display = "none";
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });

    const container = document.createElement("div");
    container.className = "day-memo__lightbox-container";

    this.prevBtn = document.createElement("button");
    this.prevBtn.className = "day-memo__lightbox-nav day-memo__lightbox-prev";
    this.prevBtn.innerHTML = "&#x276E;";
    this.prevBtn.addEventListener("click", () => this.prev());

    this.nextBtn = document.createElement("button");
    this.nextBtn.className = "day-memo__lightbox-nav day-memo__lightbox-next";
    this.nextBtn.innerHTML = "&#x276F;";
    this.nextBtn.addEventListener("click", () => this.next());

    this.imgEl = document.createElement("img");
    this.imgEl.className = "day-memo__lightbox-img";

    const toolbar = document.createElement("div");
    toolbar.className = "day-memo__lightbox-toolbar";

    this.counterEl = document.createElement("span");
    this.counterEl.className = "day-memo__lightbox-counter";

    const goToBtn = document.createElement("button");
    goToBtn.className = "day-memo__lightbox-goto b3-button b3-button--text";
    goToBtn.textContent = i18n.goToMemo || "Go to memo";
    goToBtn.addEventListener("click", () => {
      const img = this.images[this.currentIndex];
      if (img) {
        this.close();
        this.callbacks.onNavigateToMemo?.(img.memoId);
      }
    });

    const closeBtn = document.createElement("button");
    closeBtn.className = "day-memo__lightbox-close";
    closeBtn.innerHTML = "&#x2715;";
    closeBtn.addEventListener("click", () => this.close());

    toolbar.appendChild(this.counterEl);
    toolbar.appendChild(goToBtn);
    toolbar.appendChild(closeBtn);

    container.appendChild(this.prevBtn);
    container.appendChild(this.imgEl);
    container.appendChild(this.nextBtn);
    container.appendChild(toolbar);
    this.overlay.appendChild(container);

    this.boundKeyHandler = (e: KeyboardEvent) => this.handleKey(e);
    document.body.appendChild(this.overlay);
  }

  open(images: LightboxImage[], startIndex = 0): void {
    if (images.length === 0) return;
    this.images = images;
    this.currentIndex = Math.max(0, Math.min(startIndex, images.length - 1));
    this.render();
    this.overlay.style.display = "";
    document.addEventListener("keydown", this.boundKeyHandler);
  }

  close(): void {
    this.overlay.style.display = "none";
    document.removeEventListener("keydown", this.boundKeyHandler);
  }

  private prev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.render();
    }
  }

  private next(): void {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
      this.render();
    }
  }

  private handleKey(e: KeyboardEvent): void {
    if (e.key === "Escape") this.close();
    else if (e.key === "ArrowLeft") this.prev();
    else if (e.key === "ArrowRight") this.next();
  }

  private render(): void {
    const img = this.images[this.currentIndex];
    this.imgEl.src = img.url;
    this.imgEl.alt = img.alt || "";
    this.counterEl.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
    this.prevBtn.disabled = this.currentIndex === 0;
    this.nextBtn.disabled = this.currentIndex === this.images.length - 1;
  }

  destroy(): void {
    document.removeEventListener("keydown", this.boundKeyHandler);
    this.overlay.remove();
  }
}
