/**
 * HtmlRenderer.js - iframe sandbox (JS 실행 차단) HTML 렌더러
 */

import { BaseRenderer } from './BaseRenderer.js';

export class HtmlRenderer extends BaseRenderer {
  constructor(container) {
    super(container);
    this._iframe = null;
  }

  async render(content) {
    this.clear();

    const iframe = document.createElement('iframe');
    iframe.className = 'html-frame';
    iframe.setAttribute('sandbox', 'allow-same-origin allow-popups');
    iframe.setAttribute('title', 'HTML 문서 뷰어');

    // srcdoc로 안전하게 렌더링 (JS 차단)
    iframe.srcdoc = this._injectThemeStyles(content);

    // 테마에 따라 배경 적용
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    iframe.style.background = isDark ? '#1a1d27' : '#ffffff';

    this.container.appendChild(iframe);
    this._iframe = iframe;

    // iframe 높이 자동 조정
    iframe.addEventListener('load', () => {
      try {
        const body = iframe.contentDocument?.body;
        if (body) {
          const height = Math.max(body.scrollHeight + 40, 400);
          iframe.style.minHeight = height + 'px';
        }
      } catch {}
    });
  }

  _injectThemeStyles(html) {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const themeStyle = isDark ? `
      body {
        background: #1a1d27 !important;
        color: #e2e8f0 !important;
      }
      a { color: #3b82f6 !important; }
    ` : '';

    const baseStyle = `
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 16px;
          line-height: 1.6;
          padding: 24px;
          margin: 0;
          ${isDark ? 'background:#1a1d27;color:#e2e8f0;' : 'background:#fff;color:#212529;'}
        }
        img { max-width: 100%; }
        ${themeStyle}
      </style>
    `;

    // <head>가 있으면 안에 삽입, 없으면 앞에 붙임
    if (/<head[\s>]/i.test(html)) {
      return html.replace(/<head([\s>])/i, `<head$1${baseStyle}`);
    }
    return baseStyle + html;
  }

  destroy() {
    this._iframe?.remove();
    this._iframe = null;
  }
}
