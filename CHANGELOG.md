# Changelog

## 0.1.21

- Place the optional task link after the task number in report headers.

## 0.1.20

- Place the task title and optional task link before the task number in reports.
- Omit trailing periods inside severity descriptions in both report formats and languages.

## 0.1.19

- Recolor the circular extension logo with terminal green on a black background.

## 0.1.18

- Replace the extension logo with the circular magnifying glass and enlarged braces design.
- Match the theme-aware Activity Bar icon to the simplified logo.

## 0.1.17

- Adapt the SQM lecture-notes light style to A4 PDF reports: green title banner, orange headings, blue links and CMU Sans with Cyrillic support.
- Add page numbers while preserving report structure, bold field labels and code highlighting.

## 0.1.16

- Open PDF reports through Windows Explorer using a native file path.
- Add Show in Folder after PDF export and keep viewer failures separate from successful exports.

## 0.1.15

- Start reviews from local files without an open workspace folder.
- Capture notes from the selected side of a file comparison, including Git snapshots.
- Explain missing editors, unsaved files and files outside the review project separately.

## 0.1.14

- Place the extension logo on a filled light circular background with an outline for visibility in light and dark themes.

## 0.1.13

- Use the new notebook, braces and magnifying glass logo as the extension icon.
- Match the Activity Bar icon to the new identity with a theme-aware monochrome version.

## 0.1.12

- Continue adding a code or general note after creating a review when no unfinished review exists.
- Preserve the original editor selection and code snapshot while task details are entered.
- Cancel the continuation when the start form is closed; keep validation errors in the start form.

## 0.1.11

- Bold field labels in PDF and Markdown while keeping values, descriptions and links in regular weight.
- Preserve compact spacing, code typography and syntax highlighting.

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
