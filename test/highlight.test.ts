import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createReview, reserveReport, noteSchema } from '../src/model';
import { highlightCode, plainColor } from '../src/highlight';
import { reportBlocks } from '../src/report';
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
test('report uses edited module and original source language for legacy notes', () => {
  const review = createReview('project', {
    taskTitle: 'Task',
    taskNumber: 'T1',
    assignee: 'A',
    reviewer: 'R',
  });
  review.notes.push({ ...original(), module: 'Оплата' });
  reserveReport(review, [review], 'ru');
  const blocks = reportBlocks(review);
  assert.ok(blocks.some((b) => b.text.includes('Модуль: Оплата:2–16')));
  assert.equal(blocks.find((b) => b.kind === 'code')?.language, 'ts');
});
test('syntax tokens preserve code and distinguish keywords, strings and numbers', async () => {
  const code = 'const text = "Привет";\n\tconst count = 42; // comment';
  const spans = await highlightCode(code, 'typescript');
  assert.equal(spans.map((s) => s.text).join(''), code);
  assert.ok(spans.some((s) => s.text === 'const' && s.color !== plainColor));
  assert.ok(new Set(spans.map((s) => s.color)).size >= 4);
  const bsl = 'Процедура Проверка()\n    Сообщить("Привет");\nКонецПроцедуры';
  const oneC = await highlightCode(bsl, 'bsl');
  assert.equal(oneC.map((s) => s.text).join(''), bsl);
  assert.ok(oneC.some((s) => s.color !== plainColor));
  const unknown = await highlightCode(code, 'unrecognized-language');
  assert.deepEqual(unknown, [{ text: code, color: plainColor }]);
});
