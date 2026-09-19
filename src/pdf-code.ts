import { highlightCode, type CodeSpan } from './highlight';

/** Draw explicit lines so token boundaries never change indentation or wrapping. */
export async function drawCode(
  doc: PDFKit.PDFDocument,
  code: string,
  language: string,
  font: string,
): Promise<void> {
  const spans = await highlightCode(code, language);
  doc.font(font).fontSize(9);
  const x = doc.page.margins.left,
    padding = 8,
    lineHeight = 14;
  const width = doc.page.width - x - doc.page.margins.right;
  const widths = new Map<string, number>();
  let row: CodeSpan[] = [],
    used = 0,
    column = 0;
  const flush = () => {
    if (doc.y + lineHeight > doc.page.height - doc.page.margins.bottom)
      doc.addPage();
    const y = doc.y;
    doc
      .save()
      .fillColor('#f3f5f7')
      .rect(x, y, width, lineHeight)
      .fill()
      .restore();
    let cursor = x + padding;
    for (const span of row) {
      doc
        .fillColor(span.color)
        .text(span.text, cursor, y + 1, { lineBreak: false, features: [] });
      cursor += doc.widthOfString(span.text, { features: [] });
    }
    doc.x = x;
    doc.y = y + lineHeight;
    row = [];
    used = 0;
  };
  const append = (char: string, color: string) => {
    const advance =
      widths.get(char) ?? doc.widthOfString(char, { features: [] });
    widths.set(char, advance);
    if (used + advance > width - 2 * padding && row.length) flush();
    const last = row.at(-1);
    if (last?.color === color) last.text += char;
    else row.push({ text: char, color });
    used += advance;
  };
  for (const span of spans)
    for (const char of span.text) {
      if (char === '\r') continue;
      if (char === '\n') {
        flush();
        column = 0;
        continue;
      }
      if (char === '\t') {
        const count = 4 - (column % 4);
        for (let i = 0; i < count; i++) append(' ', span.color);
        column += count;
      } else {
        append(char, span.color);
        column++;
      }
    }
  if (row.length || !code) flush();
  doc.y += 8;
}
