function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  let cursor = index - 1;
  while (cursor >= 0 && text[cursor] === '\\') {
    slashCount++;
    cursor--;
  }
  return slashCount % 2 === 1;
}

function findMatchingBracket(text: string, start: number): number {
  let depth = 1;
  let cursor = start + 1;
  while (cursor < text.length) {
    const char = text[cursor];
    if (char === '\\') { cursor += 2; continue; }
    if (char === '[') depth++;
    else if (char === ']') { depth--; if (depth === 0) return cursor; }
    cursor++;
  }
  return -1;
}

function findMatchingParen(text: string, start: number): number {
  let depth = 1;
  let cursor = start + 1;
  let inAngle = false;
  let inQuote: '"' | "'" | null = null;
  while (cursor < text.length) {
    const char = text[cursor];
    if (char === '\\') { cursor += 2; continue; }

    if (inAngle) { if (char === '>') inAngle = false; cursor++; continue; }
    if (inQuote) { if (char === inQuote) inQuote = null; cursor++; continue; }

    if (char === '<') { inAngle = true; cursor++; continue; }
    if (char === '"' || char === "'") { inQuote = char; cursor++; continue; }

    if (char === '(') depth++;
    else if (char === ')') { depth--; if (depth === 0) return cursor; }

    cursor++;
  }
  return -1;
}

function appendTrailingSpace(dest: string) {
  return /\s$/u.test(dest) ? dest : `${dest} `;
}

export function transformMarkdownLinks(markdown: string): string {
  if (!markdown) return markdown;

  let result = '';
  let index = 0;

  while (index < markdown.length) {
    const char = markdown[index];

    if (char === '[' && !isEscaped(markdown, index)) {
      const labelEnd = findMatchingBracket(markdown, index);
      if (labelEnd !== -1 && markdown[labelEnd + 1] === '(') {
        const parenEnd = findMatchingParen(markdown, labelEnd + 1);
        if (parenEnd !== -1) {
          const dest = markdown.slice(labelEnd + 2, parenEnd);
          result += markdown.slice(index, labelEnd + 2) + appendTrailingSpace(dest) + ')';
          index = parenEnd + 1;
          continue;
        }
      }
    }

    result += char;
    index++;
  }

  return result;
}