// ==UserScript==
// @name         微博 Markdown 防短链装置（链接补空格）
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  给微博编辑框加一个按钮，把链接与图片统一改成结尾补空格，兼容 textarea 和 contenteditable
// @author       OpenAI
// @match        https://weibo.com/*
// @match        https://www.weibo.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const PANEL_ID = 'tm-weibo-md-link-fix-panel';
  const TOAST_ID = 'tm-weibo-md-link-fix-toast';
  const EDITABLE_SELECTOR = [
    'textarea',
    'input[type="text"]',
    '[contenteditable=""]',
    '[contenteditable="true"]',
    '[role="textbox"]'
  ].join(',');

  let activeEditor = null;
  let panel = null;
  let toast = null;
  let hideTimer = null;

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isEditableElement(el) {
    if (!el || !(el instanceof HTMLElement)) return false;
    if (el.matches('textarea, input[type="text"]')) return true;

    const contenteditable = el.getAttribute('contenteditable');
    if (contenteditable === '' || contenteditable === 'true') return true;
    if (el.getAttribute('role') === 'textbox') return true;
    return false;
  }

  function findEditableTarget(node) {
    if (!node) return null;
    if (isEditableElement(node)) return node;
    if (node instanceof HTMLElement) {
      return node.closest(EDITABLE_SELECTOR);
    }
    return null;
  }

  function isEscaped(str, index) {
    let count = 0;
    let i = index - 1;
    while (i >= 0 && str[i] === '\\') {
      count += 1;
      i -= 1;
    }
    return count % 2 === 1;
  }


  function parseBracketText(str, start) {
    if (str[start] !== '[') return null;
    let depth = 0;
    for (let i = start; i < str.length; i += 1) {
      const ch = str[i];
      if (isEscaped(str, i)) continue;
      if (ch === '[') depth += 1;
      if (ch === ']') {
        depth -= 1;
        if (depth === 0) return i;
      }
    }
    return null;
  }

  function parseParenText(str, start) {
    if (str[start] !== '(') return null;
    let depth = 0;
    for (let i = start; i < str.length; i += 1) {
      const ch = str[i];
      if (isEscaped(str, i)) continue;
      if (ch === '(') depth += 1;
      if (ch === ')') {
        depth -= 1;
        if (depth === 0) return i;
      }
    }
    return null;
  }

  function appendTrailingSpace(dest) {
    return /\s$/.test(dest) ? dest : `${dest} `;
  }

  function transformMarkdownLinks(input) {
    if (!input) return input;

    let result = '';
    let i = 0;

    while (i < input.length) {
      const ch = input[i];

      if (ch === '[' && !isEscaped(input, i)) {
        const textEnd = parseBracketText(input, i);
        if (textEnd !== null && input[textEnd + 1] === '(') {
          const urlEnd = parseParenText(input, textEnd + 1);
          if (urlEnd !== null) {
            const inner = input.slice(textEnd + 2, urlEnd);
            result += input.slice(i, textEnd + 2) + appendTrailingSpace(inner) + ')';
            i = urlEnd + 1;
            continue;
          }
        }
      }

      result += ch;
      i += 1;
    }

    return result;
  }

  function getEditorText(editor) {
    if (!editor) return '';
    if (editor instanceof HTMLTextAreaElement) return editor.value;
    if (editor instanceof HTMLInputElement) return editor.value;
    if (editor instanceof HTMLElement) return editor.innerText.replace(/\r\n/g, '\n');
    return '';
  }

  function setContenteditableText(editor, text) {
    editor.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
  }

  function dispatchInputEvents(editor) {
    editor.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: null
    }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setEditorText(editor, text) {
    if (!editor) return;

    if (editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement) {
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(editor), 'value')?.set;
      if (setter) {
        setter.call(editor, text);
      } else {
        editor.value = text;
      }
      dispatchInputEvents(editor);
      return;
    }

    if (editor instanceof HTMLElement) {
      setContenteditableText(editor, text);
      dispatchInputEvents(editor);
    }
  }

  function focusEditorEnd(editor) {
    if (!editor) return;
    editor.focus();

    if (editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement) {
      const pos = editor.value.length;
      try {
        editor.setSelectionRange(pos, pos);
      } catch (_) {}
      return;
    }

    if (editor instanceof HTMLElement) {
      const selection = window.getSelection();
      if (!selection) return;
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function showToast(message, isError = false) {
    if (!toast) return;
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    toast.style.background = isError ? 'rgba(190, 24, 93, 0.95)' : 'rgba(17, 24, 39, 0.92)';
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 1800);
  }

  function convertActiveEditor() {
    const editor = activeEditor || findEditableTarget(document.activeElement);
    if (!editor) {
      showToast('没找到可编辑区域', true);
      return;
    }

    const before = getEditorText(editor);
    if (!before.trim()) {
      showToast('编辑框是空的');
      return;
    }

    const after = transformMarkdownLinks(before);
    if (after === before) {
      showToast('没有需要处理的链接');
      return;
    }

    setEditorText(editor, after);
    focusEditorEnd(editor);
    showToast('已补上 Markdown 链接空格');
  }

  function ensurePanel() {
    if (panel) return;

    const style = document.createElement('style');
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 2147483647;
        display: flex;
        gap: 8px;
        align-items: center;
        opacity: 0;
        pointer-events: none;
        transform: translateY(8px);
        transition: opacity .18s ease, transform .18s ease;
      }
      #${PANEL_ID}.show {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }
      #${PANEL_ID} .tm-btn {
        border: 0;
        border-radius: 999px;
        background: #ff8200;
        color: #fff;
        font-size: 13px;
        line-height: 1;
        padding: 10px 14px;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0,0,0,.18);
      }
      #${PANEL_ID} .tm-btn:hover {
        filter: brightness(0.96);
      }
      #${PANEL_ID} .tm-hint {
        color: #fff;
        background: rgba(17, 24, 39, 0.88);
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 12px;
        white-space: nowrap;
        box-shadow: 0 8px 24px rgba(0,0,0,.16);
      }
      #${TOAST_ID} {
        position: fixed;
        left: 50%;
        bottom: 76px;
        z-index: 2147483647;
        transform: translateX(-50%) translateY(10px);
        padding: 10px 14px;
        border-radius: 10px;
        color: #fff;
        font-size: 13px;
        opacity: 0;
        transition: opacity .18s ease, transform .18s ease;
        pointer-events: none;
        box-shadow: 0 8px 24px rgba(0,0,0,.18);
      }
    `;
    document.documentElement.appendChild(style);

    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <button type="button" class="tm-btn">修正 Markdown 链接</button>
      <div class="tm-hint">快捷键：Ctrl/Cmd + Shift + M</div>
    `;
    document.body.appendChild(panel);

    toast = document.createElement('div');
    toast.id = TOAST_ID;
    document.body.appendChild(toast);

    const button = panel.querySelector('.tm-btn');
    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
    });
    button.addEventListener('click', () => {
      convertActiveEditor();
    });
  }

  function showPanel() {
    ensurePanel();
    clearTimeout(hideTimer);
    panel.classList.add('show');
  }

  function hidePanelSoon() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (!panel) return;
      const focused = findEditableTarget(document.activeElement);
      if (focused) return;
      panel.classList.remove('show');
    }, 120);
  }

  function onFocusIn(event) {
    const editor = findEditableTarget(event.target);
    if (!editor) return;
    activeEditor = editor;
    showPanel();
  }

  function onFocusOut() {
    hidePanelSoon();
  }

  function onPointerDown(event) {
    const editor = findEditableTarget(event.target);
    if (!editor) return;
    activeEditor = editor;
    showPanel();
  }

  function onKeyDown(event) {
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
    const mod = isMac ? event.metaKey : event.ctrlKey;
    if (mod && event.shiftKey && event.key.toLowerCase() === 'm') {
      event.preventDefault();
      convertActiveEditor();
    }
  }

  function init() {
    ensurePanel();
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    console.log('[微博 Markdown 链接补空格] 脚本已启动');
  }

  init();
})();