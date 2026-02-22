# DayMemo - Memos-like Plugin for SiYuan

A lightweight, [Memos](https://github.com/usememos/memos)-inspired quick note-taking plugin for [SiYuan](https://b3log.org/siyuan). Capture thoughts, tag them, search and filter — all within SiYuan's main content area.

![SiYuan](https://img.shields.io/badge/SiYuan-≥3.3.0-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Main Tab View** — Opens as a full tab in SiYuan's main content area (not a dock panel), with a two-column Memos-style layout
- **Markdown Support** — Bold, italic, code, links, images, and more — rendered inline
- **Interactive Checklist** — Use `- [ ]` and `- [x]` syntax for task lists; checkboxes are clickable and toggle state is saved automatically
- **Mermaid Diagrams** — Fenced code blocks with ` ```mermaid ` are rendered as diagrams (flowcharts, sequence diagrams, etc.) using SiYuan's built-in Mermaid — zero extra dependencies
- **Image & Attachment Upload** — Upload images (button, paste, drag-drop) and arbitrary file attachments (zip, pdf, etc.) directly into memos; stored in SiYuan's `data/assets/` and synced automatically
- **Tag System** — Use `#tag` syntax to organize memos; tags are auto-extracted and displayed in the sidebar tag cloud
- **Calendar View** — Real month calendar with `‹` `›` navigation, "Today" button to jump back, heatmap coloring by memo density, and click-to-filter by date
- **Timeline View** — Memos grouped by date, newest first
- **Search** — Full-text search across all memos in the sidebar
- **Filter Tabs** — Switch between All / Pinned / Archived views
- **Pin & Archive** — Pin important memos to top, archive old ones to reduce clutter
- **Cloud Sync Safe** — Timestamp-based merge logic with soft-delete tombstones for multi-device sync via SiYuan Cloud
- **Dark Mode** — Follows SiYuan's theme automatically
- **i18n** — English and Chinese supported

## Layout

```
┌──────────────────────────────────────────────────────────┐
│  Toolbar  [DayMemo icon]                                 │
├──────────────────┬───────────────────────────────────────┤
│   Left Sidebar   │         Right Main Area               │
│                  │                                       │
│  🔍 Search       │  ┌─────────────────────────────────┐  │
│                  │  │  📝 Memo Editor (textarea)      │  │
│  📅 Calendar     │  │  [🖼 Image] [📎 Attach]         │  │
│  (month view,    │  │     Ctrl+Enter to save          │  │
│   heatmap,       │  └─────────────────────────────────┘  │
│   [Today] btn,   │                                       │
│   click to       │  [All] [Pinned] [Archived]  #tag ✕   │
│   filter)        │                                       │
│                  │  ── Feb 21, 2026 ──────────────────   │
│  🏷️ Tags         │  memo content here...     📌 📦 ✏️ 🗑  │
│  (cloud, click   │  ☑ checklist / 📊 mermaid  📌 📦 ✏️ 🗑  │
│   to filter)     │  🖼️ image / 📎 attachment  📌 📦 ✏️ 🗑  │
│                  │                                       │
│                  │  ── Feb 20, 2026 ──────────────────   │
│  📊 Stats        │  memo content here...     📌 📦 ✏️ 🗑  │
│  (total, days,   │                                       │
│   tags)          │                                       │
└──────────────────┴───────────────────────────────────────┘
```

## Usage

1. Click the **DayMemo** icon in the top toolbar to open the tab
2. Type your memo in the editor area, use `#tags` inline
3. Attach images (click 🖼, paste from clipboard, or drag-drop) and files (click 📎) — they upload to SiYuan's `assets/` folder
4. Use `- [ ]` for checklists (clickable after saving) and ` ```mermaid ` blocks for diagrams
5. Press `Ctrl+Enter` or click Save
6. Use the filter tabs (All / Pinned / Archived) to switch views
7. Click a date on the calendar to filter memos for that day; use **Today** button to jump back to the current month
8. Click tags in the sidebar to filter by tag
9. Hover over a memo to see edit / pin / archive / delete actions

## Data Storage & Sync

Memos are stored in `data/storage/petal/siyuan-plugin-day-memo/memos-data`, which is automatically included in SiYuan's cloud sync.

Uploaded images and attachments are stored in SiYuan's standard `data/assets/` directory, also included in cloud sync.

**Multi-device safety**: When loading data, the plugin performs a timestamp-based merge — for each memo, the version with the newer `updatedAt` wins. Deletes use soft-delete (tombstone) flags so they propagate correctly across devices.

## Development

```bash
# Install dependencies
pnpm i

# Development build (watch mode)
pnpm dev

# Production build (generates package.zip)
pnpm build
```

### Project Structure

```
src/
├── index.ts              # Plugin entry: tab registration, toolbar button, quick capture
├── types.ts              # Memo, MemoStore, FilterState types
├── store.ts              # Data store: CRUD, filtering, merge logic, persistence
├── utils.ts              # Helpers: ID gen, tag extraction, markdown→HTML (images, attachments, checklists, mermaid, links), dates
├── api.ts                # SiYuan kernel API wrapper (notifications, asset upload)
├── index.scss            # All styles (two-column layout, calendar, components)
├── i18n/
│   ├── en_US.json        # English translations
│   └── zh_CN.json        # Chinese translations
└── components/
    ├── TabPanel.ts       # Two-column layout orchestrator
    ├── Sidebar.ts        # Left column: search, calendar, tags, stats
    ├── Heatmap.ts        # Month calendar with navigation, "Today" button, and heatmap
    ├── MemoEditor.ts     # Textarea with image/attachment upload, paste, drag-drop, save/cancel
    ├── MemoList.ts       # Timeline view grouped by date
    ├── MemoItem.ts       # Single memo card with action buttons, checklist toggle, mermaid rendering
    ├── FilterBar.ts      # Filter tabs + active tag/date badges
    └── TagList.ts        # Tag cloud with counts
```

## Tech Stack

- **Language**: TypeScript (vanilla DOM, no framework)
- **Build**: Webpack + esbuild-loader + SCSS
- **Runtime**: SiYuan Plugin API (petal v1.1.7)
- **Min SiYuan Version**: 3.3.0

## License

MIT
