import { expect, test } from '@playwright/test';

function buildDeepNestedLink(depth: number): string {
  let result = '![叶](https://leaf.com)';
  for (let index = 0; index < depth; index += 1) {
    result = `[${result}](https://outer-${index}.com)`;
  }
  return result;
}

test.describe('Markdown 链接补空格页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('input')).toBeVisible();
    await expect(page.getByTestId('output')).toBeVisible();
  });

  test('实时转换普通链接', async ({ page }) => {
    await page.getByTestId('input').fill('[微博](https://t.cn/test)');
    await expect(page.getByTestId('output')).toHaveValue('[微博](https://t.cn/test )');
  });

  test('图片和嵌套图片包链接都会补空格', async ({ page }) => {
    const input = [
      '![图](https://img.com/a.png)',
      '[![按钮](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/gantrol/markdown-can-do)'
    ].join('\n');

    await page.getByTestId('input').fill(input);

    await expect(page.getByTestId('output')).toHaveValue([
      '![图](https://img.com/a.png )',
      '[![按钮](https://vercel.com/button )](https://vercel.com/import/project?template=https://github.com/gantrol/markdown-can-do )'
    ].join('\n'));
  });

  test('复制按钮在浏览器支持剪贴板时可写入结果', async ({ browser }) => {
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();

    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('input').fill('[微博](https://t.cn/test)');
      await page.getByTestId('copy-button').click();
      await expect(page.getByTestId('copy-button')).toContainText('已复制!');

      const clipboardText = await page.evaluate(async () => navigator.clipboard.readText());
      expect(clipboardText).toBe('[微博](https://t.cn/test )');
    } finally {
      await context.close();
    }
  });

  test('示例按钮会填入当前示例，并展示对应结果', async ({ page }) => {
    const input = page.getByTestId('input');
    const output = page.getByTestId('output');
    const exampleBtn = page.getByRole('button', { name: '示例' });

    await expect(exampleBtn).toBeEnabled();
    await exampleBtn.click();

    await expect(input).toHaveValue(/\[代码\]\(https:\/\/t\.cn\/A6code\)/);
    await expect(input).toHaveValue(/\[已有空格\]\(https:\/\/t\.cn\/A6keep \)/);
    await expect(input).toHaveValue(/\[!\[使用 Vercel 部署\]\(https:\/\/vercel\.com\/button\)\]\(https:\/\/vercel\.com\/import\/project\?template=https:\/\/github\.com\/gantrol\/markdown-can-do\)/);

    await expect(output).toHaveValue(/\[代码\]\(https:\/\/t\.cn\/A6code \)/);
    await expect(output).toHaveValue(/!\[封面\]\(https:\/\/wx4\.sinaimg\.cn\/large\/demo\.png \)/);
    await expect(output).toHaveValue(/\[!\[使用 Vercel 部署\]\(https:\/\/vercel\.com\/button \)\]\(https:\/\/vercel\.com\/import\/project\?template=https:\/\/github\.com\/gantrol\/markdown-can-do \)/);
  });

  test('清空按钮会清掉输入和输出', async ({ page }) => {
    const input = page.getByTestId('input');
    const clearBtn = page.getByRole('button', { name: '清空' });

    await input.fill('[微博](https://t.cn/test)');
    await clearBtn.click();

    await expect(input).toHaveValue('');
    await expect(page.getByTestId('output')).toHaveValue('');
  });

  test('故意构造的混乱输入也能稳定输出', async ({ page }) => {
    const input = page.getByTestId('input');
    const output = page.getByTestId('output');

    await input.fill([
      '[正常](https://ok.com)',
      '`[代码](https://no.com)`',
      '![图](https://img.com/demo.png)',
      '[![按钮](https://img.com/button.png)](https://outer.com)',
      '[坏链](https://broken.com'
    ].join('\n'));

    await expect.poll(async () => output.inputValue()).toContain('[正常](https://ok.com )');

    const outVal = await output.inputValue();
    expect(outVal).toContain('[正常](https://ok.com )');
    expect(outVal).toContain('`[代码](https://no.com )`');
    expect(outVal).toContain('![图](https://img.com/demo.png )');
    expect(outVal).toContain('[![按钮](https://img.com/button.png )](https://outer.com )');
    expect(outVal).toContain('[坏链](https://broken.com');
  });

  test('超深嵌套不会卡死，最外层仍会处理', async ({ page }) => {
    const input = buildDeepNestedLink(70);
    const output = page.getByTestId('output');

    await page.getByTestId('input').fill(input);

    await expect.poll(async () => output.inputValue()).toContain('https://outer-69.com )');
    await expect(output).toHaveValue(/https:\/\/outer-69\.com \)/);
  });
});
