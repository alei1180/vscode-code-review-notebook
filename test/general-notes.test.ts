import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createReview,
  noteSchema,
  reserveReport,
  reviseNote,
} from '../src/model';
import { reportBlocks, exportReport } from '../src/report';
import { noteFields } from '../src/note-fields';
import { Store } from '../src/storage';
import { strings } from '../src/i18n';
const details = {
  taskTitle: 'Task',
  taskNumber: 'T1',
  reviewer: 'R',
  assignee: 'A',
};
const general = (file = '') =>
  noteSchema.parse({
    id: randomUUID(),
    general: true,
    file,
    start: 0,
    end: 0,
    code: '',
    comment: 'Общее замечание',
    severity: 'major',
    source: '',
  });
test('general notes persist, edit and export with or without a file and never acquire code ranges', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'general-notes-'));
  try {
    const review = createReview('project', details);
    for (const file of ['', 'docs/README.md']) {
      const note = general(file);
      assert.equal(
        noteFields(note).some((f) => f.name === 'range'),
        false,
      );
      const edited = reviseNote(note, {
        module: '',
        comment: 'Updated',
        source: '',
        severity: 'minor',
        range: '1-20',
      });
      assert.ok(edited.success);
      assert.equal(edited.data.start, 0);
      assert.equal(edited.data.file, file);
      assert.equal(
        noteSchema.safeParse({ ...note, start: 1, end: 2 }).success,
        false,
      );
      assert.equal(
        noteSchema.safeParse({ ...note, file: '../outside' }).success,
        false,
      );
      review.notes.push(edited.data);
    }
    const store = new Store(directory);
    await store.transaction((db) => {
      db.reviews.push(review);
    });
    const restored = (await store.read()).reviews[0]!;
    reserveReport(restored, [restored], 'ru');
    const blocks = reportBlocks(restored);
    assert.equal(
      blocks.some(
        (b) => b.kind === 'code' || b.text.startsWith('Номера строк:'),
      ),
      false,
    );
    assert.ok(blocks.some((b) => b.text === '1. Общее замечание'));
    assert.ok(blocks.some((b) => b.text === '2. docs/README.md'));
    await exportReport(
      restored,
      directory,
      'both',
      join(process.cwd(), 'media/fonts/NotoSans-Regular.ttf'),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test('report localizes severity descriptions and places ranges directly before code snapshots', () => {
  for (const language of ['ru', 'en'] as const) {
    const review = createReview('project', details);
    review.notes.push(
      noteSchema.parse({
        id: randomUUID(),
        file: 'src/test.ts',
        module: 'Payments',
        start: 2,
        end: 16,
        code: 'const n = 1;',
        comment: 'Check',
        source: '',
        severity: 'major',
      }),
    );
    reserveReport(review, [review], language);
    const t = strings(language),
      blocks = reportBlocks(review);
    assert.ok(
      blocks.some(
        (b) => b.header && b.text === `${t.major}: 1 — ${t.majorHelp}`,
      ),
    );
    assert.ok(
      blocks.some(
        (b) => b.kind === 'heading' && b.text === `${t.severity}: ${t.major}`,
      ),
    );
    assert.ok(blocks.some((b) => b.text === '1. Payments'));
    const index = blocks.findIndex((b) => b.text === t.code + ':');
    assert.equal(blocks[index - 2]?.text, `${t.range}: 2–16`);
    assert.equal(blocks[index + 1]?.kind, 'code');
    if (language === 'ru')
      assert.equal(
        blocks.some((b) => /Important|Critical|Trivial|Nitpick/.test(b.text)),
        false,
      );
  }
});
