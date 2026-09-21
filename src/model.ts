import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export const languageSchema = z.enum(['en', 'ru']);
export type Language = z.infer<typeof languageSchema>;
export const severities = ['blocker', 'major', 'minor', 'nitpick'] as const;
const text = z.string().trim().min(1).max(1000);
export const detailsSchema = z.object({
  taskTitle: text,
  taskNumber: z.string().trim().max(1000).default(''),
  taskUrl: z.string().trim().max(4000).refine(validUrl).optional(),
  assignee: text,
  reviewer: text,
  reviewNumber: z
    .number()
    .int()
    .positive()
    .max(Number.MAX_SAFE_INTEGER)
    .optional(),
});
export type Details = z.infer<typeof detailsSchema>;
const codeNoteSchema = z
  .object({
    id: z.string().uuid(),
    general: z.literal(false).optional(),
    file: text.refine(
      (p) =>
        !p.startsWith('/') && !p.includes('\\') && !p.split('/').includes('..'),
    ),
    module: text.optional(),
    language: z.string().max(100).optional(),
    start: z.number().int().positive(),
    end: z.number().int().positive(),
    comment: z.string().trim().min(1).max(100000),
    source: z.string().max(4000).refine(validUrl),
    severity: z.enum(severities),
    code: z.string().max(1000000),
  })
  .refine((n) => n.end >= n.start);
const generalNoteSchema = z.object({
  ...codeNoteSchema.shape,
  severity: z.enum(severities).optional(),
  general: z.literal(true),
  file: z.union([codeNoteSchema.shape.file, z.literal('')]),
  module: z.string().trim().max(1000).optional(),
  start: z.literal(0),
  end: z.literal(0),
  code: z.literal(''),
});
export const noteSchema = z.union([codeNoteSchema, generalNoteSchema]);
export type Note = z.infer<typeof noteSchema>;
const exportSchema = z.object({
  number: z.number().int().positive(),
  date: z.string().datetime(),
  language: languageSchema,
  baseName: text.refine(
    (value) => !/[<>:"/\\|?*]/.test(value) && value !== '.' && value !== '..',
  ),
});
export const reviewSchema = z.object({
  id: z.string().uuid(),
  project: text,
  details: detailsSchema,
  started: z.string().datetime(),
  notes: z.array(noteSchema),
  state: z.discriminatedUnion('status', [
    z.object({ status: z.literal('draft') }),
    z.object({ status: z.literal('exporting'), report: exportSchema }),
    z.object({ status: z.literal('completed'), report: exportSchema }),
  ]),
});
export type Review = z.infer<typeof reviewSchema>;
export const databaseSchema = z.object({
  version: z.literal(1),
  reviews: z.array(reviewSchema),
  active: z.string().uuid().nullable(),
});
export type Database = z.infer<typeof databaseSchema>;
export function validUrl(value: string): boolean {
  if (!value) return true;
  try {
    return ['https:', 'http:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
export function createReview(project: string, details: Details): Review {
  return {
    id: randomUUID(),
    project,
    details: detailsSchema.parse(details),
    started: new Date().toISOString(),
    notes: [],
    state: { status: 'draft' },
  };
}
export function lineRange(
  start: number,
  end: number,
  endCharacter: number,
): [number, number] {
  return [
    start + 1,
    Math.max(start + 1, end + (endCharacter === 0 && end > start ? 0 : 1)),
  ];
}
export function safeName(value: string): string {
  let result = value
    .normalize('NFC')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/^[. ]+|[. ]+$/g, '');
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(result))
    result = '_' + result;
  const points = Array.from(result).slice(0, 60);
  while (Buffer.byteLength(points.join(''), 'utf8') > 90) points.pop();
  return points.join('').replace(/[. ]+$/g, '') || 'task';
}
export class ReviewNumberConflictError extends Error {}

export function taskKey(details: Details): string {
  return details.taskNumber
    ? `number:${details.taskNumber}`
    : `title:${details.taskTitle}`;
}
export function reserveReport(
  review: Review,
  all: Review[],
  language: Language,
): void {
  if (review.state.status !== 'draft') return;
  const numbers = all
    .filter(
      (r) =>
        r.project === review.project &&
        taskKey(r.details) === taskKey(review.details),
    )
    .map((r) => (r.state.status === 'draft' ? 0 : r.state.report.number));
  const number = review.details.reviewNumber ?? Math.max(0, ...numbers) + 1;
  if (
    all.some(
      (other) =>
        other.id !== review.id &&
        other.project === review.project &&
        taskKey(other.details) === taskKey(review.details) &&
        (other.state.status === 'draft'
          ? other.details.reviewNumber
          : other.state.report.number) === number,
    )
  )
    throw new ReviewNumberConflictError();
  review.state = {
    status: 'exporting',
    report: {
      number,
      date: new Date().toISOString(),
      language,
      baseName: `${review.details.taskNumber ? safeName(review.details.taskNumber) + '_' : ''}${safeName(review.details.taskTitle)}_review-${String(number).padStart(2, '0')}`,
    },
  };
}

export function reviseNote(note: Note, values: Record<string, string>) {
  return noteSchema.safeParse({
    ...note,
    module: values.module,
    comment: values.comment,
    source: values.source ?? '',
    severity: note.general ? undefined : values.severity,
  });
}
