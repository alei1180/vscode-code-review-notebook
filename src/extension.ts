import * as vscode from 'vscode';
import { randomUUID } from 'node:crypto';
import { join, relative, isAbsolute, resolve } from 'node:path';
import { z } from 'zod';
import {
  createReview,
  detailsSchema,
  reviewSchema,
  noteSchema,
  reviseNote,
  lineRange,
  reserveReport,
  ReviewNumberConflictError,
  validUrl,
  type Review,
  type Language,
  type Note,
} from './model';
import { Store, isCode } from './storage';
import { strings, type Key } from './i18n';
import { form, FieldError, type Field } from './forms';
import { noteFields } from './note-fields';
import { ReviewTree, type Item } from './tree';
import { exportReport, ConflictError } from './report';

class UserError extends Error {
  constructor(readonly key: Key) {
    super(key);
  }
}
const language = (): Language =>
  vscode.workspace.getConfiguration('codeReviewNotes').get('language') === 'ru'
    ? 'ru'
    : 'en';
const t = (key: Key): string => strings(language())[key];
const formatSchema = z.enum(['markdown', 'pdf', 'both']);
const itemSchema = z.object({
  review: reviewSchema,
  note: noteSchema.optional(),
});
export function activate(context: vscode.ExtensionContext): void {
  const controller = new Controller(context);
  context.subscriptions.push(controller);
  void controller.refresh().catch((error) => controller.error(error));
}
class Controller implements vscode.Disposable {
  private readonly store: Store;
  private readonly tree = new ReviewTree(language);
  private readonly output =
    vscode.window.createOutputChannel('Code Review Notes');
  private readonly disposables: vscode.Disposable[] = [];
  private busy = false;
  constructor(private readonly context: vscode.ExtensionContext) {
    this.store = new Store(context.globalStorageUri.fsPath);
    const view = vscode.window.createTreeView('codeReviewNotes.reviews', {
      treeDataProvider: this.tree,
    });
    this.disposables.push(
      view,
      this.tree,
      this.output,
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('codeReviewNotes')) this.tree.refresh();
      }),
      vscode.window.onDidChangeWindowState((e) => {
        if (e.focused) void this.refresh().catch((error) => this.error(error));
      }),
    );
    const command = (name: string, action: (item?: Item) => Promise<void>) =>
      this.disposables.push(
        vscode.commands.registerCommand(
          'codeReviewNotes.' + name,
          (argument: unknown) => {
            // Editor context menus pass a URI; only our tree passes a review item.
            const parsed = itemSchema.safeParse(argument);
            const item: Item | undefined = parsed.success
              ? {
                  review: parsed.data.review,
                  ...(parsed.data.note ? { note: parsed.data.note } : {}),
                }
              : undefined;
            return action(item).catch((error) => this.error(error));
          },
        ),
      );
    command('start', () => this.start());
    command('add', () => this.add());
    command('select', async (item) => {
      if (item)
        await this.change((db) => {
          db.active = item.review.id;
        });
    });
    command('editReview', async (item) => {
      const r = await this.pick(item, false);
      if (r) this.reviewForm(r.project, r);
    });
    command('copy', async (item) => {
      const r = await this.pick(item, false);
      if (r) this.reviewForm(r.project, undefined, r);
    });
    command('complete', (item) => this.complete(item));
    command('export', (item) => this.complete(item));
    command('openNote', async (item) => {
      if (item?.note) await this.openNote(item.review, item.note);
    });
    command('viewNote', async (item) => {
      if (item?.note) this.noteViewer(item.review, item.note);
    });
    command('editNote', async (item) => {
      if (item?.note) await this.editNote(item.review, item.note);
    });
    command('deleteNote', async (item) => {
      if (!item?.note) return;
      if (
        (await vscode.window.showWarningMessage(
          t('deletePrompt'),
          { modal: true },
          t('remove'),
        )) !== t('remove')
      )
        return;
      const id = item.note.id;
      await this.change((db) => {
        const r = this.current(db.reviews, item.review.id);
        this.mutable(r);
        r.notes = r.notes.filter((n) => n.id !== id);
      });
    });
  }
  dispose(): void {
    for (const d of this.disposables) d.dispose();
  }
  error(error: unknown): void {
    const key =
      error instanceof UserError
        ? error.key
        : error instanceof ReviewNumberConflictError
          ? 'numberConflict'
          : error instanceof ConflictError
            ? 'conflict'
            : isCode(error, 'EEXIST') || isCode(error, 'ELOCKED')
              ? 'busy'
              : 'error';
    // Avoid logging user content, file paths, or schema input values.
    this.output.appendLine(
      `${new Date().toISOString()} ${error instanceof Error ? error.name : 'UnknownError'} (${key})`,
    );
    void vscode.window.showErrorMessage(t(key));
  }
  async refresh(): Promise<void> {
    const db = await this.store.read();
    const projects = new Set(
      vscode.workspace.workspaceFolders?.map((f) => f.uri.toString()) ?? [],
    );
    this.tree.reviews = db.reviews.filter((r) => projects.has(r.project));
    this.tree.active = db.active;
    this.tree.refresh();
  }
  private supported(): void {
    if (
      !vscode.workspace.isTrusted ||
      vscode.env.remoteName ||
      vscode.env.uiKind !== vscode.UIKind.Desktop
    )
      throw new UserError('unsupported');
  }
  private async change(
    change: Parameters<Store['transaction']>[0],
  ): Promise<void> {
    this.supported();
    await this.store.transaction(change);
    await this.refresh();
  }
  private current(reviews: Review[], id: string): Review {
    const r = reviews.find((r) => r.id === id);
    if (!r) throw new UserError('deleted');
    return r;
  }
  private mutable(review: Review): void {
    if (review.state.status !== 'draft') throw new UserError('frozen');
  }
  private async pick(
    item: Item | undefined,
    unfinished: boolean,
  ): Promise<Review | undefined> {
    this.supported();
    await this.refresh();
    if (item) return this.tree.reviews.find((r) => r.id === item.review.id);
    const reviews = this.tree.reviews
      .filter((r) => !unfinished || r.state.status !== 'completed')
      .sort(
        (a, b) =>
          Number(b.id === this.tree.active) - Number(a.id === this.tree.active),
      );
    if (!reviews.length) {
      await this.start();
      return;
    }
    const selected = await vscode.window.showQuickPick(
      reviews.map((r) => ({
        label: `${r.details.taskNumber} · ${r.details.taskTitle}`,
        description: `${r.details.reviewer} · ${r.started}`,
        review: r,
      })),
      { title: t('choose') },
    );
    return selected?.review;
  }
  private async start(): Promise<void> {
    this.supported();
    const folders =
      vscode.workspace.workspaceFolders?.filter(
        (f) => f.uri.scheme === 'file',
      ) ?? [];
    if (!folders.length) throw new UserError('unavailable');
    const folder =
      folders.length === 1
        ? folders[0]
        : (
            await vscode.window.showQuickPick(
              folders.map((f) => ({ label: f.name, folder: f })),
              { title: t('project') },
            )
          )?.folder;
    if (folder) this.reviewForm(folder.uri.toString());
  }
  private reviewForm(project: string, existing?: Review, copy?: Review): void {
    if (existing) this.mutable(existing);
    const fields: Field[] = (
      ['taskTitle', 'taskNumber', 'assignee', 'reviewer'] as const
    ).map((name) => ({
      name,
      label: name,
      value: (existing ?? copy)?.details[name] ?? '',
    }));
    fields.push({
      name: 'reviewNumber',
      label: 'number',
      value: String(existing?.details.reviewNumber ?? 1),
      numeric: true,
    });
    const snapshot = existing ? JSON.stringify(existing) : undefined;
    form(
      this.context,
      existing ? 'edit' : 'start',
      fields,
      language,
      async (values) => {
        for (const field of fields)
          if (!values[field.name]?.trim())
            throw new FieldError(field.name, 'required');
        if (!/^[1-9]\d*$/.test(values.reviewNumber ?? ''))
          throw new FieldError('reviewNumber', 'invalid');
        const parsed = detailsSchema.safeParse({
          ...values,
          reviewNumber: Number(values.reviewNumber),
        });
        if (!parsed.success)
          throw new FieldError(
            String(parsed.error.issues[0]?.path[0] ?? 'taskTitle'),
            'invalid',
          );
        await this.change((db) => {
          if (
            db.reviews.some(
              (r) =>
                r.id !== existing?.id &&
                r.project === project &&
                r.details.taskNumber === parsed.data.taskNumber &&
                (r.state.status === 'draft'
                  ? r.details.reviewNumber
                  : r.state.report.number) === parsed.data.reviewNumber,
            )
          )
            throw new FieldError('reviewNumber', 'numberConflict');
          if (existing) {
            const r = this.current(db.reviews, existing.id);
            this.mutable(r);
            if (JSON.stringify(r) !== snapshot) throw new UserError('stale');
            r.details = parsed.data;
          } else {
            const r = createReview(project, parsed.data);
            db.reviews.push(r);
            db.active = r.id;
          }
        });
      },
      (error) => this.error(error),
    );
  }
  private async add(): Promise<void> {
    this.supported();
    const editor = vscode.window.activeTextEditor;
    if (
      !editor ||
      editor.document.isUntitled ||
      editor.document.isDirty ||
      editor.document.uri.scheme !== 'file'
    )
      throw new UserError('unavailable');
    const uri = editor.document.uri,
      content = editor.document.getText(),
      selection = editor.selection;
    const range = lineRange(
      selection.start.line,
      selection.end.line,
      selection.end.character,
    );
    const review = await this.pick(undefined, true);
    if (!review) return;
    this.mutable(review);
    const root = vscode.Uri.parse(review.project);
    const path = relative(root.fsPath, uri.fsPath);
    if (path.startsWith('..') || isAbsolute(path))
      throw new UserError('unavailable');
    this.noteForm(
      review,
      {
        id: randomUUID(),
        file: path.split('\\').join('/'),
        language: editor.document.languageId,
        start: range[0],
        end: range[1],
        comment: '',
        source: '',
        severity: 'minor',
        code: '',
      },
      content,
      false,
      uri,
    );
  }
  private noteForm(
    review: Review,
    note: Note,
    content: string | undefined,
    editing: boolean,
    uri: vscode.Uri,
  ): void {
    this.mutable(review);
    const fields = noteFields(note);
    const snapshot = JSON.stringify(review);
    form(
      this.context,
      editing ? 'edit' : 'add',
      fields,
      language,
      async (values) => {
        if (!values.comment?.trim())
          throw new FieldError('comment', 'required');
        if (!validUrl(values.source ?? ''))
          throw new FieldError('source', 'urlError');
        if (!values.module?.trim()) throw new FieldError('module', 'required');
        const lines = content?.split(/\r?\n/);
        const captured = {
          ...note,
          code:
            !editing && lines
              ? lines.slice(note.start - 1, note.end).join('\n')
              : note.code,
        };
        const parsed = reviseNote(captured, values);
        if (!parsed.success)
          throw new FieldError(
            ['module', 'comment', 'source', 'severity'].includes(
              String(parsed.error.issues[0]?.path[0]),
            )
              ? String(parsed.error.issues[0]?.path[0])
              : 'comment',
            'invalid',
          );
        await this.change((db) => {
          const r = this.current(db.reviews, review.id);
          this.mutable(r);
          if (JSON.stringify(r) !== snapshot) throw new UserError('stale');
          if (editing) {
            const index = r.notes.findIndex((n) => n.id === note.id);
            if (index < 0) throw new UserError('deleted');
            r.notes[index] = parsed.data;
          } else r.notes.push(parsed.data);
        });
        try {
          await vscode.window.showTextDocument(uri);
        } catch {
          void vscode.window.showInformationMessage(t('missing'));
        }
      },
      (error) => this.error(error),
    );
  }
  private async editNote(review: Review, note: Note): Promise<void> {
    const uri = vscode.Uri.joinPath(
      vscode.Uri.parse(review.project),
      note.file,
    );
    this.noteForm(review, note, undefined, true, uri);
  }

  private noteViewer(review: Review, note: Note): void {
    const fields = noteFields(note);
    fields.push({
      name: 'code',
      label: 'code',
      value: note.code,
      multiline: true,
    });
    form(
      this.context,
      'comment',
      fields,
      language,
      async () => {},
      (error) => this.error(error),
      true,
    );
    void review;
  }
  private async openNote(review: Review, note: Note): Promise<void> {
    try {
      const doc = await vscode.workspace.openTextDocument(
        vscode.Uri.joinPath(vscode.Uri.parse(review.project), note.file),
      );
      if (note.start > doc.lineCount) throw new UserError('missing');
      await vscode.window.showTextDocument(doc, {
        selection: new vscode.Range(
          note.start - 1,
          0,
          Math.min(note.end, doc.lineCount) - 1,
          0,
        ),
      });
    } catch {
      void vscode.window.showInformationMessage(t('missing'));
      this.noteViewer(review, note);
    }
  }
  private async complete(item?: Item): Promise<void> {
    if (this.busy) throw new UserError('busy');
    const review = await this.pick(item, false);
    if (!review) return;
    const root = vscode.Uri.parse(review.project),
      config = vscode.workspace.getConfiguration('codeReviewNotes', root);
    const defaultFormat = formatSchema
      .catch('markdown')
      .parse(config.get('reportFormat'));
    const options = [...(['markdown', 'pdf', 'both'] as const)].sort(
      (a, b) => Number(b === defaultFormat) - Number(a === defaultFormat),
    );
    const chosen = await vscode.window.showQuickPick(
      options.map((value) => ({ label: t(value), value })),
      { title: t('format') },
    );
    if (!chosen) return;
    this.busy = true;
    try {
      await this.change((db) => {
        reserveReport(
          this.current(db.reviews, review.id),
          db.reviews,
          language(),
        );
      });
      const directory = resolve(
        root.fsPath,
        config.get<string>('reportDirectory') || 'code-review-notes',
      );
      const files = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: t('export') },
        () =>
          this.store.transaction(async (db) => {
            const r = this.current(db.reviews, review.id);
            if (r.state.status === 'draft')
              throw new Error('Missing reservation');
            const result = await exportReport(
              r,
              directory,
              chosen.value,
              join(
                this.context.extensionPath,
                'media',
                'fonts',
                'FreeMonoBold.ttf',
              ),
            );
            r.state = { status: 'completed', report: r.state.report };
            return result;
          }),
      );
      await this.refresh();
      const first = files[0];
      if (first?.endsWith('.md'))
        await vscode.window.showTextDocument(vscode.Uri.file(first));
      else if (
        first &&
        (await vscode.window.showInformationMessage(
          t('exported'),
          t('open'),
        )) === t('open')
      )
        await vscode.env.openExternal(vscode.Uri.file(first));
    } finally {
      this.busy = false;
    }
  }
}
