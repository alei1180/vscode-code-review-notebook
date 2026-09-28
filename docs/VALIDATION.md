# Validation record — updated 2026-09-28

Current package: **0.1.19**. Dates below refer to recorded checks, not a claim that every check was repeated on this document's update date.

## Completed checks

- On macOS, the 0.1.17 code passed 24 Node tests, bundled PDF/Markdown export checks, bundled command regression checks and report-opening tests. Versions 0.1.18 and 0.1.19 changed branding only; each passed compilation, packaging and verification of the PNG included in the VSIX.
- Coverage includes localization and draft preservation, review numbering, optional task URLs, general-note severity, immutable ranges, storage validation/locking, export conflicts, syntax highlighting and PDF page numbering.
- Bundled command checks cover creating a review before adding a note, cancellation, folderless windows, selecting a diff side and capturing Git text. They replace the VS Code UI boundary and are not Windows UI tests.
- Report-opening tests simulate Windows paths with Cyrillic, spaces and special characters, missing files and launcher failures. They do not launch Windows Explorer on Windows.
- Strict TypeScript, ESLint and Prettier checks passed for 0.1.17. Its SQM-style PDF was rendered and visually checked with a one-page example and a four-page stress report.
- The 0.1.19 VSIX includes the entry point, translations, PNG logo, theme-aware SVG, fonts and license texts. Test data and build sources are excluded.
- Publisher access was observed in Marketplace with the Owner role. Publisher ID remains `alei1180`; the display name was saved as Alexander Osadchy. Extension publication and Marketplace acceptance have not been recorded.
- The user tested Windows comparisons and PDF export. Reported failures led to folderless support in 0.1.15 and native PDF opening in 0.1.16. Successful Windows retesting of the latter has not been recorded.

## Historical checks

Earlier packages passed installed-extension integration on macOS with VS Code 1.138.0 and Node.js 24.19.0: activation, registered commands, opening a form and live language switching. This is not a fresh integration result for 0.1.19.

A previous production dependency audit reported no known advisories at the time. It is not a current security assessment.

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
12. Use demonstration data only when capturing screenshots for the listing.
