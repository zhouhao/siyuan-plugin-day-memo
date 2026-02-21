/**
 * Generate a unique ID based on timestamp + random suffix.
 */
export function generateId(): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 8);
    return `${ts}-${rand}`;
}

/**
 * Extract #tags from memo content.
 * Supports: #tag, #multi-word-tag (with hyphens), #中文标签
 */
export function extractTags(content: string): string[] {
    const tagRegex = /#([\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]+)/g;
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
export function formatRelativeDate(timestamp: number, i18n: Record<string, string>): string {
    const now = new Date();
    const date = new Date(timestamp);

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
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
export function groupByDate<T extends { createdAt: number }>(items: T[]): Map<number, T[]> {
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
    let html = escapeHtml(content);

    // Code blocks (``` ... ```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
        return `<pre class="day-memo__code-block"><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="day-memo__inline-code">$1</code>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Italic
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

    // Images ![alt](url) — must be before link processing
    html = html.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" class="day-memo__image" loading="lazy">'
    );

    // Links [text](url)
    html = html.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="day-memo__link">$1</a>'
    );

    // Bare URLs
    html = html.replace(
        /(?<!")(?<!=)(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="day-memo__link">$1</a>'
    );

    // Tags #tag → clickable tag
    html = html.replace(
        /#([\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]+)/g,
        '<span class="day-memo__tag" data-tag="$1">#$1</span>'
    );

    // Line breaks
    html = html.replace(/\n/g, "<br>");

    return html;
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
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
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
