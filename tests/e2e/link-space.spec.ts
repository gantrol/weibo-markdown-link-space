import { expect, test } from '@playwright/test';

test.describe('Markdown 链接补空格页面', () => {
  test('实时转换普通链接', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('input').fill('[微博](https://t.cn/test)');
    await expect(page.getByTestId('output')).toHaveValue('[微博](https://t.cn/test )');
  });

  test('代码里的链接、图片链接都会补空格', async ({ page }) => {
    const input = [
      '`[行内代码](https://t.cn/inline)`',
      '```md',
      '[代码块](https://t.cn/code)',
      '```',
      '![图](https://img.com/a.png)'
    ].join('\n');

    const expected = [
      '`[行内代码](https://t.cn/inline )`',
      '```md',
      '[代码块](https://t.cn/code )',
      '```',
      '![图](https://img.com/a.png )'
    ].join('\n');

    await page.goto('/');
    await page.getByTestId('input').fill(input);
    await expect(page.getByTestId('output')).toHaveValue(expected);
  });

  test('复制按钮在浏览器支持剪贴板时可写入结果', async ({ browser }) => {
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });

    try {
      const page = await context.newPage();
      await page.goto('/');
      await page.getByTestId('input').fill('[微博](https://t.cn/test)');
      await page.getByTestId('copy-button').click();
      await expect(page.getByTestId('copy-button')).toHaveText('已复制!');

      const clipboardText = await page.evaluate(async () => navigator.clipboard.readText());
      expect(clipboardText).toBe('[微博](https://t.cn/test )');
    } finally {
      await context.close();
    }
  });

  test('示例按钮会填入当前示例，并展示对应结果', async ({ page }) => {
    await page.goto('/');

    const input = page.getByTestId('input');
    const output = page.getByTestId('output');
    const exampleButton = page.getByRole('button', { name: '示例' });

    await expect(input).toBeEnabled();
    await expect(exampleButton).toBeEnabled();
    await exampleButton.click();

    await expect(input).toHaveValue(/\[代码\]\(https:\/\/t\.cn\/A6code\)/);
    await expect(input).toHaveValue(/\[已有空格\]\(https:\/\/t\.cn\/A6keep \)/);
    await expect(input).toHaveValue(/!\[封面\]\(https:\/\/wx4\.sinaimg\.cn\/large\/demo\.png \)/);
    await expect(output).toHaveValue(/\[代码\]\(https:\/\/t\.cn\/A6code \)/);
    await expect(output).toHaveValue(/\[代码块\]\(https:\/\/t\.cn\/A6block \)/);
    await expect(output).toHaveValue(/\[已有空格\]\(https:\/\/t\.cn\/A6keep \)/);
    await expect(output).toHaveValue(/!\[封面\]\(https:\/\/wx4\.sinaimg\.cn\/large\/demo\.png \)/);
  });

  test('清空按钮会清掉输入和输出', async ({ page }) => {
    await page.goto('/');

    const input = page.getByTestId('input');
    const clearBtn = page.getByRole('button', { name: '清空' });

    await input.fill('[微博](https://t.cn/test)');
    await clearBtn.click();

    await expect(input).toHaveValue('');
    await expect(page.getByTestId('output')).toHaveValue('');
  });

  test('故意构造的混乱输入也能稳定输出', async ({ page }) => {
    await page.goto('/');

    const input = page.getByTestId('input');
    const output = page.getByTestId('output');

    await input.fill([
      '[正常](https://ok.com)',
      '`[代码](https://no.com)`',
      '![图](https://img.com/demo.png)',
      '[坏链](https://broken.com'
    ].join('\n'));

    await expect(output).toHaveValue(/\[正常\]\(https:\/\/ok\.com \)/);
    await expect(output).toHaveValue(/`\[代码\]\(https:\/\/no\.com \)`/);
    await expect(output).toHaveValue(/!\[图\]\(https:\/\/img\.com\/demo\.png \)/);
    await expect(output).toHaveValue(/\[坏链\]\(https:\/\/broken\.com/);
  });
});
