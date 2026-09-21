# Changelog

## 0.1.10

- Restore severity selection, report descriptions and severity counts for general notes.
- Default general notes saved without severity in 0.1.9 to Minor while preserving existing severity values.

## 0.1.9

- Put severity descriptions in parentheses and source links directly after severity on the same line as their label.
- Remove severity from general note forms, report entries and severity counts; preserve compatibility with existing notes.
- Move the task URL directly after the task title in the report header.

## 0.1.8

- Render severity as regular text with a localized description for every note.
- Remove empty lines between line numbers, severity and the code snapshot label.
- Place task links on the same line as their label while preserving clickable URLs.

## 0.1.7

- Save reports under the user home folder in Code Review Note/task-number, falling back to the task title when the optional task number is empty.
- Add an optional task URL to review forms and reports.
- Format dates as local YYYY/MM/DD HH:mm.
- Place each note severity below its line numbers and add the colon to Code snapshot:.

## 0.1.6

- Use Noto Sans for report text and headings, matching the sans-serif interface style.
- Preserve FreeMono and syntax highlighting for code snapshots.

## 0.1.5

- Add general notes without code lines, optionally attached to a project file.
- Use regular text in the compact report header, keeping the report title bold.
- Show localized severity descriptions beside header counts, without bilingual level labels.
- Remove module prefixes and ranges from item headings; put line numbers before code snapshots.

## 0.1.4

- Keep FreeMono bold only for report headers, severity headings and module headings; use regular text for comments, code and links.
- Reduce line spacing and paragraph gaps in the report header.

## 0.1.3

- Add an editable Review Number field (default 1) with English/Russian labels, positive integer validation and task-specific duplicate protection.
- Preserve the chosen number in reports and filenames, with automatic numbering retained for legacy drafts.
- Use an embedded FreeMono Bold typewriter font throughout PDF reports, preserving Cyrillic text and syntax highlighting.

## 0.1.2

- Fix completion and export from the editor context menu: file URIs now open the review picker instead of being treated as review items.
- Add bundled command regression coverage for editor, palette, tree and cancellation paths, including Markdown and PDF output.

## 0.1.1

- Group context actions under Code Review Note.
- Replace File with editable Module / Модуль; preserve the original file for navigation.
- Lock line ranges and preserve code snapshots when editing notes.
- Add offline PDF syntax highlighting, a Cyrillic monospace font and wrapped code blocks across pages.
- Keep existing reviews compatible; infer languages for old notes from the source extension.

## 0.1.0

- Manual reviews with task metadata and multiple concurrent drafts.
- File and line notes with four severity levels and source links.
- English and Russian forms with live language switching.
- Local Markdown and PDF export with stable task-specific numbering.
- Snapshot navigation, editing, safe persistence and retryable exports.
