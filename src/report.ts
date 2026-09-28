import PDFDocument from 'pdfkit';
import { readFile, mkdir, writeFile, link, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, dirname, extname, resolve } from 'node:path';
import { drawCode } from './pdf-code';
import { strings } from './i18n';
import { severities, safeName, type Review } from './model';
import { isCode } from './storage';
export type Block = {
  kind: 'title' | 'heading' | 'text' | 'code' | 'link';
  text: string;
  language?: string;
  header?: boolean;
  compact?: boolean;
  prefix?: string;
  label?: string;
};
export function reportDirectory(
  review: Review,
  home: string,
  configured?: string,
): string {
  return join(
    resolve(home, configured || 'Code Review Note'),
    safeName(review.details.taskNumber || review.details.taskTitle),
  );
}
export function reportDate(value: string): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function reportBlocks(review: Review): Block[] {
  if (review.state.status === 'draft') throw new Error('Unreserved report');
  const report = review.state.report,
    t = strings(report.language);
  const blocks: Block[] = [{ kind: 'title', text: t.report }];
  const metadata: [string, string][] = [
    [t.taskTitle, review.details.taskTitle],
    [t.taskNumber, review.details.taskNumber],
    [t.assignee, review.details.assignee],
    [t.reviewer, review.details.reviewer],
    [t.number, String(report.number)],
    [t.started, reportDate(review.started)],
    [t.finished, reportDate(report.date)],
    [t.total, String(review.notes.length)],
  ];
  for (const [label, value] of metadata) {
    if (value)
      blocks.push({
        kind: 'text',
        text: `${label}: ${value}`,
        label: label + ':',
        header: true,
      });
    if (label === t.taskTitle && review.details.taskUrl)
      blocks.push({
        kind: 'link',
        prefix: t.taskUrl + ': ',
        text: review.details.taskUrl,
        header: true,
      });
  }
  for (const severity of severities)
    blocks.push({
      kind: 'text',
      header: true,
      label: t[severity] + ':',
      text: `${t[severity]}: ${review.notes.filter((n) => n.severity === severity).length} (${t[`${severity}Help`].replace(/\.$/, '')})`,
    });
  if (!review.notes.length) blocks.push({ kind: 'text', text: t.noNotes });
  const ordered = [
    ...severities.flatMap((severity) =>
      review.notes.filter((n) => n.severity === severity),
    ),
  ];
  let index = 0;
  for (const note of ordered) {
    blocks.push(
      {
        kind: 'heading',
        text: `${++index}. ${note.module || note.file || t.general}`,
      },
      { kind: 'text', text: note.comment },
    );
    if (!note.general)
      blocks.push({
        kind: 'text',
        compact: true,
        label: t.range + ':',
        text: `${t.range}: ${note.start}${note.end !== note.start ? `–${note.end}` : ''}`,
      });
    blocks.push({
      kind: 'text',
      compact: true,
      label: t.severity + ':',
      text: `${t.severity}: ${t[note.severity]} (${t[`${note.severity}Help`].replace(/\.$/, '')})`,
    });
    if (note.source)
      blocks.push({
        kind: 'link',
        compact: true,
        prefix: t.source + ': ',
        text: note.source,
      });
    if (!note.general)
      blocks.push(
        {
          kind: 'text',
          compact: true,
          text: t.code + ':',
          label: t.code + ':',
        },
        {
          kind: 'code',
          text: note.code,
          language: note.language ?? extname(note.file).slice(1).toLowerCase(),
        },
      );
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
          return `${block.prefix ? '**' + escape(block.prefix.trimEnd()) + '** ' : ''}[${escape(block.text)}](<${new URL(block.text).href.replace(/</g, '%3C').replace(/>/g, '%3E')}>)`;
        if (block.label)
          return `**${escape(block.label)}**${escape(block.text.slice(block.label.length))}`;
        return (
          (block.kind === 'title'
            ? '# '
            : block.kind === 'heading'
              ? '## '
              : '') + escape(block.text)
        );
      })
      .map(
        (text, index) =>
          text +
          (index === blocks.length - 1
            ? ''
            : blocks[index]?.compact && blocks[index + 1]?.kind !== 'code'
              ? '  \n'
              : '\n\n'),
      )
      .join('') + '\n'
  );
}
export async function pdf(
  blocks: Block[],
  font: string,
  date: string,
): Promise<Buffer> {
  font = join(dirname(font), 'cmunss.otf');
  const boldFont = join(dirname(font), 'cmunsx.otf');
  const palette = {
    paper: '#FEFEFE',
    ink: '#232527',
    green: '#5C946E',
    orange: '#F06543',
    blue: '#5299D3',
    grey: '#808080',
  };
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 48, bottom: 48, left: 56, right: 56 },
    bufferPages: true,
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
  const paintPage = () => {
    doc
      .save()
      .rect(0, 0, doc.page.width, doc.page.height)
      .fill(palette.paper)
      .restore();
  };
  paintPage();
  doc.on('pageAdded', paintPage);
  for (const block of blocks) {
    if (block.kind === 'title') {
      const x = doc.page.margins.left,
        y = doc.y;
      const width = doc.page.width - x - doc.page.margins.right;
      doc.font(boldFont).fontSize(22);
      const height = doc.heightOfString(block.text, { width: width - 20 }) + 16;
      doc.save().rect(x, y, width, height).fill(palette.green).restore();
      doc
        .fillColor(palette.paper)
        .text(block.text, x + 10, y + 8, { width: width - 20 });
      doc.x = x;
      doc.y = y + height + 16;
      continue;
    }
    if (block.kind === 'code') {
      await drawCode(
        doc,
        block.text,
        block.language ?? '',
        join(dirname(font), 'FreeMono.ttf'),
      );
      doc.font(font);
      continue;
    }
    if (block.kind === 'heading') {
      if (doc.y + 80 > doc.page.height - doc.page.margins.bottom) doc.addPage();
      doc.moveDown(0.5);
    }
    const bold = block.kind === 'heading';
    doc
      .font(bold ? boldFont : font)
      .fontSize(block.kind === 'heading' ? 14 : 11)
      .fillColor(bold ? palette.orange : palette.ink);
    const label = block.prefix ?? block.label;
    const value = block.label
      ? block.text.slice(block.label.length)
      : block.text;
    if (label) {
      const width =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const height = doc.font(boldFont).heightOfString(label + value, {
        width,
        lineGap: block.header || block.compact ? 0 : 3,
      });
      const pageHeight =
        doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
      if (
        height < pageHeight &&
        doc.y + height > doc.page.height - doc.page.margins.bottom
      )
        doc.addPage();
      doc.font(boldFont).text(label, {
        continued: value.length > 0,
        lineGap: block.header || block.compact ? 0 : 3,
      });
      doc.font(font);
    }
    if (value)
      doc
        .fillColor(
          block.kind === 'link'
            ? palette.blue
            : bold
              ? palette.orange
              : palette.ink,
        )
        .text(value, {
          lineGap: block.header || block.compact ? 0 : 3,
          ...(block.kind === 'link'
            ? { link: block.text, underline: true }
            : {}),
        });
    if (!block.compact) doc.moveDown(block.header ? 0.15 : 0.6);
  }
  const pages = doc.bufferedPageRange();
  for (let page = pages.start; page < pages.start + pages.count; page++) {
    doc.switchToPage(page);
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .font(font)
      .fontSize(9)
      .fillColor(palette.grey)
      .text(
        `${page + 1} / ${pages.count}`,
        doc.page.width - doc.page.margins.right - 60,
        doc.page.height - 30,
        { width: 60, align: 'right', lineBreak: false },
      );
    doc.page.margins.bottom = bottomMargin;
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
