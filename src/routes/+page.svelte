
<script lang="ts">
  import { transformMarkdownLinks } from '$lib/transformMarkdownLinks';

  const sampleInput = `# 微博 Markdown 示例

普通链接：
[微博热搜](https://t.cn/A6abcde)

多个链接：
[甲](https://t.cn/A6foo)[乙](https://t.cn/A6bar)

代码里的链接，当前规则也会处理：
\`[代码](https://t.cn/A6code)\`

\`\`\`md
[代码块](https://t.cn/A6block)
\`\`\`

已有空格，不会重复补：
[已有空格](https://t.cn/A6keep )

图片也改：
![封面](https://wx4.sinaimg.cn/large/demo.png )

嵌套图片包链接，两层都会处理：
[![使用 Vercel 部署](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/gantrol/markdown-can-do)

坏输入尽量保持原样：
[坏链](https://t.cn/A6broken`;

  let input = '';
  let copyText = '复制结果';
  let isCopied = false;

  $: output = transformMarkdownLinks(input);

  async function copyOutput() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      isCopied = true;
      copyText = '已复制!';
      window.setTimeout(() => {
        isCopied = false;
        copyText = '复制结果';
      }, 2000);
    } catch {
      copyText = '复制失败';
      window.setTimeout(() => {
        copyText = '复制结果';
      }, 2000);
    }
  }

  function fillSample() {
    input = sampleInput;
  }

  function clearAll() {
    input = '';
    isCopied = false;
    copyText = '复制结果';
  }
</script>

<svelte:head>
  <title>微博 Markdown 防短链</title>
  <meta
    name="description"
    content="把 Markdown 链接从 [文字](链接) 改成 [文字](链接 )，适配微博的渲染规则。"
  />
</svelte:head>

<div class="page-container">
  <header class="hero">
    <h1>微博 Markdown 防短链装置</h1>
    <p class="intro">把 Markdown 里的链接、图片链接，连同嵌套写法，一并改成 <code>(链接 )</code> 这种微博更稳的格式。</p>
  </header>

  <main class="workspace">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          输入 Markdown
        </div>
        <div class="panel-actions">
          <button class="btn-ghost" on:click={fillSample} title="填入示例">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/></svg>
            示例
          </button>
          <button class="btn-ghost" on:click={clearAll} title="清空内容">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            清空
          </button>
        </div>
      </div>
      <div class="textarea-wrapper">
        <textarea
          bind:value={input}
          placeholder="把原始 Markdown 粘贴到这里..."
          spellcheck="false"
          data-testid="input"
        ></textarea>
      </div>
    </div>

    <div class="panel output-panel">
      <div class="panel-header">
        <div class="panel-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          输出结果
        </div>
        <div class="panel-actions">
          <button
            class="btn-primary"
            class:success={isCopied}
            on:click={copyOutput}
            data-testid="copy-button"
            disabled={!output}
          >
            {#if isCopied}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            {/if}
            {copyText}
          </button>
        </div>
      </div>
      <div class="textarea-wrapper">
        <textarea
          readonly
          value={output}
          placeholder="处理后的结果会显示在这里..."
          spellcheck="false"
          data-testid="output"
        ></textarea>
      </div>
    </div>
  </main>

  <aside class="notes">
    <div class="notes-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    </div>
    <div class="notes-content">
      <h2>处理规则</h2>
      <ul>
        <li>普通链接、图片链接，都会在结尾补一个空格。</li>
        <li>图片包链接这类嵌套写法，会从外到里一起处理。</li>
        <li>已有空格不会重复补，坏输入尽量保持原样。</li>
        <li>嵌套太深时，为了稳妥会停在 48 层，更深部分原样保留。</li>
      </ul>
    </div>
  </aside>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: #334155;
    background-color: #f8fafc;
    background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
    background-size: 24px 24px;
    -webkit-font-smoothing: antialiased;
  }

  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 24px;
    box-sizing: border-box;
  }

  .hero {
    text-align: center;
    margin-bottom: 40px;
  }

  .hero h1 {
    margin: 0;
    font-size: clamp(28px, 5vw, 42px);
    font-weight: 800;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.2;
  }

  .intro {
    margin: 16px auto 0;
    max-width: 600px;
    font-size: 16px;
    line-height: 1.6;
    color: #64748b;
  }

  code {
    padding: 0.2em 0.4em;
    border-radius: 6px;
    background: #e2e8f0;
    color: #334155;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
  }

  .workspace {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
    margin-bottom: 32px;
  }

  .panel {
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.025);
    overflow: hidden;
    transition: box-shadow 0.3s ease;
  }

  .panel:focus-within {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
    border-color: #cbd5e1;
  }

  .output-panel {
    background: #fafaf9;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(8px);
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #475569;
  }

  .panel-actions {
    display: flex;
    gap: 8px;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-ghost {
    background: transparent;
    color: #64748b;
  }

  .btn-ghost:hover:not(:disabled) {
    background: #f1f5f9;
    color: #1e293b;
  }

  .btn-ghost:active:not(:disabled) {
    background: #e2e8f0;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);
  }

  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-primary.success {
    background: #10b981;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
  }

  .textarea-wrapper {
    flex: 1;
    display: flex;
    padding: 16px;
  }

  textarea {
    flex: 1;
    width: 100%;
    min-height: 380px;
    resize: vertical;
    border: none;
    background: transparent;
    color: #1e293b;
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
    font-size: 14px;
    line-height: 1.6;
    outline: none;
  }

  textarea::placeholder {
    color: #94a3b8;
  }

  .notes {
    display: flex;
    gap: 16px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 16px;
    padding: 24px;
    color: #1e3a8a;
  }

  .notes-icon {
    flex-shrink: 0;
    color: #3b82f6;
  }

  .notes-content h2 {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 700;
  }

  .notes-content ul {
    margin: 0;
    padding-left: 20px;
    line-height: 1.8;
    font-size: 15px;
    color: #1e40af;
  }

  .notes-content li::marker {
    color: #60a5fa;
  }

  @media (max-width: 900px) {
    .workspace {
      grid-template-columns: 1fr;
    }

    textarea {
      min-height: 240px;
    }

    .hero {
      margin-bottom: 24px;
    }
  }
</style>
