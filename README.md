# Markdown 链接补空格 · SvelteKit

把 Markdown 内联链接从：

```md
[文字](链接)
```

批量改成：

```md
[文字](链接 )
```

目前用于解决微博Markdown渲染的问题，[详见这条微博](https://weibo.com/6083767801/QxQMXg1bl)。

## 油猴脚本

另外可以选择用[油猴脚本](scripts\weibo_markdown_link_space_tampermoney.js)

## 功能

- 实时转换输入内容
- 一键复制结果
- 跳过图片语法 `![]()`
- 跳过行内代码与 fenced code block
- 坏输入尽量保持原样，不强行修复

## 本地启动

```bash
npm install
npm run dev
```

## 测试

单元测试：

```bash
npm run test:unit
```

端到端测试：

```bash
npm run test:e2e
```

全部测试：

```bash
npm test
```

## 覆盖的场景

### 常见场景

- 单个链接
- 多个链接
- 已有空格，不重复追加
- 图片语法不处理
- 行内代码不处理
- fenced code block 不处理
- 嵌套方括号文本
- 地址里带圆括号
- 尖括号地址
- 带标题的链接
- 空链接

### 故意构造的异常场景

- 缺右括号
- 缺右方括号
- 转义方括号
- 引用式链接
- 长文本混杂正常链接、代码、图片、坏链
- 剪贴板交互

## 项目结构

```text
.
├─ src/
│  ├─ lib/
│  │  ├─ transformMarkdownLinks.ts
│  │  └─ transformMarkdownLinks.test.ts
│  └─ routes/
│     └─ +page.svelte
├─ tests/
│  └─ e2e/
│     └─ link-space.spec.ts
├─ package.json
├─ playwright.config.ts
├─ svelte.config.js
├─ tsconfig.json
└─ vite.config.ts
```


## 依赖版本说明

这个版本已对齐到较新的工具链：

- Vite 8
- SvelteKit 2.55
- Vitest 4.1
- Svelte 5.55
- Playwright 1.58

## 安装前提

- Node.js >= 20.19.0

## 建议安装步骤

```bash
rm -rf node_modules package-lock.json
npm install
npm run check
npm run test:unit
npm run test:e2e
npm audit
```

如果你是从旧版本直接升级，先删掉旧的 `package-lock.json` 再装，审计结果会更干净。
