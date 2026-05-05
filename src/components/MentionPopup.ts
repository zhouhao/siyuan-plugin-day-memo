import { Memo } from "../types";
import { MemoDataStore } from "../store";
import { makeRefPreview } from "../memoRef";

const MAX_RESULTS = 8;

export interface MentionPopupCallbacks {
  onSelect: (memo: Memo) => void;
}

export class MentionPopup {
  private store: MemoDataStore;
  private i18n: Record<string, string>;
  private callbacks: MentionPopupCallbacks;
  private el: HTMLElement;
  private results: Memo[] = [];
  private selectedIndex = 0;
  private visible = false;
  private excludeId: string | null = null;

  constructor(
    store: MemoDataStore,
    i18n: Record<string, string>,
    callbacks: MentionPopupCallbacks,
  ) {
    this.store = store;
    this.i18n = i18n;
    this.callbacks = callbacks;
    this.el = document.createElement("div");
    this.el.className = "day-memo__mention-popup";
    this.el.style.display = "none";
    document.body.appendChild(this.el);
  }

  isVisible(): boolean {
    return this.visible;
  }

  setExcludeId(id: string | null): void {
    this.excludeId = id;
  }

  show(textarea: HTMLTextAreaElement, query: string): void {
    this.results = this.search(query);
    if (this.results.length === 0) {
      this.hide();
      return;
    }
    this.selectedIndex = 0;
    this.render();
    this.position(textarea);
    this.el.style.display = "";
    this.visible = true;
  }

  hide(): void {
    this.el.style.display = "none";
    this.visible = false;
    this.results = [];
  }

  handleKey(e: KeyboardEvent): boolean {
    if (!this.visible) return false;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
      this.render();
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      this.selectedIndex =
        (this.selectedIndex - 1 + this.results.length) % this.results.length;
      this.render();
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      this.selectCurrent();
      return true;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      this.hide();
      return true;
    }
    return false;
  }

  private selectCurrent(): void {
    const memo = this.results[this.selectedIndex];
    if (memo) this.callbacks.onSelect(memo);
    this.hide();
  }

  private search(query: string): Memo[] {
    const q = query.trim().toLowerCase();
    const all = this.store
      .getAllMemos()
      .filter((m) => !m.archived && m.id !== this.excludeId);
    const source = q
      ? all.filter((m) => m.content.toLowerCase().includes(q))
      : all;
    return source
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_RESULTS);
  }

  private render(): void {
    this.el.innerHTML = "";
    this.results.forEach((memo, idx) => {
      const item = document.createElement("div");
      item.className = "day-memo__mention-item";
      if (idx === this.selectedIndex) {
        item.classList.add("day-memo__mention-item--active");
      }
      const preview = makeRefPreview(memo.content, 30);
      item.textContent = preview || memo.id;
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.selectedIndex = idx;
        this.selectCurrent();
      });
      item.addEventListener("mouseenter", () => {
        this.selectedIndex = idx;
        this.updateActiveClass();
      });
      this.el.appendChild(item);
    });
  }

  private updateActiveClass(): void {
    const items = this.el.querySelectorAll(".day-memo__mention-item");
    items.forEach((it, idx) => {
      it.classList.toggle(
        "day-memo__mention-item--active",
        idx === this.selectedIndex,
      );
    });
  }

  private position(textarea: HTMLTextAreaElement): void {
    const rect = textarea.getBoundingClientRect();
    const coords = getCaretCoordinates(textarea, textarea.selectionStart);
    const scrollTop = textarea.scrollTop;
    const top = rect.top + coords.top - scrollTop + coords.height + 4;
    const left = rect.left + coords.left;
    const maxLeft = window.innerWidth - 320;
    this.el.style.top = `${top + window.scrollY}px`;
    this.el.style.left = `${Math.min(left, maxLeft) + window.scrollX}px`;
  }

  destroy(): void {
    this.el.remove();
  }
}

// Minimal caret position via mirror div — based on textarea-caret-position by Jonathan Ong
const MIRROR_PROPS = [
  "direction",
  "boxSizing",
  "width",
  "height",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
];

function getCaretCoordinates(
  el: HTMLTextAreaElement,
  position: number,
): { top: number; left: number; height: number } {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const style = div.style;
  const computed = window.getComputedStyle(el);
  style.whiteSpace = "pre-wrap";
  style.wordWrap = "break-word";
  style.position = "absolute";
  style.visibility = "hidden";
  MIRROR_PROPS.forEach((prop) => {
    const cssProperty = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
    style.setProperty(cssProperty, computed.getPropertyValue(cssProperty));
  });
  div.textContent = el.value.substring(0, position);
  const span = document.createElement("span");
  span.textContent = el.value.substring(position) || ".";
  div.appendChild(span);
  const result = {
    top: span.offsetTop,
    left: span.offsetLeft,
    height: parseInt(computed.lineHeight) || parseInt(computed.fontSize) * 1.2,
  };
  document.body.removeChild(div);
  return result;
}
