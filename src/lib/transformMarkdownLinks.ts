const PLACEHOLDER_PREFIX = '\uE000MD_LINK_SPACE_PLACEHOLDER__';
const PLACEHOLDER_SUFFIX = '__\uE001';

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  let cursor = index - 1;

  while (cursor >= 0 && text[cursor] === '\\') {
    slashCount += 1;
    cursor -= 1;
  }

  return slashCount % 2 === 1;
}

function readRun(text: string, index: number, char: string): number {
  let cursor = index;

  while (cursor < text.length && text[cursor] === char) {
    cursor += 1;
  }

  return cursor - index;
}

function protectCodeSegments(markdown: string): {
  text: string;
  protectedSegments: string[];
} {
  const protectedSegments: string[] = [];
  let result = '';
  let index = 0;

  const pushProtected = (segment: string) => {
    const token = `${PLACEHOLDER_PREFIX}${protectedSegments.length}${PLACEHOLDER_SUFFIX}`;
    protectedSegments.push(segment);
    result += token;
  };

  const isLineStart = (position: number) => position === 0 || markdown[position - 1] === '\n';

  const getFenceInfo = (position: number): { fenceStart: number; marker: '`' | '~'; fenceLength: number } | null => {
    if (!isLineStart(position)) {
      return null;
    }

    let fenceStart = position;
    let indent = 0;
    while (indent < 3 && markdown[fenceStart] === ' ') {
      fenceStart += 1;
      indent += 1;
    }

    const marker = markdown[fenceStart];
    if (marker !== '`' && marker !== '~') {
      return null;
    }

    const fenceLength = readRun(markdown, fenceStart, marker);
    if (fenceLength < 3) {
      return null;
    }

    return { fenceStart, marker, fenceLength };
  };

  while (index < markdown.length) {
    const char = markdown[index];
    const openingFence = getFenceInfo(index);

    if (openingFence) {
      let cursor = openingFence.fenceStart + openingFence.fenceLength;
      while (cursor < markdown.length && markdown[cursor] !== '\n') {
        cursor += 1;
      }
      if (cursor < markdown.length) {
        cursor += 1;
      }

      let searchIndex = cursor;
      let closingLineEnd = markdown.length;
      let foundClosingFence = false;

      while (searchIndex < markdown.length) {
        const closingFence = getFenceInfo(searchIndex);
        if (closingFence && closingFence.marker === openingFence.marker && closingFence.fenceLength >= openingFence.fenceLength) {
          let afterFence = closingFence.fenceStart + closingFence.fenceLength;
          while (afterFence < markdown.length && markdown[afterFence] !== '\n') {
            afterFence += 1;
          }
          if (afterFence < markdown.length) {
            afterFence += 1;
          }
          closingLineEnd = afterFence;
          foundClosingFence = true;
          break;
        }

        while (searchIndex < markdown.length && markdown[searchIndex] !== '\n') {
          searchIndex += 1;
        }
        if (searchIndex < markdown.length) {
          searchIndex += 1;
        }
      }

      if (foundClosingFence) {
        pushProtected(markdown.slice(index, closingLineEnd));
        index = closingLineEnd;
        continue;
      }
    }

    if (char === '`') {
      const tickLength = readRun(markdown, index, '`');
      const marker = '`'.repeat(tickLength);
      let cursor = index + tickLength;
      let closingIndex = -1;

      while (cursor < markdown.length) {
        if (markdown.startsWith(marker, cursor)) {
          closingIndex = cursor + tickLength;
          break;
        }
        cursor += 1;
      }

      if (closingIndex !== -1) {
        pushProtected(markdown.slice(index, closingIndex));
        index = closingIndex;
        continue;
      }
    }

    result += char;
    index += 1;
  }

  return { text: result, protectedSegments };
}

function restoreCodeSegments(text: string, protectedSegments: string[]): string {
  return protectedSegments.reduce(
    (current, segment, index) => current.replace(`${PLACEHOLDER_PREFIX}${index}${PLACEHOLDER_SUFFIX}`, segment),
    text
  );
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
      if (depth === 0) {
        return cursor;
      }
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
      if (char === '>') {
        inAngle = false;
      }
      cursor += 1;
      continue;
    }

    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      }
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
      if (depth === 0) {
        return cursor;
      }
    }

    cursor += 1;
  }

  return -1;
}

function appendTrailingSpace(destination: string): string {
  return /\s$/u.test(destination) ? destination : `${destination} `;
}

function transformUnprotected(markdown: string): string {
  let result = '';
  let index = 0;

  while (index < markdown.length) {
    const char = markdown[index];

    if (char === '[' && markdown[index - 1] !== '!' && !isEscaped(markdown, index)) {
      const labelEnd = findMatchingBracket(markdown, index);

      if (labelEnd !== -1 && markdown[labelEnd + 1] === '(') {
        const destinationEnd = findMatchingParen(markdown, labelEnd + 1);

        if (destinationEnd !== -1) {
          const destination = markdown.slice(labelEnd + 2, destinationEnd);
          const transformed = appendTrailingSpace(destination);
          result += `${markdown.slice(index, labelEnd + 2)}${transformed})`;
          index = destinationEnd + 1;
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
  if (markdown.length === 0) {
    return markdown;
  }

  const { text, protectedSegments } = protectCodeSegments(markdown);
  const transformed = transformUnprotected(text);
  return restoreCodeSegments(transformed, protectedSegments);
}
