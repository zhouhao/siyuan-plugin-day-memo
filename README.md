# DayMemo - Memos-like Plugin for SiYuan

A lightweight, [Memos](https://github.com/usememos/memos)-inspired quick note-taking plugin for [SiYuan](https://b3log.org/siyuan). Capture thoughts, tag them, search and filter — all within SiYuan's main content area.

![SiYuan](https://img.shields.io/badge/SiYuan-≥3.3.0-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Main Tab View** — Opens as a full tab in SiYuan's main content area, with a two-column Memos-style layout
- **Sidebar Dock Panel** — Also available as a dock panel in SiYuan's sidebar (left/right/bottom); compact single-column layout for quick capture without leaving your current tab
- **Markdown Support** — Bold, italic, code, links, images, and more — rendered inline
- **Interactive Checklist** — Use `- [ ]` and `- [x]` syntax for task lists; checkboxes are clickable and toggle state is saved automatically
- **Mermaid Diagrams** — Fenced code blocks with ` ```mermaid ` are rendered as diagrams (flowcharts, sequence diagrams, etc.) using SiYuan's built-in Mermaid — zero extra dependencies
- **Image & Attachment Upload** — Upload images (button, paste, drag-drop) and arbitrary file attachments (zip, pdf, etc.) directly into memos; stored in SiYuan's `data/assets/` and synced automatically
- **Multi-Level Tag System** — Use `#tag` or `#parent/child/grandchild` syntax (Flomo-style) to organize memos; tags are displayed as a collapsible tree in the sidebar with expand/collapse toggles; clicking a parent tag filters all its child tags too
- **Calendar View** — Real month calendar with `‹` `›` navigation, "Today" button to jump back, heatmap coloring by memo density, and click-to-filter by date
- **Timeline View** — Memos grouped by date, newest first
- **Search** — Full-text search across all memos in the sidebar
- **Filter Tabs** — Switch between All / Pinned / Archived views
- **Add to Daily Note** — One-click to append any memo into SiYuan's Daily Note for the memo's creation date, with source attribution; supports custom path templates with rich date variables (see Settings below)
- **Regex Replacement Rules** — Define custom regex find-and-replace rules (in Settings) that are automatically applied to memo content before it's added to Daily Note — e.g., convert `#task ` lines into `- [ ] ` checklist items
- **Right-Click Context Menu** — Right-click any memo for quick actions: edit, pin, archive, add to daily note, set reminder, copy content, delete
- **Reminders** — Set a reminder on any memo via the right-click menu; a datetime picker dialog defaults to 10 minutes from now; when the time arrives, you get both a SiYuan in-app notification and a browser system notification
- **@-Mention References** — Type `@` followed by a keyword in the editor (starts matching after the first character) to open a live search popup over your existing memos, then `↑/↓` + `Enter` (or click) to insert a reference chip; click the chip later to jump straight to the referenced memo — great for cross-linking thoughts without leaving the keyboard
- **Annotations** — Annotate any memo to create a linked note (similar to Flomo's annotation feature); the annotation and source memo are connected with bidirectional links for easy navigation; annotation previews are displayed inline below the source memo; deleting a memo automatically cleans up all bidirectional annotation links to keep data consistent
- **Memo Templates** — Define reusable templates in Settings for quick memo creation; click the template button in the editor toolbar to pick from your saved templates and insert the content at cursor position
- **Tag Trigger** — Automatically create memos from SiYuan blocks that contain a specific tag (default: `#to-memo#`). When you add the trigger tag to any block in SiYuan, the plugin detects it in real time and imports the block content as a new memo (with the trigger tag stripped). Configurable trigger tag name in Settings; duplicates are prevented via block ID tracking
- **Export All as Markdown** — Export all memos to a single Markdown file from Settings; each memo includes its content and annotation relationships (parent/child links)
- **flomo One-Way Push** — Push memos to [flomo](https://flomoapp.com) via its Incoming Webhook API (flomo PRO required). Once enabled and the webhook URL is configured in Settings, each memo gains a **Send to flomo** action in both its hover buttons and right-click menu
- **Random Review** — One-click "Random Review" button in the sidebar to revisit random memos in a card-style dialog; browse through a batch of 5, navigate back and forth, or shuffle for a fresh set; any linked annotations of the current memo are rendered in full below the card for richer context; edit memos directly in the review dialog (`Ctrl+Enter` to save, `Escape` to cancel) — inspired by Flomo's daily review
- **Image Gallery** — "Gallery" button appears in the sidebar whenever any memo contains images; opens a grid view of all images across all memos sorted by date; click any thumbnail to open a full-size lightbox with keyboard navigation (`←` `→` to browse, `Escape` to close) and a "Jump to memo" link
- **Pin & Archive** — Pin important memos to top, archive old ones to reduce clutter
- **Cloud Sync Safe** — Timestamp-based merge logic with soft-delete tombstones for multi-device sync via SiYuan Cloud
- **Dark Mode** — Follows SiYuan's theme automatically
- **i18n** — English and Chinese supported

## Preview

![Preview](preview.png)

## Usage

1. Click the **DayMemo** icon in the top toolbar to open the full tab view, or find **DayMemo** in the sidebar dock for a compact panel
2. Type your memo in the editor area, use `#tag` or `#parent/child` for multi-level tags
3. Attach images (click 🖼, paste from clipboard, or drag-drop) and files (click 📎) — they upload to SiYuan's `assets/` folder
4. Use `- [ ]` for checklists (clickable after saving) and ` ```mermaid ` blocks for diagrams
5. Press `Ctrl+Enter` or click Save
6. Use the filter tabs (All / Pinned / Archived) to switch views
7. Click a date on the calendar to filter memos for that day; use **Today** button to jump back to the current month
8. Click tags in the sidebar to filter by tag
9. Hover over a memo to see edit / pin / archive / annotate / 📅 add to daily note / delete actions, or **right-click** for a context menu with all actions plus **Set Reminder** and **Annotate**
10. Click the annotate button on any memo to create an annotation — a new linked memo; annotations appear below the source memo with a preview, and clicking navigates between them
11. Double-click a memo's content to quickly enter edit mode
12. Select and copy text directly from memo content, or use the right-click menu to copy the full memo content

## Settings

Open plugin settings (click the gear icon on the DayMemo plugin card in SiYuan's Marketplace → Installed) to configure:

- **Daily Note Path Template** — Custom path template for the "Add to Daily Note" feature. Leave empty to use your notebook's default `dailyNoteSavePath`. Example:

  ```
  /Daily Note/{{now | date "2006/01"}}/第{{now | ISOWeek}}周/{{now | date "2006-01-02"}}-周{{now | WeekdayCN}}
  ```

  Supported template variables:

  | Template | Description | Example Output |
  |----------|-------------|----------------|
  | `{{now \| date "2006-01-02"}}` | Go-style date format | `2026-04-07` |
  | `{{now \| date "15:04:05"}}` | Go-style time format | `14:30:00` |
  | `{{now \| ISOWeek}}` | ISO week number | `15` |
  | `{{now \| ISOYear}}` | ISO week-numbering year | `2026` |
  | `{{now \| Weekday}}` | Day of week (0=Sunday) | `2` |
  | `{{now \| WeekdayCN}}` | Day of week in Chinese | `二` |
  | `{{now \| WeekdayCN2}}` | Day of week in Chinese with prefix | `周二` |

  Go date format tokens: `2006` (year), `01` (month), `02` (day), `15` (hour-24h), `03` (hour-12h), `04` (minute), `05` (second), `PM`/`pm`, `Monday`/`Mon`, `January`/`Jan`.

- **Use Current Date for Daily Note** — When enabled, uses the current system date when adding a memo to Daily Note; when disabled (default), uses the memo's creation date.

- **Enable Regex Replacement** — Toggle switch to enable/disable regex replacement rules when adding memos to Daily Note.

- **Replacement Rules** — A list of regex find-and-replace pairs applied (in order) to memo content before appending to Daily Note. Each rule has:
  - **Match pattern** — A JavaScript-compatible regex (applied with `gm` flags). Example: `^#task `
  - **Replacement text** — The replacement string. Example: `- [ ] `

  Use the `+` / `-` buttons to add or remove rules. Rules with an empty match pattern are ignored.

- **Memo Templates** — Define reusable text templates for quick memo creation. Each template has:
  - **Name** — A short label shown in the template picker
  - **Content** — The template text to insert

  Use the `+` / `-` buttons to add or remove templates. Templates with an empty name or content are ignored. To use a template, click the document icon (📄) in the editor toolbar and select from the dropdown.

- **Tag Trigger** — Toggle to enable/disable automatic memo creation from tagged SiYuan blocks.

- **Trigger Tag** — The tag name used to trigger memo creation (default: `to-memo`). When the plugin detects a block containing `#to-memo#` (SiYuan tag format), it automatically creates a memo from that block's content with the trigger tag removed.

- **flomo Sync** — Toggle to enable one-way push to flomo. When enabled, the **Send to flomo** action becomes available on each memo.

- **flomo Webhook URL** — Your flomo API webhook URL. Find it in flomo → Settings → API (flomo PRO required). Format: `https://flomoapp.com/iwh/xxx/xxx/`.

- **Export All as Markdown** — Click the export button to download all memos as a single `.md` file. Each memo is exported with its content and annotation relationships (links to parent/child annotations). The file is named `daymemo-export-YYYY-MM-DD.md`.

## Data Storage & Sync

- Memos: `data/storage/petal/siyuan-plugin-day-memo/memos-data`
- Settings: `data/storage/petal/siyuan-plugin-day-memo/settings`

Both are automatically included in SiYuan's cloud sync.

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

## Tech Stack

- **Language**: TypeScript (vanilla DOM, no framework)
- **Build**: Webpack + esbuild-loader + SCSS
- **Runtime**: SiYuan Plugin API (petal v1.1.7)
- **Min SiYuan Version**: 3.3.0

## License

MIT
