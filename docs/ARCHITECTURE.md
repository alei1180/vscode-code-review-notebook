# Architecture

The extension is a local desktop tool. It never executes reviewed project code.

- `model.ts`: validated data schemas, line ranges, review state and task numbering.
- `storage.ts`: versioned JSON persistence with atomic replacement and a cross-process heartbeat lock.
- `extension.ts`: VS Code commands, editor snapshots and orchestration.
- `tree.ts`: review and note navigation.
- `forms.ts` and `media/form.js`: typed host boundary, CSP, accessible DOM construction and draft preservation.
- `i18n.ts`: complete English/Russian dictionaries. Manifest strings use standard `package.nls` localization.
- `report.ts`: shared report blocks, Markdown escaping, offline PDF and atomic no-overwrite export.

## Lifecycle

Draft → export reserved → completed. Reservation stores a stable number, language, timestamp and filename before export. A failed export stays reserved, so retries reproduce the same files. Existing byte-identical files are accepted; conflicting files are rejected. Both selected formats must succeed before completion.

A store lock serializes writers across VS Code windows. A heartbeat permits recovery after process failure. Form saves compare the original review snapshot with current storage to reject stale edits. Reads validate schema version and fields and never silently reset corrupt storage.

## Development decisions

Strict TypeScript and boundary validation with Zod. Pure domain/report modules are covered by Node tests. Integration tests run in VS Code. PDFKit and the bundled OFL Noto Sans font avoid browsers and network dependencies. esbuild packages runtime code; only VS Code remains external.

The VS Code minimum is 1.96; no proposed API is used. Build tooling uses Node 24, while the bundle targets Node 20 syntax for the extension host. Development and runtime dependencies are separate.

## Extension points

Future schema versions require explicit migrations. Remote support, automatic line tracking and shared task counters need separate designs and are intentionally outside the first release.
