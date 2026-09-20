const { createReview, reserveReport } = require('../out/src/model');
const { exportReport } = require('../out/src/report');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const review = createReview('qa', {
  taskTitle: 'Проверка оплаты заказа',
  taskNumber: 'SHOP-142',
  assignee: 'Иван Петров',
  reviewer: 'Алексей Иванов',
});
for (const severity of ['blocker', 'major', 'minor', 'nitpick'])
  review.notes.push({
    id: randomUUID(),
    file: 'src/payment.ts',
    start: 2,
    end: 16,
    severity,
    comment: 'Проверить обработку ошибок и корректность суммы заказа. '.repeat(
      12,
    ),
    source: 'https://example.org/standards/' + 'long-section-'.repeat(20),
    code:
      'const total = calculateTotal(order);\n' +
      '// Очень длинная строка '.repeat(40),
  });
reserveReport(review, [review], 'ru');
exportReport(
  review,
  path.resolve('work/qa'),
  'both',
  path.resolve('media/fonts/FreeMonoBold.ttf'),
)
  .then((files) => console.log(files))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
