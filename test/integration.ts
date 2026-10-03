import * as vscode from 'vscode';
import assert from 'node:assert/strict';
export async function run(): Promise<void> {
  const extension = vscode.extensions.getExtension(
    'alei1180.vscode-code-review-notebook',
  );
  assert.ok(extension, 'Extension must be discovered');
  await extension.activate();
  const commands = await vscode.commands.getCommands(true);
  for (const name of [
    'start',
    'add',
    'addGeneral',
    'complete',
    'export',
    'viewNote',
  ])
    assert.ok(commands.includes('codeReviewNotes.' + name));
  const configuration = vscode.workspace.getConfiguration('codeReviewNotes');
  assert.equal(configuration.get('language'), 'en');
  await vscode.commands.executeCommand('codeReviewNotes.start');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  assert.ok(
    vscode.window.tabGroups.all
      .flatMap((g) => g.tabs)
      .some((tab) => tab.label === 'Start Code Review'),
  );
  await configuration.update(
    'language',
    'ru',
    vscode.ConfigurationTarget.Global,
  );
  // Configuration events and the webview host update on the following event loop turns.
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.ok(
    vscode.window.tabGroups.all
      .flatMap((g) => g.tabs)
      .some((tab) => tab.label === 'Начать ревью'),
  );
  await configuration.update(
    'language',
    'en',
    vscode.ConfigurationTarget.Global,
  );
  console.log(
    'Extension activation, commands, forms and live language change passed.',
  );
}
