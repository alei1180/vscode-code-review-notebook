# Changelog

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
