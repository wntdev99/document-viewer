/**
 * MermaidRenderer.js - 순수 Mermaid 다이어그램 렌더러 (.mmd 파일 전용)
 */

import { BaseRenderer } from './BaseRenderer.js';

export class MermaidRenderer extends BaseRenderer {
  async render(content) {
    this.clear();

    if (typeof mermaid === 'undefined') {
      this.container.innerHTML = '<p style="color:var(--color-danger)">mermaid.js 라이브러리가 로드되지 않았습니다.</p>';
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'mermaid-wrapper';

    const diagramEl = document.createElement('div');
    diagramEl.className = 'mermaid';
    diagramEl.textContent = content;
    wrapper.appendChild(diagramEl);

    this.container.appendChild(wrapper);

    const theme = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';
    mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });

    try {
      await mermaid.run({ nodes: [diagramEl] });
    } catch (err) {
      diagramEl.innerHTML = `
        <div style="color:var(--color-danger);padding:1em;border:1px solid var(--color-danger);border-radius:6px;">
          <strong>다이어그램 파싱 오류</strong><br>
          <code style="font-size:0.8em">${escapeHtml(err.message)}</code>
        </div>
      `;
    }
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
