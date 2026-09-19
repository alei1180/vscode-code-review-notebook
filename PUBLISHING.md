# Publishing

Publisher ID: `alei1180` (provided by the owner). Extension ID: `alei1180.vscode-code-review-notes`.

Publication is manual and requires the owner's explicit authorization. No CI workflow publishes or pushes changes.

## Release preparation

1. Confirm access to the publisher account and availability of the extension name in Marketplace.
2. Use Node 24 and `pnpm install --frozen-lockfile`.
3. Run tests, lint, formatting, integration tests and the CI operating-system matrix.
4. Update the SemVer version and CHANGELOG. Commit the release change using Conventional Commits.
5. Run `pnpm run package:list` and review the file list for secrets, test data and missing fonts/resources.
6. Run `pnpm run package`. Install the resulting VSIX into a clean profile and verify creation, note editing, both languages and both export formats.
7. Check README links and screenshots against the repository's actual default branch. Assets must be pushed to the public repository before Marketplace can resolve those links.
8. Verify MIT and third-party license files are included. Review current Marketplace terms as the account owner.

## First publication

Sign into https://marketplace.visualstudio.com/manage/publishers/ with an account authorized for `alei1180`. Choose the VS Code extension upload flow and upload the reviewed VSIX. Check the listing before completing publication. Publisher ownership was not verified automatically during development.

Official instructions:

- https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- https://code.visualstudio.com/api/references/extension-manifest

For later releases, increase the version, repeat validation and upload the new VSIX. Do not delete and recreate the listing as an update mechanism.

## CLI authentication

Recheck Microsoft's current authentication guidance before enabling automation. Prefer the documented Microsoft Entra ID / workload identity approach for automated publishing. Global Azure DevOps PATs are scheduled for retirement on December 1, 2026; do not make them the sole long-term release mechanism.

Never commit tokens, paste them into issues or chat, or print them in logs. If future CI publication is approved, use appropriate protected identity configuration and an explicit release approval step.

## Before the first public release

Consult [the validation record and manual checklist](docs/VALIDATION.md). Marketplace screenshots and the full manual walkthrough are still pending.

The owner must confirm publisher access, approve publication, push the reviewed commits/assets, and inspect successful Windows/macOS/Linux CI results. Local checks do not establish that the Marketplace has accepted the extension.
