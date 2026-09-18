import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createReview, reserveReport } from '../src/model';
import {
  markdown,
  reportBlocks,
  exportReport,
  writeReport,
  ConflictError,
} from '../src/report';
import { en, ru } from '../src/i18n';
const review = () => {
  const r = createReview('project', {
    taskTitle: 'Проверка оплаты',
    taskNumber: 'PAY-12',
    assignee: 'Иван',
    reviewer: 'Алексей',
  });
  r.notes.push({
    id: randomUUID(),
    file: 'src/pay.ts',
    start: 2,
    end: 16,
    comment: 'Проверить обработку ошибок <script>alert(1)</script>',
    source: 'https://example.org/standard',
    severity: 'major',
    code: '```\nconst сумма = 42;\n````',
  });
  reserveReport(r, [r], 'ru');
  return r;
};
test('translations have the same keys', () =>
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ru).sort()));
test('markdown escapes HTML and safely fences code', () => {
  const md = markdown(reportBlocks(review()));
  assert.ok(md.includes('&lt;script&gt;'));
  assert.ok(md.includes('`````\n```'));
  assert.ok(md.includes('Проверка оплаты'));
  assert.ok(!md.includes('<script>'));
});
test('both formats export offline and retries are idempotent', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'report-test-'));
  try {
    const r = review(),
      font = join(process.cwd(), 'media/fonts/NotoSans-Regular.ttf');
    const files = await exportReport(r, dir, 'both', font);
    assert.equal(files.length, 2);
    const pdf = await readFile(files[1]!);
    assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
    await exportReport(r, dir, 'both', font);
    await assert.rejects(
      writeReport(files[0]!, Buffer.from('different')),
      ConflictError,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
