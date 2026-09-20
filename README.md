# Code Review Notes

Manual code reviews in VS Code. Collect notes beside your code and export a local Markdown or PDF report.

[Русская версия](README.ru.md)

## Features

- Multiple reviews with task title, task number, assignee and reviewer.
- Notes linked to a file and line range, with a saved code snapshot.
- Four severity levels: Blocker, Major, Minor and Nitpick.
- English and Russian forms with live language switching.
- Markdown, PDF or both, including Cyrillic fonts and clickable source links.
- Automatic local persistence and task-specific review numbering.
- No account, telemetry, AI service or network connection required for reviews and export.

## Quick start

1. Open a trusted local project and select **Code Review Notes** in the activity bar.
2. Choose **Start Code Review**, fill in the four fields and save.
3. Open a saved file, select lines, then use **Code Review Notes: Add Review Note** from the **Code Review Note** editor submenu or Command Palette. The default shortcut is `Ctrl+Alt+R` (`Cmd+Alt+R` on macOS).
4. Choose the review, enter a comment, severity and optional source URL, and save.
5. Use a review's context menu to **Complete Review**. Choose Markdown, PDF or both.

Right-click notes to view their saved contents, edit or delete them. Click a note to open its original location. Completed reviews remain available for export and can be copied into a new review for the same task.

## Modules and code snippets

The **Module** field is editable and initially contains the source path. Renaming it changes the sidebar and report label while preserving the original file for navigation. Line ranges are read-only and always come from the editor selection. Editing a comment does not recapture or move its saved code.

PDF reports use an embedded FreeMono Bold typewriter font with Cyrillic support; code keeps offline syntax highlighting. The language is captured from VS Code; older notes use the original file extension. Unknown languages and snippets over 100,000 characters are rendered as plain code. Existing exported files are not overwritten: after an update changes report formatting, choose a different output folder to regenerate an old report.

## Settings

| Setting                           | Default             | Purpose                                                     |
| --------------------------------- | ------------------- | ----------------------------------------------------------- |
| `codeReviewNotes.language`        | `en`                | Form, sidebar and message language: `en` or `ru`            |
| `codeReviewNotes.reportFormat`    | `markdown`          | `markdown`, `pdf` or `both`                                 |
| `codeReviewNotes.reportDirectory` | `code-review-notes` | Absolute directory or path relative to the reviewed project |

Changing the language preserves values in open forms. Static Command Palette entries, context menus and Settings descriptions follow the VS Code display language. Report labels use the extension language at completion; later exports keep that language.

Report example: `SHOP-142_Add-payment_review-01.pdf`. Set Review Number in the start form (default 1). It must be a positive integer unique within the task and project. Legacy drafts without an explicit number keep automatic numbering. Re-exporting keeps the number. Different existing content is never silently overwritten; change the report directory to resolve a conflict.

## Data and limitations

Reviews are stored in VS Code's local extension global storage, partitioned by project URI. Reports go to the configured directory. Back up the extension storage if you need to transfer drafts; exporting a report is not a draft backup. Project moves do not automatically migrate drafts.

Supported scope: trusted local folders in desktop VS Code on Windows, macOS and Linux. Browser, remote and virtual workspaces are not supported. Multi-root workspaces support choosing the review's project folder.

Files must be saved and have no unsaved changes when adding a note. Line numbers are snapshots and do not follow edits. If the source disappears, the saved note and code remain readable. Concurrent edits from another window are rejected instead of silently overwriting the review.

An interrupted export retains its number and temporarily prevents editing; retry completion to finish. A crashed storage writer's lock expires after about 30 seconds. Keep review and report sizes reasonable; PDF generation is in memory.

## Install from VSIX

Use **Extensions → … → Install from VSIX…** and select the release package. Alternatively: `code --install-extension vscode-code-review-notes-0.1.2.vsix`.

Marketplace publication is planned. The repository does not publish automatically.

## Development

Use Node.js 24 and pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile
pnpm run test
pnpm run lint
pnpm run format:check
pnpm run test:integration
pnpm run package
```

Press F5 to start the Extension Development Host. `test:integration` downloads official VS Code by default; set `VSCODE_EXECUTABLE` to use an installed executable. Dependencies are bundled into the extension; `--no-dependencies` excludes redundant `node_modules` from VSIX packaging.

See [validation record](docs/VALIDATION.md), [architecture](docs/ARCHITECTURE.md), [publishing](PUBLISHING.md), [support](SUPPORT.md), [changes](CHANGELOG.md) and [third-party notices](THIRD_PARTY_NOTICES.md).

## License

MIT — Copyright 2026 Alexander Osadchy.
