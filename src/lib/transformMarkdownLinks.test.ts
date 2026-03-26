import { describe, expect, it } from 'vitest';
import { MAX_NESTED_LABEL_DEPTH, transformMarkdownLinks } from '$lib/transformMarkdownLinks';

function buildDeepNestedLink(depth: number): string {
  let result = '![叶](https://leaf.com)';
  for (let index = 0; index < depth; index += 1) {
    result = `[${result}](https://outer-${index}.com)`;
  }
  return result;
}

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

  it('图片链接也会补空格', () => {
    const input = '![图片](https://img.com/demo.png)';
    const output = transformMarkdownLinks(input);
    expect(output).toBe('![图片](https://img.com/demo.png )');
  });

  it('嵌套图片包链接时，里外两层都会处理', () => {
    const input = '[![使用 Vercel 部署](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/gantrol/markdown-can-do)';
    const output = transformMarkdownLinks(input);

    expect(output).toBe(
      '[![使用 Vercel 部署](https://vercel.com/button )](https://vercel.com/import/project?template=https://github.com/gantrol/markdown-can-do )'
    );
  });

  it('行内代码里的链接也会加空格', () => {
    const input = '`[代码](https://code.com)`';
    const output = transformMarkdownLinks(input);
    expect(output).toBe('`[代码](https://code.com )`');
  });

  it('代码块内链接也会加空格', () => {
    const input = ['```', '[代码块](https://block.com)', '```'].join('\n');
    const output = transformMarkdownLinks(input);
    expect(output).toBe(['```', '[代码块](https://block.com )', '```'].join('\n'));
  });

  it('已有空格时不会重复补', () => {
    const input = '[已有空格](https://ok.com )';
    const output = transformMarkdownLinks(input);
    expect(output).toBe(input);
  });

  it('异常格式尽量保持原样', () => {
    const input = '[坏链](https://broken.com';
    const output = transformMarkdownLinks(input);
    expect(output).toBe('[坏链](https://broken.com');
  });

  it('超深嵌套时不会一直递归，最外层仍能稳定处理', () => {
    const input = buildDeepNestedLink(MAX_NESTED_LABEL_DEPTH + 12);
    const output = transformMarkdownLinks(input);

    expect(output).toContain(`https://outer-${MAX_NESTED_LABEL_DEPTH + 11}.com )`);
    expect(output).toContain('![叶](https://leaf.com)');
    expect(output.length).toBeGreaterThan(0);
  });

  it('复杂混合输入', () => {
    const input = [
      '[前缀](https://prefix.com)',
      '`[code](https://no.com)`',
      '```',
      '[code block](https://still-no.com)',
      '```',
      '![封面](https://img.com/demo.png)',
      '[![按钮](https://img.com/button.png)](https://outer.com)',
      '[坏链](https://broken.com'
    ].join('\n');

    const output = transformMarkdownLinks(input);

    expect(output).toContain('[前缀](https://prefix.com )');
    expect(output).toContain('`[code](https://no.com )`');
    expect(output).toContain('[code block](https://still-no.com )');
    expect(output).toContain('![封面](https://img.com/demo.png )');
    expect(output).toContain('[![按钮](https://img.com/button.png )](https://outer.com )');
    expect(output).toContain('[坏链](https://broken.com');
  });
});
