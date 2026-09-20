const assert = require('node:assert/strict');
const esbuild = require('esbuild');
const fs = require('node:fs/promises');
const path = require('node:path');
async function main() {
  await esbuild.build({
    ...require('./bundle-options.cjs'),
    entryPoints: ['src/report.ts'],
    outfile: 'work/bundle-test/report.cjs',
  });
  await fs.cp('dist/data', 'work/bundle-test/data', { recursive: true });
  const { createReview, reserveReport } = require('../out/src/model.js');
  const { exportReport } = require('../work/bundle-test/report.cjs');
  const review = createReview('test', {
    taskTitle: 'Проверка сборки',
    taskNumber: 'BUNDLE-1',
    assignee: 'Tester',
    reviewer: 'Reviewer',
  });
  review.notes.push({
    id: require('node:crypto').randomUUID(),
    file: 'example.ts',
    language: 'typescript',
    module: 'Payments',
    start: 1,
    end: 2,
    comment: 'Check amount',
    source: '',
    severity: 'major',
    code: 'const amount: number = 42;\n// Проверка суммы',
  });
  reserveReport(review, [review], 'ru');
  const directory = await fs.mkdtemp(path.resolve('work/bundle-test/export-'));
  try {
    const files = await exportReport(
      review,
      directory,
      'both',
      path.resolve('media/fonts/FreeMono.ttf'),
    );
    assert.equal(files.length, 2);
    assert.equal(
      (await fs.readFile(files[1])).subarray(0, 4).toString(),
      '%PDF',
    );
    console.log('Bundled PDF and Markdown export passed.');
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
