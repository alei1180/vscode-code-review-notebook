# Support

Report bugs or request features at https://github.com/alei1180/vscode-code-review-notes/issues.

Include extension and VS Code versions, operating system, reproduction steps and the relevant error category from the Code Review Notes output channel. Remove source code, personal information, credentials and private file paths from attachments.

For export conflicts, change the report directory. After a crashed writer, wait approximately 30 seconds before retrying. For corrupt storage, preserve a backup before attempting recovery; do not delete it if you need your drafts.

## File comparisons

A new review in a window without folders uses the active file's directory. Select the desired side and line range before adding a note. The selected file must be inside the review's project, and changes must be saved first. For Git snapshots, use the Command Palette: the current context menu and shortcut are limited to local `file:` documents.

## PDF opening

Version 0.1.16 introduced native Windows Explorer opening. If Open report does not launch a viewer, use Show in Folder and open the PDF there. Check the default PDF application. In a bug report, include whether that same file opens directly from Explorer. A viewer failure does not mean the export failed.

## Export after a formatting update

Existing reports are never overwritten with different content. To regenerate a report with a new PDF style, choose a different report directory and export again. Its reserved number and language remain unchanged.
