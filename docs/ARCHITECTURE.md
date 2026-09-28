# Architecture

The extension is a local desktop tool. It never executes reviewed project code.

- `model.ts`: validated data schemas, line ranges, review state and task numbering.
- `people.ts`: separate assignee/reviewer histories, seeded from existing reviews and updated on successful form saves.
- `storage.ts`: versioned JSON persistence with atomic replacement and a cross-process heartbeat lock.
- `extension.ts`: VS Code commands, editor snapshots and orchestration.
- `note-fields.ts`: common code/general-note field definitions and read-only ranges.
- `highlight.ts` and `pdf-code.ts`: offline syntax tokens and wrapped, paginated monospace code.
- `open-report.ts`: native Windows Explorer launch without a command shell; VS Code external opener on other platforms.
- `brotli.ts`: native Brotli adapter used by bundled font decoding.
- `tree.ts`: review and note navigation.
- `forms.ts` and `media/form.js`: typed host boundary, CSP, accessible DOM construction and draft preservation.
- `i18n.ts`: complete English/Russian dictionaries. Manifest strings use standard `package.nls` localization.
- `report.ts`: shared report blocks, Markdown escaping, offline PDF and atomic no-overwrite export.

## Lifecycle

Draft → export reserved → completed. Reservation stores a stable number, language, timestamp and filename before export. A failed export stays reserved, so retries reproduce the same files. Existing byte-identical files are accepted; conflicting files are rejected. Both selected formats must succeed before completion.

A store lock serializes writers across VS Code windows. A heartbeat permits recovery after process failure. Form saves compare the original review snapshot with current storage to reject stale edits. Reads validate schema version and fields and never silently reset corrupt storage.

## Project and editor context

Reviews use a local directory URI as their project key. Starting without workspace folders derives it from the active local file. Folderless windows show all stored reviews; workspace windows filter by folder URI. Editor context commands resolve the selected diff side, then capture content and selection before opening forms. Git document queries provide the underlying local file path; historical text is saved in the note, but later navigation uses the working tree.

Reports default to `~/Code Review Note/<task number or title>/`. Task URLs are optional. General notes retain severity and may omit file and source coordinates. PDF presentation uses CMU Sans, the SQM-inspired palette and page numbers; the shared block order also drives Markdown.

## Storage and report directories

`reviews.json` in `ExtensionContext.globalStorageUri` stores schema version 1, reviews, the active review ID and optional `people` arrays keyed by `assignee` and `reviewer`. The optional field preserves compatibility with existing databases. Suggestions merge those arrays with saved reviews, trim names and remove exact duplicates. A successful review save remembers names in the same locked transaction as review details, before replacing old details; failed or cancelled saves do not update history.

`reportRootDirectory()` resolves `codeReviewNotes.reportDirectory` against the user home directory, defaulting to `Code Review Note`; absolute paths remain absolute. `reportDirectory()` adds a sanitized task number/title. Open Reports Folder creates and opens the root through the same native opener used for PDFs. Changing the setting does not migrate reports or global storage.

## Keyboard commands

The manifest declares two-stroke chords: `Ctrl+Alt+Shift+R` (macOS: `Cmd+Alt+Shift+R`), then an action key. Editor bindings require a trusted local file and editor text focus. Tree bindings require focus on `codeReviewNotes.reviews`, list focus and no text input focus. Terminal, web, remote and other-view contexts are excluded.

Tree-specific bindings pass `{ fromReviewTree: true }`. The command adapter resolves `TreeView.selection[0]`; an empty selection returns without opening a review picker. Context-menu calls continue to pass explicit items, and editor commands retain the review picker. Existing validation and delete confirmation also apply to keyboard calls. Shortcut mappings and contexts are documented in both READMEs and tested for menu coverage and internal ambiguity.

## Development decisions

Strict TypeScript and boundary validation with Zod. Pure domain/report modules are covered by Node tests. Integration tests run in VS Code. PDFKit, embedded OFL Computer Modern Unicode Sans and FreeMono (with its font embedding exception) avoid browsers and network dependencies. esbuild packages runtime code; only VS Code remains external.

The VS Code minimum is 1.96; no proposed API is used. Build tooling uses Node 24, while the bundle targets Node 20 syntax for the extension host. Development and runtime dependencies are separate.

## Extension points

Future schema versions require explicit migrations. Remote support, automatic line tracking and shared task counters need separate designs and are intentionally outside the first release.
