# Support

Report bugs or request features at https://github.com/alei1180/vscode-code-review-notebook/issues.

Include extension and VS Code versions, operating system, reproduction steps and the relevant error category from the Code Review Notebook output channel. Remove source code, personal information, credentials and private file paths from attachments.

For export conflicts, change the report directory. After a crashed writer, wait approximately 30 seconds before retrying. For corrupt storage, preserve a backup before attempting recovery; do not delete it if you need your drafts.

## File comparisons

A new review in a window without folders uses the active file's directory. Select the desired side and line range before adding a note. The selected file must be inside the review's project, and changes must be saved first. For Git snapshots, use the Command Palette: the current context menu and shortcut are limited to local `file:` documents.

## PDF opening

Version 0.1.16 introduced native Windows Explorer opening. If Open report does not launch a viewer, use Show in Folder and open the PDF there. Check the default PDF application. In a bug report, include whether that same file opens directly from Explorer. A viewer failure does not mean the export failed.

## Export after a formatting update

Existing reports are never overwritten with different content. To regenerate a report with a new PDF style, choose a different report directory and export again. Its reserved number and language remain unchanged.

## Saved names

Assignee and Reviewer have separate local histories. Save the review form successfully before expecting a newly entered name in later suggestions. Cancelling or failing validation does not save it. Existing reviews also supply suggestions. Names are shared across projects in the same extension storage, but are not recovered by moving the reports folder to another machine. Back up `reviews.json` with the drafts. There is currently no command for clearing an individual name from history.

## Reports folder

The last item in both extension context menus is **Open Reports Folder**. It opens the root from `codeReviewNotes.reportDirectory`, creating it if necessary. Relative paths are based on the user home directory. Check write permissions and availability of external or network drives if creating/opening the folder fails. Changing the setting does not relocate existing reports or review data.

## Keyboard shortcuts

From 0.1.25, press `Ctrl+Alt+Shift+R` (macOS: `Cmd+Alt+Shift+R`), release the keys, then press the action key listed in the [shortcut table](README.md#keyboard-shortcuts). The old single `Ctrl+Alt+R` / `Cmd+Alt+R` binding has been removed. On a Mac keyboard, forward Delete may require `Fn+Backspace`.

Focus a saved local file editor or the review tree; shortcuts are intentionally inactive in terminals, webview forms and other panels. For tree actions, select the relevant review or note first. In Keyboard Shortcuts, filter by `@ext:alei1180.vscode-code-review-notes`, then use **Show Same Keybindings** to inspect conflicts with user settings or another extension. Custom mappings can override defaults. Include the keyboard layout and focused panel when reporting a shortcut problem; do not reset all user bindings as a first troubleshooting step.
