import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { noteSchema, reviseNote } from '../src/model';
import { noteFields } from '../src/note-fields';
import { strings } from '../src/i18n';
const original = () =>
  noteSchema.parse({
    id: randomUUID(),
    file: 'src/test.ts',
    start: 2,
    end: 16,
    code: 'const count = 42; // количество',
    comment: 'Check',
    severity: 'minor',
    source: '',
  });
test('old notes remain readable and module edits never move source or lines', () => {
  const note = original();
  const fields = noteFields(note);
  assert.equal(fields.find((f) => f.name === 'module')?.value, note.file);
  assert.notEqual(fields.find((f) => f.name === 'module')?.readonly, true);
  assert.equal(fields.find((f) => f.name === 'range')?.readonly, true);
  const changed = reviseNote(note, {
    module: 'Общий модуль: Оплата',
    comment: 'Updated',
    severity: 'major',
    source: '',
    range: '100-200',
    file: 'other.ts',
    code: 'changed',
  });
  assert.ok(changed.success);
  assert.equal(changed.data.module, 'Общий модуль: Оплата');
  assert.equal(changed.data.file, note.file);
  assert.equal(changed.data.start, 2);
  assert.equal(changed.data.end, 16);
  assert.equal(changed.data.code, note.code);
  assert.equal(strings('ru').file, 'Модуль');
  assert.equal(strings('en').file, 'Module');
});
test('context commands are nested under Code Review Notebook', async () => {
  const manifest = JSON.parse(await readFile('package.json', 'utf8'));
  for (const menu of [
    'codeReviewNotes.editorMenu',
    'codeReviewNotes.itemMenu',
  ]) {
    const items = manifest.contributes.menus[menu];
    const last = items.at(-1);
    assert.equal(last.command, 'codeReviewNotes.openReportDirectory');
    assert.ok(
      items
        .slice(0, -1)
        .every((item: { group: string }) => item.group < last.group),
    );
  }
  for (const context of ['editor/context', 'view/item/context']) {
    for (const item of manifest.contributes.menus[context]) {
      assert.equal(item.command, undefined);
      assert.ok(item.submenu.startsWith('codeReviewNotes.'));
      assert.equal(
        manifest.contributes.submenus.find(
          (s: { id: string; label: string }) => s.id === item.submenu,
        )?.label,
        'Code Review Notebook',
      );
    }
  }
});
