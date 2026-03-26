import { describe, expect, it } from 'vitest';
import { transformMarkdownLinks } from '$lib/transformMarkdownLinks';

describe('transformMarkdownLinks', () => {
  it('普通链接会在结尾补空格', () => {
    const input = '[正常](https://ok.com)';
    const output = transformMarkdownLinks(input);
    expect(output).toBe('[正常](https://ok.com )');
  });

  it('多链接也会处理', () => {
    const input = '[甲](https://a.com)[乙](https://b.com)';
    const output = transformMarkdownLinks(input);
    expect(output).toBe('[甲](https://a.com )[乙](https://b.com )');
  });

  it('图片链接也会在结尾补空格', () => {
    const input = '![图片](https://img.com/demo.png)';
    const output = transformMarkdownLinks(input);
    expect(output).toBe('![图片](https://img.com/demo.png )');
  });

  it('行内代码里的链接也会加空格', () => {
    const input = `
\`[代码](https://code.com)\`
`;
    const output = transformMarkdownLinks(input);
    expect(output).toBe(`
\`[代码](https://code.com )\`
`);
  });

  it('代码块内链接也会加空格', () => {
    const input = `
\`\`\`
[代码块](https://block.com)
\`\`\`
`;
    const output = transformMarkdownLinks(input);
    expect(output).toBe(`
\`\`\`
[代码块](https://block.com )
\`\`\`
`);
  });

  it('异常格式尽量保持原样', () => {
    const input = '[坏链](https://broken.com';
    const output = transformMarkdownLinks(input);
    expect(output).toBe('[坏链](https://broken.com');
  });

  it('复杂混合输入', () => {
    const input = `[前缀 [ok](https://ok.com) \`[code](https://no.com)\`\n\`\`\`\n[code block](https://still-no.com)\n\`\`\`\n![封面](https://img.com/demo.png)`;
    const output = transformMarkdownLinks(input);
    expect(output).toContain('[ok](https://ok.com )');
    expect(output).toContain('`[code](https://no.com )`');
    expect(output).toContain('[code block](https://still-no.com )');
    expect(output).toContain('![封面](https://img.com/demo.png )');
  });
});