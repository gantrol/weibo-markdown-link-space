export const MAX_NESTED_LABEL_DEPTH = 48;

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  let cursor = index - 1;
  while (cursor >= 0 && text[cursor] === '\\') {
    slashCount += 1;
    cursor -= 1;
  }
  return slashCount % 2 === 1;
}

function findMatchingBracket(text: string, start: number): number {
  let depth = 1;
  let cursor = start + 1;

  while (cursor < text.length) {
    const char = text[cursor];

    if (char === '\\') {
      cursor += 2;
      continue;
    }

    if (char === '[') {
      depth += 1;
    } else if (char === ']') {
      depth -= 1;
      if (depth === 0) return cursor;
    }

    cursor += 1;
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

    if (char === '\\') {
      cursor += 2;
      continue;
    }

    if (inAngle) {
      if (char === '>') inAngle = false;
      cursor += 1;
      continue;
    }

    if (inQuote) {
      if (char === inQuote) inQuote = null;
      cursor += 1;
      continue;
    }

    if (char === '<') {
      inAngle = true;
      cursor += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      inQuote = char;
      cursor += 1;
      continue;
    }

    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
      if (depth === 0) return cursor;
    }

    cursor += 1;
  }

  return -1;
}

function appendTrailingSpace(dest: string): string {
  return /\s$/u.test(dest) ? dest : `${dest} `;
}

function transformLabelText(label: string, nestedDepth: number): string {
  if (!label.includes('[') || nestedDepth >= MAX_NESTED_LABEL_DEPTH) {
    return label;
  }

  return transformMarkdownLinksInternal(label, nestedDepth);
}

function transformMarkdownLinksInternal(markdown: string, nestedDepth: number): string {
  if (!markdown) return markdown;

  let result = '';
  let index = 0;

  while (index < markdown.length) {
    const char = markdown[index];

    if (char === '!' && markdown[index + 1] === '[' && !isEscaped(markdown, index)) {
      const labelStart = index + 1;
      const labelEnd = findMatchingBracket(markdown, labelStart);

      if (labelEnd !== -1 && markdown[labelEnd + 1] === '(') {
        const parenEnd = findMatchingParen(markdown, labelEnd + 1);

        if (parenEnd !== -1) {
          const label = markdown.slice(labelStart + 1, labelEnd);
          const dest = markdown.slice(labelEnd + 2, parenEnd);
          const nextLabel = transformLabelText(label, nestedDepth + 1);

          result += `![${nextLabel}](${appendTrailingSpace(dest)})`;
          index = parenEnd + 1;
          continue;
        }
      }
    }

    if (char === '[' && !isEscaped(markdown, index) && markdown[index - 1] !== '!') {
      const labelEnd = findMatchingBracket(markdown, index);

      if (labelEnd !== -1 && markdown[labelEnd + 1] === '(') {
        const parenEnd = findMatchingParen(markdown, labelEnd + 1);

        if (parenEnd !== -1) {
          const label = markdown.slice(index + 1, labelEnd);
          const dest = markdown.slice(labelEnd + 2, parenEnd);
          const nextLabel = transformLabelText(label, nestedDepth + 1);

          result += `[${nextLabel}](${appendTrailingSpace(dest)})`;
          index = parenEnd + 1;
          continue;
        }
      }
    }

    result += char;
    index += 1;
  }

  return result;
}

export function transformMarkdownLinks(markdown: string): string {
  return transformMarkdownLinksInternal(markdown, 0);
}
