const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL, fileURLToPath } = require('node:url');
const { createRequire, wrap } = require('node:module');
const { runInThisContext } = require('node:vm');
const { createReview } = require('../out/src/model.js');

// Exercise the actual bundled command callbacks, storage and report exporter.
// Only the VS Code UI boundary is replaced so Quick Picks can be answered.
async function main() {
  const directory = await fs.mkdtemp(path.resolve('work/command-test-'));
  const extensionPath = path.resolve(process.env.PACKAGED_EXTENSION || '.');
  const bundle = path.join(extensionPath, 'dist/extension.cjs');
  const handlers = new Map();
  const errors = [];
  const subscriptions = [];
  const disposable = () => ({ dispose() {} });
  const uri = (value) => ({
    scheme: 'file',
    fsPath: fileURLToPath(value),
    toString: () => value,
  });
  const root = uri(pathToFileURL(directory).href);
  let picks = 0;
  let cancel = false;
  let attachFile = false;
  let receive;
  let messages = [];
  const vscode = {
    EventEmitter: class {
      event = disposable;
      fire() {}
      dispose() {}
    },
    commands: {
      registerCommand(name, callback) {
        handlers.set(name, callback);
        return disposable();
      },
    },
    workspace: {
      isTrusted: true,
      workspaceFolders: [{ uri: root }],
      onDidChangeConfiguration: disposable,
      getConfiguration: () => ({
        get: (key) => ({ language: 'ru', reportFormat: 'both' })[key],
      }),
    },
    UIKind: { Desktop: 1 },
    env: { uiKind: 1 },
    Uri: {
      parse: uri,
      file: (file) => uri(pathToFileURL(file).href),
      joinPath: (root, ...parts) =>
        uri(pathToFileURL(path.join(root.fsPath, ...parts)).href),
    },
    ViewColumn: { Active: 1 },
    ProgressLocation: { Notification: 15 },
    window: {
      createTreeView: disposable,
      createWebviewPanel: () => ({
        ...disposable(),
        onDidDispose: disposable,
        webview: {
          cspSource: 'test',
          asWebviewUri: (value) => value,
          postMessage: async (message) => {
            messages.push(message);
          },
          onDidReceiveMessage: (callback) => {
            receive = callback;
            return disposable();
          },
        },
      }),
      showOpenDialog: async () => [
        uri(pathToFileURL(path.join(directory, 'example.md')).href),
      ],
      onDidChangeWindowState: disposable,
      createOutputChannel: () => ({ ...disposable(), appendLine() {} }),
      showErrorMessage: (message) => errors.push(message),
      showQuickPick: async (options) => {
        picks++;
        return cancel
          ? undefined
          : attachFile && options.some((o) => o.attached)
            ? options.find((o) => o.attached)
            : options[0];
      },
      withProgress: async (_options, work) => work(),
      showTextDocument: async (file) =>
        assert.ok((await fs.stat(file.fsPath)).size > 0),
    },
  };
  try {
    const module = { exports: {} };
    const localRequire = createRequire(bundle);
    runInThisContext(wrap(await fs.readFile(bundle, 'utf8')), {
      filename: bundle,
    })(
      module.exports,
      (name) =>
        name === 'vscode'
          ? vscode
          : name === 'node:os'
            ? { ...localRequire(name), homedir: () => directory }
            : localRequire(name),
      module,
      bundle,
      path.dirname(bundle),
    );
    module.exports.activate({
      extensionPath,
      extensionUri: uri(pathToFileURL(extensionPath).href),
      globalStorageUri: root,
      subscriptions,
    });
    const databaseFile = path.join(directory, 'reviews.json');
    for (const command of ['complete', 'export']) {
      for (const context of ['editor', 'palette', 'tree', 'cancel']) {
        const review = createReview(root.toString(), {
          taskNumber: `${command}-${context}`,
          taskTitle: 'Regression',
          assignee: 'Tester',
          reviewer: 'Reviewer',
        });
        review.notes.push({
          id: require('node:crypto').randomUUID(),
          file: 'example.bsl',
          language: 'bsl',
          start: 1,
          end: 1,
          comment: 'Проверить',
          source: '',
          severity: 'minor',
          code: 'Сообщить("Тест");',
        });
        await fs.writeFile(
          databaseFile,
          JSON.stringify({ version: 1, reviews: [review], active: review.id }),
        );
        picks = 0;
        cancel = context === 'cancel';
        const argument =
          context === 'tree'
            ? { review }
            : context === 'palette'
              ? undefined
              : vscode.Uri.file(path.join(directory, 'example.bsl'));
        await handlers.get('codeReviewNotes.' + command)(argument);
        assert.deepEqual(
          errors,
          [],
          `${command} from ${context} must not fail`,
        );
        const stored = JSON.parse(await fs.readFile(databaseFile, 'utf8'))
          .reviews[0];
        assert.equal(stored.state.status, cancel ? 'draft' : 'completed');
        assert.equal(picks, context === 'tree' || cancel ? 1 : 2);
        if (!cancel) {
          for (const extension of ['md', 'pdf']) {
            const file = path.join(
              directory,
              'Code Review Note',
              review.details.taskNumber,
              stored.state.report.baseName + '.' + extension,
            );
            const data = await fs.readFile(file);
            assert.ok(data.length > 0);
            if (extension === 'pdf')
              assert.equal(data.subarray(0, 4).toString(), '%PDF');
          }
        }
      }
    }
    cancel = false;
    await fs.writeFile(path.join(directory, 'example.md'), '# Example');
    for (const attached of [false, true]) {
      attachFile = attached;
      messages = [];
      const review = createReview(root.toString(), {
        taskTitle: 'General',
        taskNumber: 'G1',
        assignee: 'A',
        reviewer: 'R',
      });
      await fs.writeFile(
        databaseFile,
        JSON.stringify({ version: 1, reviews: [review], active: review.id }),
      );
      await handlers.get('codeReviewNotes.addGeneral')();
      assert.deepEqual(errors, []);
      await receive({ type: 'ready' });
      const fields = messages.find((m) => m.type === 'init').fields;
      assert.equal(
        fields.some((f) => f.name === 'range'),
        false,
      );
      await receive({
        type: 'save',
        values: {
          module: '',
          comment: 'General observation',
          source: '',
          severity: 'minor',
        },
      });
      assert.equal(
        messages.some((m) => m.type === 'error'),
        false,
      );
      const stored = JSON.parse(await fs.readFile(databaseFile, 'utf8'))
        .reviews[0].notes[0];
      assert.equal(stored.general, true);
      assert.equal(stored.severity, 'minor');
      assert.equal(stored.file, attached ? 'example.md' : '');
      assert.equal(stored.start, 0);
      assert.equal(stored.code, '');
    }
    console.log(
      'Bundled general note creation with and without a file passed.',
    );
    messages = [];
    await handlers.get('codeReviewNotes.start')();
    await receive({ type: 'ready' });
    assert.ok(
      messages
        .find((m) => m.type === 'init')
        .fields.some((f) => f.name === 'taskUrl'),
    );
    await receive({
      type: 'save',
      values: {
        taskTitle: 'Unnamed task',
        taskNumber: '',
        taskUrl: 'https://example.org/task',
        assignee: 'A',
        reviewer: 'R',
        reviewNumber: '1',
      },
    });
    assert.equal(
      messages.some((m) => m.type === 'error'),
      false,
    );
    const newReview = JSON.parse(
      await fs.readFile(databaseFile, 'utf8'),
    ).reviews.at(-1);
    assert.equal(newReview.details.taskNumber, '');
    assert.equal(newReview.details.taskUrl, 'https://example.org/task');
    console.log(
      'Bundled completion/export: editor URI, palette, tree and cancellation passed.',
    );
  } finally {
    for (const item of subscriptions) item.dispose();
    await fs.rm(directory, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
