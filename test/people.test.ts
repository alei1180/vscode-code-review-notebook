import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createReview } from '../src/model';
import { peopleSuggestions, rememberPeople } from '../src/people';
import { Store } from '../src/storage';

test('name history seeds old reviews, separates roles and survives edits and restart', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'review-people-'));
  const details = {
    taskTitle: 'Task',
    taskNumber: '',
    assignee: 'Иван',
    reviewer: 'Анна',
  };
  try {
    const store = new Store(directory);
    await store.transaction((db) => {
      db.reviews.push(createReview('project-a', details));
      db.reviews.push(createReview('project-b', details));
    });
    assert.deepEqual(peopleSuggestions(await store.read()), {
      assignee: ['Иван'],
      reviewer: ['Анна'],
    });
    const edited = { ...details, assignee: 'Пётр' };
    await store.transaction((db) => {
      rememberPeople(db, edited);
      const review = db.reviews[0];
      assert.ok(review);
      review.details = edited;
      db.reviews.splice(1);
    });
    const reopened = new Store(directory);
    assert.deepEqual(peopleSuggestions(await reopened.read()), {
      assignee: ['Пётр', 'Иван'],
      reviewer: ['Анна'],
    });
    await assert.rejects(
      reopened.transaction((db) => {
        rememberPeople(db, { ...details, reviewer: 'Unsaved' });
        throw new Error('Save failed');
      }),
    );
    assert.deepEqual(peopleSuggestions(await reopened.read()).reviewer, [
      'Анна',
    ]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
