# DayMemo - Memos-like Plugin for SiYuan

A lightweight, Memos-inspired quick note-taking plugin for [SiYuan](https://b3log.org/siyuan). Capture thoughts, tag them, search and filter — all within SiYuan.

## Features

- **Quick Capture** — Jot down thoughts instantly via dock panel or keyboard shortcut (`Alt+Cmd+N`)
- **Markdown Support** — Bold, italic, code, links, and more
- **Tag System** — Use `#tag` syntax to organize memos; auto-extracted and filterable
- **Timeline View** — Memos grouped by date, newest first
- **Search** — Full-text search across all memos
- **Pin & Archive** — Pin important memos to top, archive old ones
- **Dark Mode** — Follows SiYuan's theme automatically
- **i18n** — English and Chinese supported

## Usage

1. Open the **DayMemo** dock panel from the right sidebar
2. Type your memo in the editor area, use `#tags` inline
3. Press `Ctrl+Enter` or click Save
4. Use the filter tabs (All / Pinned / Archived) and search bar to find memos
5. Click tags in the sidebar to filter by tag
6. Hover over a memo to see edit/pin/archive/delete actions

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Cmd+M` | Toggle DayMemo dock |
| `Alt+Cmd+N` | Quick capture dialog |
| `Ctrl+Enter` | Save memo (in editor) |

## Development

```bash
pnpm i
pnpm run dev
```

## Build

```bash
pnpm run build
```
