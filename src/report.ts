import PDFDocument from 'pdfkit';
import { readFile, mkdir, writeFile, link, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, dirname, extname } from 'node:path';
import { drawCode } from './pdf-code';
import { strings } from './i18n';
import { severities, type Review } from './model';
import { isCode } from './storage';
export type Block = {
  kind: 'title' | 'heading' | 'text' | 'code' | 'link';
  text: string;
  language?: string;
  header?: boolean;
};
export function reportBlocks(review: Review): Block[] {
  if (review.state.status === 'draft') throw new Error('Unreserved report');
  const report = review.state.report,
    t = strings(report.language);
  const blocks: Block[] = [{ kind: 'title', text: t.report }];
  const metadata: [string, string][] = [
    [t.taskNumber, review.details.taskNumber],
    [t.taskTitle, review.details.taskTitle],
    [t.assignee, review.details.assignee],
    [t.reviewer, review.details.reviewer],
    [t.number, String(report.number)],
    [t.started, review.started],
    [t.finished, report.date],
    [t.total, String(review.notes.length)],
  ];
  for (const [label, value] of metadata)
    blocks.push({ kind: 'text', text: `${label}: ${value}`, header: true });
  for (const severity of severities)
    blocks.push({
      kind: 'text',
      header: true,
      text: `${t[severity]}: ${review.notes.filter((n) => n.severity === severity).length} — ${t[`${severity}Help`]}`,
    });
  if (!review.notes.length) blocks.push({ kind: 'text', text: t.noNotes });
  let index = 0;
  for (const severity of severities) {
    const notes = review.notes.filter((n) => n.severity === severity);
    if (notes.length) blocks.push({ kind: 'heading', text: t[severity] });
    for (const note of notes) {
      blocks.push(
        {
          kind: 'heading',
          text: `${++index}. ${note.module || note.file || t.general}`,
        },
        { kind: 'text', text: note.comment },
      );
      if (!note.general)
        blocks.push(
          {
            kind: 'text',
            text: `${t.range}: ${note.start}${note.end !== note.start ? `–${note.end}` : ''}`,
          },
          { kind: 'text', text: t.code },
          {
            kind: 'code',
            text: note.code,
            language:
              note.language ?? extname(note.file).slice(1).toLowerCase(),
          },
        );
      if (note.source)
        blocks.push(
          { kind: 'text', text: t.source },
          { kind: 'link', text: note.source },
        );
    }
  }
  return blocks;
}
export function markdown(blocks: Block[]): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/[\\`*_{}\[\]()#+.!|~-]/g, '\\$&');
  return (
    blocks
      .map((block) => {
        if (block.kind === 'code') {
          const runs = block.text.match(/`+/g) ?? [];
          const fence = '`'.repeat(
            Math.max(3, ...runs.map((s) => s.length + 1)),
          );
          return `${fence}\n${block.text}\n${fence}`;
        }
        if (block.kind === 'link')
          return `[${escape(block.text)}](<${new URL(block.text).href.replace(/</g, '%3C').replace(/>/g, '%3E')}>)`;
        return (
          (block.kind === 'title'
            ? '# '
            : block.kind === 'heading'
              ? '## '
              : '') + escape(block.text)
        );
      })
      .join('\n\n') + '\n'
  );
}
export async function pdf(
  blocks: Block[],
  font: string,
  date: string,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 48,
    font,
    info: {
      Title: blocks[0]?.text ?? 'Code Review',
      CreationDate: new Date(date),
      ModDate: new Date(date),
    },
  });
  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
  for (const block of blocks) {
    if (block.kind === 'code') {
      await drawCode(doc, block.text, block.language ?? '', font);
      doc.font(font);
      continue;
    }
    if (block.kind === 'title' || block.kind === 'heading') {
      if (doc.y > 730) doc.addPage();
      doc.moveDown(0.5);
    }
    const bold = block.kind === 'title' || block.kind === 'heading';
    doc
      .font(bold ? join(dirname(font), 'FreeMonoBold.ttf') : font)
      .fontSize(
        block.kind === 'title' ? 22 : block.kind === 'heading' ? 13 : 10,
      )
      .fillColor(block.kind === 'link' ? '#165db5' : '#202632')
      .text(block.text, {
        lineGap: block.header ? 0 : 3,
        ...(block.kind === 'link' ? { link: block.text, underline: true } : {}),
      });
    doc.moveDown(block.header ? 0.15 : 0.6);
  }
  doc.end();
  return result;
}
export class ConflictError extends Error {}
export async function writeReport(
  file: string,
  content: Buffer,
): Promise<void> {
  try {
    const existing = await readFile(file);
    if (existing.equals(content)) return;
    throw new ConflictError('Report conflict');
  } catch (error) {
    if (!isCode(error, 'ENOENT')) throw error;
  }
  const temp = file + '.' + randomUUID() + '.tmp';
  await writeFile(temp, content, { flag: 'wx', mode: 0o600 });
  try {
    await link(temp, file);
  } finally {
    await unlink(temp);
  }
}
export async function exportReport(
  review: Review,
  directory: string,
  format: 'markdown' | 'pdf' | 'both',
  font: string,
): Promise<string[]> {
  if (review.state.status === 'draft') throw new Error('Unreserved report');
  await mkdir(directory, { recursive: true });
  const blocks = reportBlocks(review),
    files: string[] = [];
  if (format !== 'pdf') {
    const file = join(directory, review.state.report.baseName + '.md');
    await writeReport(file, Buffer.from(markdown(blocks)));
    files.push(file);
  }
  if (format !== 'markdown') {
    const file = join(directory, review.state.report.baseName + '.pdf');
    await writeReport(file, await pdf(blocks, font, review.state.report.date));
    files.push(file);
  }
  return files;
}
