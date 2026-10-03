import decompress from '../src/brotli';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createReview, reserveReport } from '../src/model';
import {
  pdf,
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

test('partial export can be retried without replacing an unrelated file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'report-retry-'));
  try {
    const r = review();
    assert.notEqual(r.state.status, 'draft');
    if (r.state.status === 'draft') throw new Error('Expected reservation');
    const destination = join(dir, r.state.report.baseName + '.pdf');
    await writeReport(destination, Buffer.from('unrelated'));
    const font = join(process.cwd(), 'media/fonts/NotoSans-Regular.ttf');
    await assert.rejects(exportReport(r, dir, 'both', font), ConflictError);
    assert.ok(
      (await readFile(join(dir, r.state.report.baseName + '.md'))).length > 0,
    );
    assert.equal((await readFile(destination)).toString(), 'unrelated');
    const other = join(dir, 'resolved');
    await exportReport(r, other, 'both', font);
    assert.equal(r.state.report.number, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('native Brotli adapter returns font bytes losslessly', async () => {
  const { brotliCompressSync } = await import('node:zlib');
  const original = Buffer.from('Font bytes and кириллица');
  assert.deepEqual(decompress(brotliCompressSync(original)), original);
});

test('task links are optional and dates and report folders follow user settings', async () => {
  const { reportDate, reportDirectory } = await import('../src/report.js');
  const { detailsSchema, taskKey } = await import('../src/model.js');
  const profile = resolve(tmpdir(), 'crn-test-profile');
  const absoluteReports = resolve(tmpdir(), 'crn-test-reports');
  const localDate = new Date(2026, 8, 20, 18, 36, 59);
  assert.equal(reportDate(localDate.toISOString()), '2026/09/20 18:36');
  const r = review();
  assert.equal(
    reportDirectory(r, profile),
    join(profile, 'Code Review Note', 'PAY-12'),
  );
  assert.equal(
    reportDirectory(r, profile, 'reports'),
    join(profile, 'reports', 'PAY-12'),
  );
  assert.equal(
    reportDirectory(r, profile, absoluteReports),
    join(absoluteReports, 'PAY-12'),
  );
  assert.equal(
    reportBlocks(r).some((b) => b.text === 'Ссылка на задачу:'),
    false,
  );
  r.details.taskUrl = 'https://example.org/task/12';
  assert.ok(
    reportBlocks(r).some(
      (b) => b.kind === 'link' && b.text === r.details.taskUrl,
    ),
  );
  assert.equal(
    detailsSchema.safeParse({ ...r.details, taskUrl: 'javascript:alert(1)' })
      .success,
    false,
  );
  r.details.taskNumber = '';
  r.details.taskTitle = 'Без номера';
  assert.equal(
    reportDirectory(r, profile),
    join(profile, 'Code Review Note', 'Без-номера'),
  );
  assert.notEqual(
    taskKey(r.details),
    taskKey({ ...r.details, taskTitle: 'Другая задача' }),
  );
  assert.ok(detailsSchema.safeParse(r.details).success);
  r.details.taskTitle = '../../outside';
  assert.equal(
    reportDirectory(r, profile),
    join(profile, 'Code Review Note', 'outside'),
  );
});

test('PDF footer does not create an extra page', async () => {
  const data = await pdf(
    [
      { kind: 'title', text: 'Отчёт о код-ревью' },
      { kind: 'text', text: 'Кириллица и Latin' },
    ],
    join(process.cwd(), 'media/fonts/NotoSans-Regular.ttf'),
    '2026-09-25T10:00:00.000Z',
  );
  assert.equal(
    [...data.toString('latin1').matchAll(/\/Type \/Page\b/g)].length,
    1,
  );
});
