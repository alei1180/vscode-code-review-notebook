# Code Review Notebook

Manual code reviews in VS Code. Collect notes beside your code and export a local Markdown or PDF report.

[Install from Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=alei1180.vscode-code-review-notebook) · [Русская версия](README.ru.md)

## See it in action

![Code Review Notebook walkthrough: create a review, select a line, add a note and export a report](media/demo/walkthrough.gif)

## Features

- Multiple reviews with task title, optional task number/link, assignee and reviewer.
- Separate saved-name suggestions for assignees and reviewers across projects.
- Notes linked to a file and line range, with a saved code snapshot; general notes with an optional module.
- Four severity levels: Blocker, Major, Minor and Nitpick.
- English and Russian forms with live language switching.
- Markdown, PDF or both, including Cyrillic fonts and clickable source links.
- Automatic local persistence, editable review numbers and a configurable report folder.
- Keyboard chords for every extension context-menu command.
- No account, telemetry, AI service or network connection required for reviews and export.

## Quick start

1. Open a trusted local project, or a saved local file in a window without a folder, and select **Code Review Notebook** in the activity bar.
2. Choose **Start Code Review**. Enter Task Title, Assignee and Reviewer. Task Number and Task URL are optional. Review Number defaults to 1 and must be a positive integer unique within the task and project. Save the form.
3. Open a saved file, select lines, then use **Code Review Notebook: Add Review Note** from the **Code Review Notebook** editor submenu or Command Palette. The default shortcut is `Ctrl+Alt+Shift+R`, then `N` (`Cmd+Alt+Shift+R`, then `N` on macOS).
4. Choose the review, enter a comment, severity and optional source URL, and save.
5. Use a review's context menu to **Complete Review**. Choose Markdown, PDF or both.

If no unfinished review exists when adding a code or general note, the start form opens first. Saving it opens the corresponding note form; cancelling stops the operation.

Right-click notes to view their saved contents, edit or delete them. Click a note to open its original location. Completed reviews remain available for export and can be copied into a new review for the same task.

## Saved names

Assignee and Reviewer each offer a list of names from previously saved reviews. Type to narrow the suggestions, select a name or enter a new one. The lists are available when starting, editing or copying a review.

Names are remembered only after a successful save. Existing reviews seed the suggestions; changing a name keeps the old name available. The two histories are stored locally, shared across projects in the same extension storage, and survive VS Code restarts. Cancelling a form does not add names.

## Keyboard shortcuts

Press `Ctrl+Alt+Shift+R` (`Cmd+Alt+Shift+R` on macOS), release the keys, then press the action key. The prefix stands for Review. This replaces the old single `Ctrl+Alt+R` / `Cmd+Alt+R` binding to avoid VS Code command conflicts.

| Action key | Command                              | Context                        |
| ---------- | ------------------------------------ | ------------------------------ |
| `S`        | Start Code Review                    | Editor or review tree          |
| `N`        | Add Review Note                      | Editor                         |
| `G`        | Add General Note                     | Editor or review tree          |
| `C`        | Complete Review                      | Editor or review tree          |
| `X`        | Export Report                        | Editor or review tree          |
| `O`        | Open Reports Folder                  | Editor or review tree          |
| `R`        | Edit Review                          | Review tree                    |
| `D`        | New Review for This Task (Duplicate) | Review tree                    |
| `V`        | View Saved Note                      | Review tree                    |
| `E`        | Edit Note                            | Review tree                    |
| `Delete`   | Delete Note                          | Review tree, with confirmation |

Select the relevant review for review actions or the relevant note for note actions before using tree shortcuts. On Mac keyboards without a forward Delete key, use `Fn+Backspace` for `Delete`. Editor shortcuts require a local file; completion and export show the review picker. Shortcuts are inactive in terminals, form inputs and other views. User bindings or other extensions can assign the same keys; customize them in Keyboard Shortcuts using `@ext:alei1180.vscode-code-review-notebook`.

## File comparisons

When only files are open, a new review uses the active file’s directory as its project. In such a window the sidebar can show reviews from all stored projects. With workspace folders open, reviews are filtered by project URI.

For **Select for Compare → Compare with Selected**, select lines on the desired side and add a note. The file receiving the note must belong to the selected review’s project. Git snapshots are also supported through the Command Palette; the current context menu and shortcut are limited to `file:` documents. Git notes preserve historical code, while later file navigation opens the working-tree file.

## Modules and code snippets

The **Module** field is editable and initially contains the source path. Renaming it changes the sidebar and report label while preserving the original file for navigation. Line ranges are read-only and always come from the editor selection. Editing a comment does not recapture or move its saved code.

PDF reports use an A4 adaptation of the SQM lecture-notes light style: a green title banner, orange item headings, blue links and page numbers. They use embedded Computer Modern Unicode Sans with Cyrillic support; code snapshots retain the FreeMono monospace font. The report title, item headings and field labels are bold; field values use regular text; code keeps offline syntax highlighting. The language is captured from VS Code; older notes use the original file extension. Unknown languages and snippets over 100,000 characters are rendered as plain code. Existing exported files are not overwritten: after an update changes report formatting, choose a different output folder to regenerate an old report.

Use **Code Review Notebook: Add General Note** for observations without code lines. Choose **Without a file** or **Attach to a file…** within the review project. The optional name appears in the report; general notes have no line range or code snapshot. The command is available in the Command Palette, review panel toolbar and Code Review Notebook context menus.

The compact header includes each severity count and its description in the report language. Numbered note headings contain the chosen name or file path without a Module prefix or line numbers. A blank line before and after each heading separates notes in Markdown and PDF.

## Reports

Reports default to `~/Code Review Note/<task number>/`. If the optional task number is empty, the task title is used instead (sanitized for filenames). The header starts with Task Title, then Task Number and Task URL when provided. Dates use local time in `YYYY/MM/DD HH:mm` format. Code notes show severity below the line numbers, then an optional source link and `Code snapshot:`.

General notes have a severity selector and contribute to severity counts. Notes saved without a severity in 0.1.9 default to Minor. Severity descriptions appear in parentheses without a trailing period. Field labels are bold. Line numbers, severity, the optional source link and `Code snapshot:` have no blank lines between them. URLs share the line with their labels; the task URL follows the task number (or the title when no number is provided).

After PDF-only export, **Open report** launches the system viewer; on Windows it passes the native path to Explorer. **Show in Folder** reveals the saved file. Markdown is opened in VS Code; when exporting both formats, Markdown opens first. A viewer launch failure does not undo the export.

The last item in the Code Review Notebook context menu, **Open Reports Folder**, opens the configured report root in your system file manager. The folder is created if needed.

## Settings

| Setting                           | Default            | Purpose                                                                          |
| --------------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| `codeReviewNotes.language`        | `en`               | Form, sidebar and message language: `en` or `ru`                                 |
| `codeReviewNotes.reportFormat`    | `markdown`         | `markdown`, `pdf` or `both`                                                      |
| `codeReviewNotes.reportDirectory` | `Code Review Note` | Report root, absolute or relative to your home folder; a task subfolder is added |

Changing the language preserves values in open forms. Static Command Palette entries, context menus and Settings descriptions follow the VS Code display language. Report labels use the extension language at completion; later exports keep that language.

Report example: `SHOP-142_Add-payment_review-01.pdf`. Set Review Number in the start form (default 1). It must be a positive integer unique within the task and project. For a new pass, enter the next unused number manually; opening the form does not increment 1 automatically. Tasks are identified by project URI and task number, or by title when the number is empty. Legacy drafts without an explicit number keep automatic numbering. Re-exporting keeps the number. Different existing content is never silently overwritten; change the report directory to resolve a conflict.

## Data and limitations

Reviews and name histories are stored in `reviews.json` in VS Code's local extension global storage. Reviews carry a project URI; name histories span all projects in that storage. Changing `codeReviewNotes.reportDirectory` affects subsequent exports and Open Reports Folder; it does not move existing reports or the review database. Back up the extension storage if you need to transfer drafts; exporting a report is not a draft backup. Project moves do not automatically migrate drafts.

Supported scope: trusted local desktop VS Code on Windows, macOS and Linux, including windows with only local files open. VS Code 1.96 or newer is declared in the manifest; platform and minimum-version verification status is recorded in [validation](docs/VALIDATION.md). Browser, remote and virtual workspaces are not supported. Multi-root workspaces support choosing the review's project folder.

Files must be saved and have no unsaved changes when adding a note. Content and selection are captured when the add command runs, before any forms open, and persisted when the note is saved. Line numbers are snapshots and do not follow edits. If the source disappears, the saved note and code remain readable. Concurrent edits from another window are rejected instead of silently overwriting the review.

An interrupted export retains its number and temporarily prevents editing; retry completion to finish. A crashed storage writer's lock expires after about 30 seconds. Keep review and report sizes reasonable; PDF generation is in memory.

## Installation

Install [Code Review Notebook from Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=alei1180.vscode-code-review-notebook), or use the VS Code command line:

```sh
code --install-extension alei1180.vscode-code-review-notebook
```

### Install from VSIX

Use **Extensions → … → Install from VSIX…** and select the release package. Alternatively: `code --install-extension vscode-code-review-notebook-0.1.29.vsix`.

Updates are published to Marketplace manually; the repository does not publish automatically.

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

The README demo can be refreshed using the [capture and rebuild instructions](docs/DEMO.md).

## License

MIT — Copyright 2026 Alexander Osadchy.

## Moving from the previous extension ID

The extension ID is now `alei1180.vscode-code-review-notebook`. VS Code treats it as a separate extension. Disable the previous `alei1180.vscode-code-review-notes` extension before using the new one to avoid duplicate commands.

To retain reviews and saved people, close VS Code and back up the previous extension's `reviews.json` in your active profile's `globalStorage/alei1180.vscode-code-review-notes` directory. Copy it into `globalStorage/alei1180.vscode-code-review-notebook` before creating reviews with the new extension. Do not overwrite an existing destination database; the files are not automatically merged. Keep the backup until the reviews appear in the new extension.

The `codeReviewNotes.*` settings and commands, and the configured report directory, remain unchanged. Exported reports do not need to be moved.
