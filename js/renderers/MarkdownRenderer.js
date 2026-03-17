/**
 * MarkdownRenderer.js - marked.js + DOMPurify + highlight.js + mermaid.js
 * marked.js v4+ API 기준. ```mermaid 코드블록 자동 처리 포함.
 */

import { BaseRenderer } from './BaseRenderer.js';

export class MarkdownRenderer extends BaseRenderer {
  async render(content) {
    this.clear();

    if (typeof marked === 'undefined') {
      throw new Error('marked.js 라이브러리가 로드되지 않았습니다.');
    }

    // marked v4+ 방식: marked.use()로 렌더러 확장
    marked.use({
      breaks: true,
      gfm: true,
      renderer: {
        // marked v5+ token 객체 API
        code(token) {
          // marked 버전에 따라 인자 형태가 다를 수 있어 양쪽 처리
          const code = typeof token === 'object' ? (token.text ?? token) : token;
          const lang = typeof token === 'object' ? (token.lang || '') : (arguments[1] || '');

          if (lang === 'mermaid') {
            const id = `mermaid-${Math.random().toString(36).slice(2)}`;
            return `<div class="mermaid-wrapper"><div class="mermaid" id="${id}">${escapeHtml(String(code))}</div></div>`;
          }

          if (typeof hljs !== 'undefined') {
            const validLang = lang && hljs.getLanguage(lang) ? lang : null;
            const highlighted = validLang
              ? hljs.highlight(String(code), { language: validLang }).value
              : hljs.highlightAuto(String(code)).value;
            return `<pre><code class="hljs language-${validLang || 'plaintext'}">${highlighted}</code></pre>`;
          }

          return `<pre><code>${escapeHtml(String(code))}</code></pre>`;
        },
      },
    });

    const rawHtml = marked.parse(content);
    const cleanHtml = typeof DOMPurify !== 'undefined'
      ? DOMPurify.sanitize(rawHtml, {
          ADD_TAGS: ['iframe'],
          ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
        })
      : rawHtml;

    const wrapper = document.createElement('div');
    wrapper.className = 'prose';
    wrapper.innerHTML = cleanHtml;
    this.container.appendChild(wrapper);

    // GFM task list 체크박스 비활성화
    wrapper.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.disabled = true;
    });

    // Mermaid 다이어그램 초기화
    await this._initMermaid();
  }

  async _initMermaid() {
    const mermaidDivs = this.container.querySelectorAll('.mermaid');
    if (mermaidDivs.length === 0 || typeof mermaid === 'undefined') return;

    try {
      const theme = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';
      mermaid.initialize({
        startOnLoad: false,
        theme,
        securityLevel: 'loose',
        fontFamily: 'inherit',
      });
      await mermaid.run({ nodes: Array.from(mermaidDivs) });
    } catch (err) {
      console.warn('[MarkdownRenderer] Mermaid 렌더링 경고:', err);
    }
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
