import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { strings, type Key } from './i18n';
import type { Language } from './model';
export type Field = {
  name: string;
  label: Key;
  value: string;
  multiline?: boolean;
  readonly?: boolean;
  options?: { value: string; label: Key }[];
};
export class FieldError extends Error {
  constructor(
    readonly field: string,
    readonly key: Key,
  ) {
    super(key);
  }
}
export function form(
  context: vscode.ExtensionContext,
  title: Key,
  fields: Field[],
  language: () => Language,
  save: (values: Record<string, string>) => Promise<void>,
  onError: (error: unknown) => void,
  readonly = false,
): void {
  const panel = vscode.window.createWebviewPanel(
    'reviewNotes.form',
    strings(language())[title],
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')],
      retainContextWhenHidden: true,
    },
  );
  const nonce = randomBytes(16).toString('hex');
  const script = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'media', 'form.js'),
  );
  const style = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'media', 'form.css'),
  );
  panel.webview.html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource}; script-src 'nonce-${nonce}';"><link rel="stylesheet" href="${style}"></head><body><main><h1 id="title"></h1><form id="form" novalidate><div id="fields"></div><p id="error" role="alert"></p><div class="actions"><button id="save" type="submit"></button><button id="cancel" type="button"></button></div></form></main><script nonce="${nonce}" src="${script}"></script></body></html>`;
  const update = () => {
    panel.title = strings(language())[title];
    void panel.webview.postMessage({
      type: 'labels',
      labels: strings(language()),
      title,
      language: language(),
    });
  };
  const configuration = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('codeReviewNotes.language')) update();
  });
  let saving = false;
  const listener = panel.webview.onDidReceiveMessage(async (raw: unknown) => {
    const message = z
      .discriminatedUnion('type', [
        z.object({ type: z.literal('ready') }),
        z.object({ type: z.literal('cancel') }),
        z.object({
          type: z.literal('save'),
          values: z.record(z.string(), z.string().max(1000000)),
        }),
      ])
      .safeParse(raw);
    if (!message.success) return;
    if (message.data.type === 'ready') {
      await panel.webview.postMessage({ type: 'init', fields, readonly });
      update();
      return;
    }
    if (message.data.type === 'cancel') {
      if (!saving) panel.dispose();
      return;
    }
    if (saving || readonly) return;
    saving = true;
    try {
      await save(message.data.values);
      panel.dispose();
    } catch (error) {
      if (error instanceof FieldError)
        await panel.webview.postMessage({
          type: 'error',
          field: error.field,
          key: error.key,
        });
      else {
        onError(error);
        await panel.webview.postMessage({ type: 'error', key: 'error' });
      }
    } finally {
      saving = false;
    }
  });
  panel.onDidDispose(() => {
    configuration.dispose();
    listener.dispose();
  });
  context.subscriptions.push(panel);
}
