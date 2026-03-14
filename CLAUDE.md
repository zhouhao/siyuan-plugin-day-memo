# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DayMemo is a Memos-like quick note-taking plugin for SiYuan Note. It provides two UI surfaces: a full **tab panel** (two-column layout with sidebar) and a compact **dock panel** (single-column for sidebar use). Built with vanilla TypeScript DOM manipulation — no UI framework.

## Build Commands

```bash
pnpm i              # Install dependencies
pnpm dev            # Development build (watch mode, outputs to project root)
pnpm build          # Production build (outputs to dist/, generates package.zip)
```

There are no tests or linting configured in this project.

## Architecture

### Plugin Entry Point

`src/index.ts` — `DayMemoPlugin` extends SiYuan's `Plugin` class. Registers:
- A **custom tab** (`TAB_TYPE`) that creates a `TabPanel`
- A **dock panel** (`DOCK_TYPE`) that creates a `DockPanel`
- A **top bar button** to open the tab
- A **keyboard command** (`⌥⌘N`) for quick capture dialog

### Data Layer

- **`src/store.ts`** (`MemoDataStore`) — Central state management with pub/sub pattern. Holds all memos in memory, manages filter state, and persists via SiYuan's `plugin.loadData`/`plugin.saveData` API to `data/storage/petal/siyuan-plugin-day-memo/memos-data`.
- **Sync strategy**: Timestamp-based merge (`updatedAt` wins). Deletes use soft-delete tombstone (`deleted: true`) for multi-device sync safety.
- **`src/types.ts`** — `Memo` interface, `FilterState`, constants (`STORAGE_MEMOS`, `TAB_TYPE`, `DOCK_TYPE`).

### Component Hierarchy

All components are vanilla DOM classes following the same pattern: constructor receives a container element + store + i18n, renders into the container, subscribes to store changes, and exposes a `destroy()` method for cleanup.

```
TabPanel (two-column layout)
├── Sidebar (search, heatmap calendar, tag cloud, stats)
│   ├── Heatmap (month calendar with memo density)
│   └── TagList (clickable tag cloud)
├── MemoEditor (textarea + image/file upload + save/cancel)
├── FilterBar (All/Pinned/Archived tabs + active filter badges)
└── MemoList (timeline grouped by date)
    └── MemoItem (single memo: rendered markdown, actions, checklist)

DockPanel (single-column compact layout)
├── MemoEditor
├── FilterBar
├── TagList
└── MemoList
    └── MemoItem
```

### Key Modules

- **`src/api.ts`** — SiYuan kernel API wrappers: `request()` (generic fetch), `uploadAsset()` (multipart file upload), `addToDailyNote()` (finds/creates daily note doc and appends memo content).
- **`src/utils.ts`** — Pure utilities: ID generation, tag extraction (`#tag` regex supporting CJK), markdown-to-HTML renderer (custom, supports bold/italic/code/links/images/checklists/mermaid), date formatting, heatmap levels, mermaid lazy loading from SiYuan's bundled script.

### Rendering Approach

The custom markdown renderer in `utils.ts` (`renderMarkdown()`) handles inline formatting, images, links, `#tag` clickable spans, and `- [ ]`/`- [x]` interactive checklists. Mermaid diagrams use SiYuan's built-in mermaid.js loaded lazily. No external markdown library.

### i18n

Translation files live in `src/i18n/` — `src/i18n/en_US.json` and `src/i18n/zh_CN.json`. New i18n keys must be added to both files. Accessed via `plugin.i18n` (SiYuan loads the correct locale automatically). All user-facing strings should go through i18n.

### Build System

Webpack + esbuild-loader + SCSS. Dev mode outputs `index.js`/`index.css` to project root (SiYuan loads from there). Production mode outputs to `dist/` and packages as `package.zip` with gzip.

- `siyuan` is externalized (provided by the host environment)
- Output format: CommonJS (`commonjs2`)
- Target: ES6

### CSS

All styles in `src/index.scss`. Class prefix: `day-memo__`. Uses SiYuan's CSS variables (`--b3-theme-*`) for theme integration. Uses SiYuan's built-in CSS classes (`b3-button`, `b3-text-field`, `fn__flex-*`, `b3-tooltips`) for consistency.

## Data Storage

- Memos: `data/storage/petal/siyuan-plugin-day-memo/memos-data` (JSON via SiYuan plugin storage API)
- Uploaded assets: `data/assets/` (SiYuan standard assets directory)
- Both are included in SiYuan cloud sync

## SiYuan Plugin API

The plugin depends on `siyuan` package (v1.1.7) which provides: `Plugin`, `Dialog`, `showMessage`, `confirm`, `openTab`, `getFrontend`, `fetchPost`. Min SiYuan version: 3.3.0.
