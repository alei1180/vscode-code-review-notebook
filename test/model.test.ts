import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createReview,
  lineRange,
  reserveReport,
  safeName,
  validUrl,
} from '../src/model';
import { Store } from '../src/storage';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const details = {
  taskTitle: 'Оплата',
  taskNumber: 'T-1',
  assignee: 'Иван',
  reviewer: 'Алексей',
};
test('selection excludes next line at column zero', () => {
  assert.deepEqual(lineRange(1, 16, 0), [2, 16]);
  assert.deepEqual(lineRange(1, 1, 0), [2, 2]);
});
test('names and URLs remain safe', () => {
  assert.equal(safeName('../CON/'), '_CON');
  assert.equal(validUrl('javascript:alert(1)'), false);
  assert.equal(validUrl('https://example.org'), true);
});
test('report numbers are task scoped and retries stable', () => {
  const a = createReview('project', details);
  reserveReport(a, [a], 'ru');
  const b = createReview('project', { ...details, taskTitle: 'Changed' });
  reserveReport(b, [a, b], 'en');
  assert.equal(b.state.status !== 'draft' && b.state.report.number, 2);
  const state = structuredClone(b.state);
  reserveReport(b, [a, b], 'ru');
  assert.deepEqual(b.state, state);
});
test('storage survives reopen and does not overwrite corrupt data', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'review-test-'));
  try {
    const store = new Store(dir);
    await store.transaction((db) => {
      db.reviews.push(createReview('project', details));
    });
    assert.equal((await new Store(dir).read()).reviews.length, 1);
    await writeFile(join(dir, 'reviews.json'), 'broken');
    await assert.rejects(store.transaction(() => {}));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('concurrent writers cannot overwrite an active transaction', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'review-lock-'));
  try {
    const store = new Store(dir);
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started: (() => void) | undefined;
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    const first = store.transaction(async (db) => {
      started?.();
      await gate;
      db.reviews.push(createReview('project', details));
    });
    await ready;
    await assert.rejects(new Store(dir).transaction(() => {}));
    release?.();
    await first;
    assert.equal((await store.read()).reviews.length, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('Unicode filenames fit common filesystem component limits', () => {
  const r = createReview('project', {
    ...details,
    taskNumber: '任'.repeat(200),
    taskTitle: '🙂'.repeat(200),
  });
  reserveReport(r, [r], 'en');
  assert.notEqual(r.state.status, 'draft');
  if (r.state.status !== 'draft')
    assert.ok(
      Buffer.byteLength(r.state.report.baseName + '.pdf', 'utf8') < 255,
    );
});

test('explicit review numbers survive storage and determine report filenames', async () => {
  const { databaseSchema, detailsSchema, ReviewNumberConflictError } =
    await import('../src/model.js');
  for (const reviewNumber of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])
    assert.equal(
      detailsSchema.safeParse({ ...details, reviewNumber }).success,
      false,
    );
  const a = createReview('project', { ...details, reviewNumber: 7 });
  const db = databaseSchema.parse(
    JSON.parse(JSON.stringify({ version: 1, reviews: [a], active: a.id })),
  );
  const restored = db.reviews[0]!;
  reserveReport(restored, db.reviews, 'ru');
  assert.ok(restored.state.status !== 'draft');
  assert.equal(restored.state.report.number, 7);
  assert.ok(restored.state.report.baseName.endsWith('_review-07'));
  const duplicate = createReview('project', { ...details, reviewNumber: 7 });
  assert.throws(
    () => reserveReport(duplicate, [restored, duplicate], 'en'),
    ReviewNumberConflictError,
  );
  assert.equal(duplicate.state.status, 'draft');
  const other = createReview('other-project', { ...details, reviewNumber: 7 });
  reserveReport(other, [restored, other], 'en');
  assert.equal(other.state.status !== 'draft' && other.state.report.number, 7);
});
