# Validation record — updated 2026-09-28

Current package: **0.1.25**. The results below distinguish local automated checks, visual checks and tests still pending on other platforms.

## Completed checks for 0.1.25 — 2026-09-28

- On macOS, `npm test` passed all 27 Node tests, bundled PDF/Markdown export, bundled command regressions and report-opening tests. TypeScript compilation, ESLint, Prettier and VSIX packaging also passed.
- Name-history coverage includes seeding existing reviews, separate roles, duplicate removal, retention after editing, persistence across reopening the store and rollback after failed saves. Form tests cover safe suggestion rendering, free input and language changes.
- Shortcut checks cover every context-menu command, scoped bindings and internal chord ambiguity. Bundled command checks verify selection-based note viewing, cancellation and confirmation of deletion, and no review picker for an empty tree selection.
- Report-folder command checks cover the default root, a custom relative path and an absolute path, including creation before opening. Both extension context menus keep this command last.
- A development-host integration run passed in a separate profile using the installed **VS Code 1.139.1** on macOS: extension activation, command registration, opening the start form and live English/Russian switching. This run used the source checkout and built bundle, not an installed 0.1.25 VSIX.
- The local Keyboard Shortcuts UI, user bindings and installed extension manifests were inspected. The old macOS `Cmd+Alt+R` overlaps built-in regex commands. The new prefix overlaps a GitHub Pull Requests command only in that extension's tree, outside our active contexts. This is not a guarantee against arbitrary user bindings, future extensions or OS-level shortcuts.
- The 0.1.25 VSIX was packaged with the entry point, translations, PNG logo, theme-aware SVG, fonts, documentation and license texts. Test data and build sources are excluded.

The bundled command tests replace the VS Code UI boundary; they are not native keyboard or Windows UI tests. Report-opening tests simulate Windows paths and launcher failures without opening Windows Explorer. Physical-key walkthroughs on Windows/Linux and different keyboard layouts remain pending.

## Earlier checks and observations

- Version 0.1.23 passed tests, lint, formatting and packaging. A PDF preview was rendered and inspected for blank lines before and after note headings, including after a general note. The Markdown transition was also checked.
- The 0.1.17 SQM-style PDF was visually checked with a one-page example and a four-page stress report. Versions 0.1.18 and 0.1.19 changed branding; their PNG assets were verified in the packages.
- Earlier installed-extension integration passed on macOS with VS Code 1.138.0 and Node.js 24.19.0. A previous production dependency audit reported no known advisories at that time; it is not a current security assessment.
- Publisher access was observed with the Owner role. Publisher ID remains `alei1180`, with display name Alexander Osadchy. Publication and Marketplace acceptance have not been recorded.
- User testing on Windows led to folderless comparison support in 0.1.15 and native PDF opening in 0.1.16. Successful Windows retesting of the latter has not been recorded.

## Pending release checks

- Inspect successful Windows/macOS/Linux CI results for the final commit; configuring a matrix does not establish that it has passed.
- Test the declared minimum VS Code 1.96, or raise it to a verified version.
- Perform the final clean-profile walkthrough below, including native PDF opening on Windows.
- Check public repository links and Marketplace name availability. Real demonstration screenshots are recommended but not an upload requirement.
- Upload only with owner authorization, then verify Marketplace acceptance and installation.

## Manual checklist

1. Install the final VSIX in a clean profile. Test both a trusted workspace and a window with only saved files.
2. Create a review with Task Title, Assignee and Reviewer. Test optional Task Number/Task URL and Review Number (default 1), including duplicate-number rejection within a task/project.
3. Add code and general notes without an existing review. Test saving and cancelling the start form.
4. Capture one line and a selection ending at column zero of the next line. Test both sides of a local comparison and Git snapshots through the Command Palette.
5. Rename Module; verify the original path, range and snapshot remain unchanged. Test general notes with/without a file, all severities and optional source links.
6. Change the extension language during entry; verify values remain. Check static commands separately using VS Code's display language.
7. Edit/delete notes, inspect a snapshot after removing its source, restart VS Code and verify persistence.
8. Export Markdown, PDF and both. Verify the home-directory task folder, optional task URL, local dates, severity counts/descriptions and page numbers.
9. Test Open report and Show in Folder for PDF, including paths with Cyrillic and spaces. A viewer failure must not lose the export.
10. Test empty reviews, re-export, conflicting filenames, unavailable output directories and retry after interrupted export.
11. Inspect long Cyrillic text, links and code. Check light/dark/high-contrast themes and keyboard navigation.
12. Save new assignee/reviewer names, restart VS Code and check suggestions in another project. Verify free entry, cancelled forms, editing/copying and existing-review suggestions.
13. Change the report root to relative and absolute paths. Open it through the last context-menu item, including before the first export; confirm old reports remain in their original folder.
14. Test every shortcut in the README table with the editor or correct tree item focused. Verify no action in terminals/forms/other views, and confirm deletion can be cancelled. Check supported OSes, keyboard layouts and custom binding conflicts.
15. Check report header order (title, optional number, optional link), bold field labels, descriptions in parentheses without trailing periods, heading spacing and compact note metadata in both formats/languages.
16. Use demonstration data only when capturing screenshots for the listing.
