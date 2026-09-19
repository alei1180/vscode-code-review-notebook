export type CodeSpan = { text: string; color: string };
export const plainColor = '#24292f';
const colors: Record<string, string> = {
  keyword: '#7c3bb2',
  literal: '#7c3bb2',
  built_in: '#805000',
  string: '#176b38',
  regexp: '#176b38',
  comment: '#626b76',
  number: '#a0440b',
  title: '#155ba5',
  function: '#155ba5',
  attr: '#155ba5',
  attribute: '#155ba5',
  type: '#805000',
  meta: '#8b3d72',
  variable: '#953800',
  symbol: '#953800',
};
type SyntaxNode = {
  type: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: SyntaxNode[];
};
function loadHighlighter() {
  return import('lowlight').then(({ all, createLowlight }) =>
    createLowlight(all),
  );
}
let highlighter: ReturnType<typeof loadHighlighter> | undefined;
export async function highlightCode(
  code: string,
  language: string,
): Promise<CodeSpan[]> {
  const plain = [{ text: code, color: plainColor }];
  if (!code || code.length > 100000 || language === 'plaintext') return plain;
  const engine = await (highlighter ??= loadHighlighter());
  const aliases: Record<string, string> = {
    bsl: '1c',
    onescript: '1c',
    os: '1c',
    javascriptreact: 'javascript',
    typescriptreact: 'typescript',
    tsx: 'typescript',
    jsx: 'javascript',
  };
  const grammar = aliases[language] ?? language;
  if (!engine.registered(grammar)) return plain;
  const spans: CodeSpan[] = [];
  const walk = (node: SyntaxNode, color: string): void => {
    if (node.type === 'text' && node.value !== undefined) {
      spans.push({ text: node.value, color });
      return;
    }
    const classes = node.properties?.className;
    const tokenColor = Array.isArray(classes)
      ? classes
          .map((value) => colors[String(value).replace(/^hljs-/, '')])
          .find(Boolean)
      : undefined;
    for (const child of node.children ?? []) walk(child, tokenColor ?? color);
  };
  walk(engine.highlight(grammar, code), plainColor);
  return spans;
}
