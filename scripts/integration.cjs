const { runTests } = require('@vscode/test-electron');
const path = require('node:path');
const fs = require('node:fs/promises');
async function main() {
  const workspace = path.resolve('work/integration-workspace');
  await fs.mkdir(workspace, { recursive: true });
  await fs.writeFile(
    path.join(workspace, 'example.ts'),
    'export const amount = 42;\n',
  );
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
      '--user-data-dir=' + path.resolve('work/integration-profile'),
    ],
  });
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
