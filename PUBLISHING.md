# Publishing

Publisher ID: `alei1180`. Display name: **Alexander Osadchy** (saved and verified in the publisher management UI). Extension ID: `alei1180.vscode-code-review-notebook`.

Publication is manual and requires the owner's explicit authorization. No CI workflow publishes or pushes changes.

## Release preparation

1. Confirm access to the publisher account and availability of the extension name in Marketplace.
2. Use Node 24 and `pnpm install --frozen-lockfile`.
3. Run tests, lint, formatting, integration tests and the CI operating-system matrix.
4. Update the SemVer version and CHANGELOG. Commit the release change using Conventional Commits.
5. Run `pnpm run package:list` and review the file list for secrets, test data and missing fonts/resources.
6. Run `pnpm run package`. Install the resulting VSIX into a clean profile and verify creation, note editing, both languages and both export formats. Include saved-name suggestions after restart, all context-menu shortcuts, report-folder settings and Open Reports Folder.
7. Check README links and screenshots against the repository's actual default branch. Assets must be pushed to the public repository before Marketplace can resolve those links.
8. Verify MIT and third-party license files are included. Review current Marketplace terms as the account owner.

## GitHub and package contents

The source repository can be public before Marketplace publication. A public repository is not required for VSIX upload, but users must be able to access the source, support and image links advertised in the listing. Review tracked files and history before changing visibility: author names/emails and Actions logs can become public.

After reviewing local commits, run `git push origin main` and inspect Actions results. A matching release tag is optional. Do not commit VSIX files or node_modules; a VSIX can be attached to a GitHub Release. Packaging does not push changes.

The manifest's `private: true` prevents accidental npm publication; it does not block Marketplace publication. The PNG is the Marketplace icon; the SVG is used by the Activity Bar. Runtime code, fonts and license texts must be included in the VSIX. Build tooling requires Node 24; the extension itself runs inside VS Code's extension host.

## First publication

Sign into https://marketplace.visualstudio.com/manage/publishers/ with an account authorized for `alei1180`. Choose **New extension → Visual Studio Code**, upload the reviewed VSIX and complete the publishing flow. Manual browser upload does not require a CLI PAT. Check the listing before completing publication. Publisher access has been checked; final name availability and Marketplace acceptance still need verification at upload.

Official instructions:

- https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- https://code.visualstudio.com/api/references/extension-manifest

After acceptance, inspect the listing and install from Marketplace in a clean profile. Check the publisher name, icon, README links and review/export workflow.

For later releases, increase the version, repeat validation and upload the new VSIX. Do not delete and recreate the listing as an update mechanism.

## CLI authentication

Recheck Microsoft's current authentication guidance before enabling automation. Prefer the documented Microsoft Entra ID / workload identity approach for automated publishing. Global Azure DevOps PATs are scheduled for retirement on December 1, 2026; do not make them the sole long-term release mechanism.

Never commit tokens, paste them into issues or chat, or print them in logs. If future CI publication is approved, use appropriate protected identity configuration and an explicit release approval step.

## Before the first public release

Consult [the validation record and manual checklist](docs/VALIDATION.md). Version 0.1.25 passed local automated checks and development-host integration on macOS. A final walkthrough of the installed VSIX, platform CI results, physical keyboard checks and minimum-version verification are still pending. Real screenshots are recommended but are not required for VSIX upload.

The owner must approve publication, push the reviewed commits/assets, and inspect successful Windows/macOS/Linux CI results. Local checks do not establish that the Marketplace has accepted the extension.
