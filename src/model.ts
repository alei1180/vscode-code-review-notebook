import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export const languageSchema = z.enum(['en', 'ru']);
export type Language = z.infer<typeof languageSchema>;
export const severities = ['blocker', 'major', 'minor', 'nitpick'] as const;
const text = z.string().trim().min(1).max(1000);
export const detailsSchema = z.object({
  taskTitle: text,
  taskNumber: text,
  assignee: text,
  reviewer: text,
});
export type Details = z.infer<typeof detailsSchema>;
export const noteSchema = z
  .object({
    id: z.string().uuid(),
    file: text.refine(
      (p) =>
        !p.startsWith('/') && !p.includes('\\') && !p.split('/').includes('..'),
    ),
    start: z.number().int().positive(),
    end: z.number().int().positive(),
    comment: z.string().trim().min(1).max(100000),
    source: z.string().max(4000).refine(validUrl),
    severity: z.enum(severities),
    code: z.string().max(1000000),
  })
  .refine((n) => n.end >= n.start);
export type Note = z.infer<typeof noteSchema>;
const exportSchema = z.object({
  number: z.number().int().positive(),
  date: z.string().datetime(),
  language: languageSchema,
  baseName: text,
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
export function parseRange(value: string, lineCount: number): [number, number] {
  const match = /^(\d+)(?:\s*[-–]\s*(\d+))?$/.exec(value.trim());
  const start = Number(match?.[1]),
    end = Number(match?.[2] ?? match?.[1]);
  if (
    !Number.isSafeInteger(start) ||
    start < 1 ||
    end < start ||
    end > lineCount
  )
    throw new Error('range');
  return [start, end];
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
  return Array.from(result).slice(0, 60).join('') || 'task';
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
        r.details.taskNumber === review.details.taskNumber,
    )
    .map((r) => (r.state.status === 'draft' ? 0 : r.state.report.number));
  const number = Math.max(0, ...numbers) + 1;
  review.state = {
    status: 'exporting',
    report: {
      number,
      date: new Date().toISOString(),
      language,
      baseName: `${safeName(review.details.taskNumber)}_${safeName(review.details.taskTitle)}_review-${String(number).padStart(2, '0')}`,
    },
  };
}
