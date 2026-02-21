# DayMemo - Memos-like Plugin for SiYuan

A lightweight, [Memos](https://github.com/usememos/memos)-inspired quick note-taking plugin for [SiYuan](https://b3log.org/siyuan). Capture thoughts, tag them, search and filter — all within SiYuan's main content area.

![SiYuan](https://img.shields.io/badge/SiYuan-≥3.3.0-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Main Tab View** — Opens as a full tab in SiYuan's main content area (not a dock panel), with a two-column Memos-style layout
- **Quick Capture** — Jot down thoughts instantly via keyboard shortcut (`Alt+Cmd+N`) without leaving your current document
- **Markdown Support** — Bold, italic, code, links, and more — rendered inline
- **Tag System** — Use `#tag` syntax to organize memos; tags are auto-extracted and displayed in the sidebar tag cloud
- **Calendar View** — Real month calendar with `‹` `›` navigation, heatmap coloring by memo density, and click-to-filter by date
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
│  📅 Calendar     │  │     Ctrl+Enter to save          │  │
│  (month view,    │  └─────────────────────────────────┘  │
│   heatmap,       │                                       │
│   click to       │  [All] [Pinned] [Archived]  #tag ✕   │
│   filter)        │                                       │
│                  │  ── Feb 21, 2026 ──────────────────   │
│  🏷️ Tags         │  memo content here...     📌 📦 ✏️ 🗑  │
│  (cloud, click   │  memo content here...     📌 📦 ✏️ 🗑  │
│   to filter)     │                                       │
│                  │  ── Feb 20, 2026 ──────────────────   │
│  📊 Stats        │  memo content here...     📌 📦 ✏️ 🗑  │
│  (total, days,   │                                       │
│   tags)          │                                       │
└──────────────────┴───────────────────────────────────────┘
```

## Usage

1. Click the **DayMemo** icon in the top toolbar to open the tab
2. Type your memo in the editor area, use `#tags` inline
3. Press `Ctrl+Enter` or click Save
4. Use the filter tabs (All / Pinned / Archived) to switch views
5. Click a date on the calendar to filter memos for that day
6. Click tags in the sidebar to filter by tag
7. Hover over a memo to see edit / pin / archive / delete actions

## Data Storage & Sync

Memos are stored in `data/storage/petal/siyuan-plugin-day-memo/memos-data.json`, which is automatically included in SiYuan's cloud sync.

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
├── utils.ts              # Helpers: ID gen, tag extraction, markdown→HTML, dates
├── api.ts                # SiYuan kernel API wrapper
├── index.scss            # All styles (two-column layout, calendar, components)
├── i18n/
│   ├── en_US.json        # English translations
│   └── zh_CN.json        # Chinese translations
└── components/
    ├── TabPanel.ts       # Two-column layout orchestrator
    ├── Sidebar.ts        # Left column: search, calendar, tags, stats
    ├── Heatmap.ts        # Month calendar with navigation and heatmap
    ├── MemoEditor.ts     # Textarea with save/cancel and edit mode
    ├── MemoList.ts       # Timeline view grouped by date
    ├── MemoItem.ts       # Single memo card with action buttons
    ├── FilterBar.ts      # Filter tabs + active tag/date badges
    └── TagList.ts        # Tag cloud with counts
```

## Tech Stack

- **Language**: TypeScript (vanilla DOM, no framework)
- **Build**: Webpack + esbuild-loader + SCSS
- **Runtime**: SiYuan Plugin API (petal v1.1.7)
- **Min SiYuan Version**: 3.3.0

## License

[MIT](LICENSE)
