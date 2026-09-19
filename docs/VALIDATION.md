# Validation record — 2026-09-19

## Completed locally

Environment: macOS arm64, Node.js 24.19.0, VS Code 1.138.0.

- 13 automated tests pass: line selections, input ranges, safe filenames including Unicode, task numbering, storage reopen/corruption, concurrent writers, translation parity, form language changes without lost input, form validation, Markdown escaping, two-format export, retry/conflict behavior and native Brotli decoding.
- Standalone bundled PDF and Markdown generation passes. This guards against differences between source modules and the distributed CommonJS bundle.
- TypeScript strict compilation, ESLint, Prettier and whitespace checks pass.
- VSIX packaged successfully and installed into an isolated extensions directory.
- Integration checks using the installed package pass: activation, registered commands, opening a form and live English/Russian title switching.
- A four-page Cyrillic report was rendered and visually inspected: text, long code lines and links fit the pages.
- Production dependency audit reports zero known advisories at the time of the check. This is not a guarantee of absence of vulnerabilities.

## Not completed in this environment

- Full manual editor-to-report walkthrough and Marketplace screenshots. Native UI automation could observe the development host but could not reliably target its input among running VS Code instances. No simulated screenshots are presented as screenshots of the working extension.
- Windows and Linux execution. A CI matrix is configured but has not been run remotely because commits have not been pushed.
- Minimum supported VS Code 1.96 execution; local integration used 1.138. The manifest uses stable APIs and the bundle targets Node 20 syntax.
- Publisher ownership, Marketplace upload/acceptance and public asset link availability.

Before publishing, run the manual checklist below and the CI matrix. Do not describe these unchecked items as verified.

## Manual release checklist

1. Install the VSIX into a clean VS Code profile and open a trusted local sample project.
2. Create two reviews for the same task; confirm all four required fields.
3. Add a note to a single line and another to a range ending at column zero of the following line.
4. Enter text in a form, change the extension language and confirm the values remain intact.
5. Edit and delete a note; open a saved note after removing its original file.
6. Restart VS Code and verify drafts and comments remain available.
7. Complete a review in both formats, re-export it, then complete the next review and check numbering.
8. Verify empty reviews, filename conflicts, unavailable output folders and export retries.
9. Inspect long Cyrillic text, code and source links in PDF; test light/dark/high-contrast themes and keyboard navigation.
10. Capture screenshots of creation, note editing and the review tree using only demonstration data, add them to README, then push the reviewed assets before publication.
