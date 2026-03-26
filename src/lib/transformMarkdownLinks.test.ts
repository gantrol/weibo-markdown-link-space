import { describe, expect, it } from 'vitest';
import { transformMarkdownLinks } from './transformMarkdownLinks';

describe('transformMarkdownLinks', () => {
  it('给普通链接补空格', () => {
    expect(transformMarkdownLinks('[微博](https://t.cn/test)')).toBe('[微博](https://t.cn/test )');
  });

  it('一次处理多个链接', () => {
    expect(transformMarkdownLinks('[甲](https://a.com)[乙](https://b.com)')).toBe(
      '[甲](https://a.com )[乙](https://b.com )'
    );
  });

  it('已有空格时不重复补', () => {
    expect(transformMarkdownLinks('[微博](https://t.cn/test )')).toBe('[微博](https://t.cn/test )');
  });

  it('不改图片语法', () => {
    expect(transformMarkdownLinks('![封面](https://img.com/a.png)')).toBe(
      '![封面](https://img.com/a.png)'
    );
  });

  it('不改行内代码里的链接', () => {
    expect(transformMarkdownLinks('`[微博](https://t.cn/test)`')).toBe('`[微博](https://t.cn/test)`');
  });

  it('不改 fenced code block 里的链接', () => {
    const input = ['```md', '[微博](https://t.cn/test)', '```'].join('\n');
    expect(transformMarkdownLinks(input)).toBe(input);
  });

  it('不改带缩进的 fenced code block 里的链接', () => {
    const input = ['  ```md', '[微博](https://t.cn/test)', '  ```'].join('\n');
    expect(transformMarkdownLinks(input)).toBe(input);
  });

  it('支持链接文字里嵌套方括号', () => {
    expect(transformMarkdownLinks('[[内部]标题](https://t.cn/test)')).toBe(
      '[[内部]标题](https://t.cn/test )'
    );
  });

  it('支持链接地址里嵌套圆括号', () => {
    expect(transformMarkdownLinks('[括号](https://example.com/a_(b))')).toBe(
      '[括号](https://example.com/a_(b) )'
    );
  });

  it('支持尖括号包裹的地址', () => {
    expect(transformMarkdownLinks('[尖括号](<https://example.com/a_(b)>)')).toBe(
      '[尖括号](<https://example.com/a_(b)> )'
    );
  });

  it('支持带标题的链接', () => {
    expect(transformMarkdownLinks('[标题](https://a.com "说明")')).toBe(
      '[标题](https://a.com "说明" )'
    );
  });

  it('空地址也会补空格', () => {
    expect(transformMarkdownLinks('[空链接]()')).toBe('[空链接]( )');
  });

  it('遇到缺右括号的坏输入时保持原样', () => {
    expect(transformMarkdownLinks('[坏链](https://t.cn/test')).toBe('[坏链](https://t.cn/test');
  });

  it('遇到缺右方括号的坏输入时保持原样', () => {
    expect(transformMarkdownLinks('[坏链(https://t.cn/test)')).toBe('[坏链(https://t.cn/test)');
  });

  it('支持反斜杠转义的方括号', () => {
    expect(transformMarkdownLinks('[a\\]b](https://t.cn/test)')).toBe('[a\\]b](https://t.cn/test )');
  });

  it('不处理引用式链接', () => {
    expect(transformMarkdownLinks('[微博][ref]\n\n[ref]: https://t.cn/test')).toBe(
      '[微博][ref]\n\n[ref]: https://t.cn/test'
    );
  });

  it('故意构造的混乱输入也不该抛错', () => {
    const input = [
      '前缀 [ok](https://ok.com) `[code](https://no.com)` ```',
      '[code block](https://still-no.com)',
      '``` [坏链](https://broken.com'
    ].join('\n');

    expect(() => transformMarkdownLinks(input)).not.toThrow();
    expect(transformMarkdownLinks(input)).toContain('[ok](https://ok.com )');
    expect(transformMarkdownLinks(input)).toContain('[code block](https://still-no.com)');
  });
});
