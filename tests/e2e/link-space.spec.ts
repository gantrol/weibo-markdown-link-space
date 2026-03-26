import { expect, test } from '@playwright/test';

test.describe('Markdown 链接补空格页面', () => {
  test('实时转换普通链接', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('input').fill('[微博](https://t.cn/test)');
    await expect(page.getByTestId('output')).toHaveValue('[微博](https://t.cn/test )');
  });

  test('不会改代码块和图片', async ({ page }) => {
    const input = ['```md', '[代码](https://t.cn/code)', '```', '![图](https://img.com/a.png)'].join('\n');

    await page.goto('/');
    await page.getByTestId('input').fill(input);
    await expect(page.getByTestId('output')).toHaveValue(input);
  });

  test('复制按钮在浏览器支持剪贴板时可写入结果', async ({ browser }) => {
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();

    await page.goto('/');
    await page.getByTestId('input').fill('[微博](https://t.cn/test)');
    await page.getByTestId('copy-button').click();
    await expect(page.getByTestId('copy-button')).toHaveText('已复制!');

    const clipboardText = await page.evaluate(async () => navigator.clipboard.readText());
    expect(clipboardText).toBe('[微博](https://t.cn/test )');

    await context.close();
  });

  test('示例按钮会填入内容并产生结果', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.workspace');

    const exampleBtn = page.getByRole('button', { name: '示例' });
    await exampleBtn.waitFor({ state: 'visible', timeout: 5000 });
    await exampleBtn.click();

    const input = page.getByTestId('input');
    const output = page.getByTestId('output');

    await expect(input).toHaveValue(/\[微博热搜\]\(https:\/\/t\.cn\/A6abcde\)/, { timeout: 2000 });
    await expect(output).toHaveValue(/\[微博热搜\]\(https:\/\/t\.cn\/A6abcde \)/, { timeout: 2000 });
  });

  test('清空按钮会清掉输入和输出', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.workspace');

    const input = page.getByTestId('input');
    const clearBtn = page.getByRole('button', { name: '清空' });

    await input.fill('[微博](https://t.cn/test)');
    await clearBtn.click();

    await expect(input).toHaveValue('', { timeout: 2000 });
    await expect(page.getByTestId('output')).toHaveValue('', { timeout: 2000 });
  });
  test('故意构造的超长混乱输入也能稳定输出', async ({ page }) => {
    await page.goto('/');
    const input = page.getByTestId('input');
    const output = page.getByTestId('output');
    await input.fill([
      '[正常](https://ok.com)',
      '`[代码](https://no.com)`',
      '![图](https://img.com/demo.png)',
      '[坏链](https://broken.com'
    ].join('\n'));
    await expect(output).not.toHaveValue('', { timeout: 1000 });
    const outVal = await output.inputValue();
    expect(outVal).toContain('[正常](https://ok.com )');
    expect(outVal).toContain('`[代码](https://no.com)`');
    expect(outVal).toContain('![图](https://img.com/demo.png)');
    expect(outVal).toContain('[坏链](https://broken.com');
  });
});
