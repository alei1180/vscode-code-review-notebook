const { runTests } = require('@vscode/test-electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const os = require('node:os');
async function main() {
  const workspace = path.resolve('work/integration-workspace');
  await fs.mkdir(workspace, { recursive: true });
  await fs.writeFile(
    path.join(workspace, 'example.ts'),
    'export const amount = 42;\n',
  );
  // macOS Unix socket paths must fit within 103 bytes, including VS Code's suffix.
  const temporaryRoot = process.platform === 'darwin' ? '/tmp' : os.tmpdir();
  const profile = await fs.mkdtemp(path.join(temporaryRoot, 'crn-it-'));
  try {
    await runTests({
      extensionDevelopmentPath: path.resolve(
        process.env.PACKAGED_EXTENSION || '.',
      ),
      version: process.env.VSCODE_VERSION || 'stable',
      extensionTestsPath: path.resolve('out/test/integration.js'),
      ...(process.env.VSCODE_EXECUTABLE
        ? { vscodeExecutablePath: process.env.VSCODE_EXECUTABLE }
        : {}),
      launchArgs: [
        workspace,
        '--disable-extensions',
        '--disable-workspace-trust',
        '--user-data-dir=' + profile,
      ],
    });
  } finally {
    await fs.rm(profile, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
