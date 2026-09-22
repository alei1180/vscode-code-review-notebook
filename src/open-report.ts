import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import * as vscode from 'vscode';

export async function openReport(file: string): Promise<boolean> {
  await access(file);
  if (process.platform !== 'win32')
    return vscode.env.openExternal(vscode.Uri.file(file));

  // Pass a native path as a single argument, without cmd.exe or URL escaping.
  // Explorer uses the same file association as a double click in its UI.
  return new Promise<boolean>((resolve, reject) => {
    const child = spawn('explorer.exe', [file], {
      shell: false,
      detached: true,
      stdio: 'ignore',
    });
    child.once('error', reject);
    child.once('spawn', () => {
      child.unref();
      resolve(true);
    });
  });
}
