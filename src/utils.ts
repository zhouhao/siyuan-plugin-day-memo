/**
 * Generate a unique ID based on timestamp + random suffix.
 */
export function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `${ts}-${rand}`;
}

/**
 * Convert memo tags from `#tag` format to SiYuan's `#tag#` format.
 * Skips tags that already have a trailing `#`.
 */
export function convertTagsToSiYuanFormat(content: string): string {
  return content.replace(
    /#([\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]+(?:\/[\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]+)*)(?!#)/g,
    "#$1#",
  );
}

/**
 * Extract #tags from memo content.
 * Supports: #tag, #multi-word-tag (with hyphens), #中文标签, #parent/child (multi-level)
 */
export function extractTags(content: string): string[] {
  const tagRegex =
    /#([\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]+(?:\/[\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]+)*)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }
  return tags;
}

/**
 * Format a timestamp into a human-readable relative date.
 */
export function formatRelativeDate(
  timestamp: number,
  i18n: Record<string, string>,
): string {
  const now = new Date();
  const date = new Date(timestamp);

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const yesterdayStart = todayStart - 86400000;

  if (timestamp >= todayStart) {
    return i18n.today || "Today";
  } else if (timestamp >= yesterdayStart) {
    return i18n.yesterday || "Yesterday";
  } else {
    return formatDate(timestamp);
  }
}

/**
 * Format a timestamp as YYYY-MM-DD.
 */
export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a timestamp as HH:MM.
 */
export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Get the start of day for a given timestamp.
 */
export function getDayStart(timestamp: number): number {
  const d = new Date(timestamp);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Group memos by date (day start timestamp).
 */
export function groupByDate<T extends { createdAt: number }>(
  items: T[],
): Map<number, T[]> {
  const groups = new Map<number, T[]>();
  for (const item of items) {
    const dayStart = getDayStart(item.createdAt);
    if (!groups.has(dayStart)) {
      groups.set(dayStart, []);
    }
    groups.get(dayStart)!.push(item);
  }
  return groups;
}

/**
 * Simple markdown to HTML converter for memo display.
 * Supports: bold, italic, strikethrough, inline code, code blocks, links, tags, line breaks.
 */
export function renderMarkdown(content: string): string {
  // Extract code blocks BEFORE escaping — preserves raw content for mermaid, prevents <br> injection
  const codeBlocks: string[] = [];
  let stripped = content.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, lang, code) => {
      const idx = codeBlocks.length;
      if (lang === "mermaid") {
        codeBlocks.push(
          `<div class="day-memo__mermaid">${escapeHtml(code.trim())}</div>`,
        );
      } else {
        codeBlocks.push(
          `<pre class="day-memo__code-block"><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`,
        );
      }
      return `%%CBLK_${idx}%%`;
    },
  );

  let html = escapeHtml(stripped);

  html = html.replace(
    /`([^`]+)`/g,
    '<code class="day-memo__inline-code">$1</code>',
  );
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Images ![alt](url) — must be before link processing
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="day-memo__image" loading="lazy">',
  );

  // Asset file links [name](assets/...) — must be before external link processing
  html = html.replace(
    /\[([^\]]+)\]\((assets\/[^)]+)\)/g,
    '<a href="$2" class="day-memo__attachment" target="_blank">$1</a>',
  );

  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="day-memo__link">$1</a>',
  );

  html = html.replace(
    /(?<!")(?<!=)(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="day-memo__link">$1</a>',
  );

  html = html.replace(
    /#([\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]+(?:\/[\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]+)*)/g,
    '<span class="day-memo__tag" data-tag="$1">#$1</span>',
  );

  // Checklist items — must be before line break conversion
  let checkIndex = 0;
  html = html.replace(/^- \[([ xX])\] (.+)$/gm, (_match, state, text) => {
    const checked = state !== " ";
    const idx = checkIndex++;
    const checkedAttr = checked ? " checked" : "";
    const doneClass = checked ? " day-memo__checklist-text--done" : "";
    return `<label class="day-memo__checklist-item"><input type="checkbox" class="day-memo__checkbox" data-check-index="${idx}"${checkedAttr}><span class="day-memo__checklist-text${doneClass}">${text}</span></label>`;
  });

  html = html.replace(/\n/g, "<br>");

  // Restore code blocks after all inline processing
  for (let i = 0; i < codeBlocks.length; i++) {
    html = html.replace(`%%CBLK_${i}%%`, codeBlocks[i]);
  }

  return html;
}

export function toggleChecklistItem(
  content: string,
  checkIndex: number,
): string {
  let idx = 0;
  return content.replace(
    /^(- \[)([ xX])(\] .+)$/gm,
    (match, prefix, state, suffix) => {
      if (idx++ === checkIndex) {
        const newState = state === " " ? "x" : " ";
        return `${prefix}${newState}${suffix}`;
      }
      return match;
    },
  );
}

export function renderDailyNotePath(template: string, date: Date): string {
  // First pass: {{now | date "format"}}
  let result = template.replace(
    /\{\{\s*now\s*\|\s*date\s*"([^"]+)"\s*\}\}/g,
    (_match, goFormat: string) => {
      return formatGoDate(goFormat, date);
    },
  );
  // Second pass: {{now | FuncName}} (no-argument template functions)
  result = result.replace(
    /\{\{\s*now\s*\|\s*(\w+)\s*\}\}/g,
    (_match, funcName: string) => {
      return evalTemplateFunc(funcName, date);
    },
  );
  return result;
}

function getISOWeekData(date: Date): { year: number; week: number } {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  // Set to nearest Thursday: current date + 4 - current day number (Monday=1, Sunday=7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { year: d.getUTCFullYear(), week };
}

function evalTemplateFunc(funcName: string, date: Date): string {
  const weekdaysCN = ["日", "一", "二", "三", "四", "五", "六"];
  const isoData = () => getISOWeekData(date);

  switch (funcName) {
    case "ISOWeek":
      return String(isoData().week);
    case "ISOYear":
      return String(isoData().year);
    case "ISOMonth":
      return String(date.getMonth() + 1).padStart(2, "0");
    case "ISOWeekDate": {
      const { year, week } = isoData();
      const dayNum = date.getDay() || 7;
      return `${year}-W${String(week).padStart(2, "0")}-${dayNum}`;
    }
    case "Weekday":
      return String(date.getDay());
    case "WeekdayCN":
      return weekdaysCN[date.getDay()];
    case "WeekdayCN2":
      return "周" + weekdaysCN[date.getDay()];
    default:
      return `{{now | ${funcName}}}`;
  }
}

function formatGoDate(goFormat: string, date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const weekdaysFull = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const weekdaysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthsFull = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthsShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  let result = "";
  let i = 0;
  while (i < goFormat.length) {
    // Go reference time: Mon Jan 2 15:04:05 MST 2006
    // Match longer tokens first to avoid ambiguity
    if (goFormat.startsWith("2006", i)) {
      result += String(year);
      i += 4;
    } else if (goFormat.startsWith("January", i)) {
      result += monthsFull[month - 1];
      i += 7;
    } else if (goFormat.startsWith("Jan", i)) {
      result += monthsShort[month - 1];
      i += 3;
    } else if (goFormat.startsWith("Monday", i)) {
      result += weekdaysFull[date.getDay()];
      i += 6;
    } else if (goFormat.startsWith("Mon", i)) {
      result += weekdaysShort[date.getDay()];
      i += 3;
    } else if (goFormat.startsWith("15", i)) {
      result += String(hours).padStart(2, "0");
      i += 2;
    } else if (goFormat.startsWith("04", i)) {
      result += String(minutes).padStart(2, "0");
      i += 2;
    } else if (goFormat.startsWith("05", i)) {
      result += String(seconds).padStart(2, "0");
      i += 2;
    } else if (goFormat.startsWith("03", i)) {
      result += String(hours % 12 || 12).padStart(2, "0");
      i += 2;
    } else if (goFormat.startsWith("02", i)) {
      result += String(day).padStart(2, "0");
      i += 2;
    } else if (goFormat.startsWith("01", i)) {
      result += String(month).padStart(2, "0");
      i += 2;
    } else if (goFormat.startsWith("PM", i) || goFormat.startsWith("pm", i)) {
      const upper = goFormat[i] === "P";
      result += hours >= 12 ? (upper ? "PM" : "pm") : upper ? "AM" : "am";
      i += 2;
    } else {
      result += goFormat[i];
      i++;
    }
  }
  return result;
}

/**
 * Escape HTML special characters.
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

/**
 * Determine heatmap intensity level (0-4) from a memo count.
 */
export function getHeatmapLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

declare global {
  interface Window {
    mermaid?: {
      initialize(config: Record<string, unknown>): void;
      render(id: string, text: string): Promise<{ svg: string }>;
    };
  }
}

const MERMAID_SCRIPT = "/stage/protyle/js/mermaid/mermaid.min.js";
let mermaidReady: Promise<void> | null = null;

function ensureMermaid(): Promise<void> {
  if (window.mermaid) return Promise.resolve();
  if (mermaidReady) return mermaidReady;

  mermaidReady = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      "protyleMermaidScript",
    ) as HTMLScriptElement;
    if (existing) {
      const check = () => {
        if (window.mermaid) {
          resolve();
          return;
        }
        setTimeout(check, 50);
      };
      check();
      return;
    }

    const script = document.createElement("script");
    script.id = "dayMemoMermaidScript";
    script.src = MERMAID_SCRIPT;
    script.onload = () => {
      const isDark =
        document.body.classList.contains("body--dark") ||
        getComputedStyle(document.documentElement)
          .getPropertyValue("--b3-theme-background")
          .trim()
          .startsWith("#1") ||
        getComputedStyle(document.documentElement)
          .getPropertyValue("--b3-theme-background")
          .trim()
          .startsWith("#2");
      window.mermaid?.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "default",
      });
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load mermaid"));
    document.head.appendChild(script);
  });
  return mermaidReady;
}

export async function renderMermaidBlocks(
  container: HTMLElement,
): Promise<void> {
  const blocks = container.querySelectorAll(
    ".day-memo__mermaid:not([data-rendered])",
  );
  if (blocks.length === 0) return;

  await ensureMermaid();

  for (const block of Array.from(blocks) as HTMLElement[]) {
    const source = block.textContent || "";
    if (!source.trim()) continue;

    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    try {
      const { svg } = await window.mermaid!.render(id, source);
      block.innerHTML = svg;
      block.setAttribute("data-rendered", "true");
    } catch {
      block.innerHTML = `<pre class="day-memo__mermaid-error">${escapeHtml(source)}</pre>`;
      block.setAttribute("data-rendered", "true");
    }
  }
}
