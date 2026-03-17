/**
 * TextRenderer.js - Plain Text 렌더러 (줄 번호 포함 <pre>)
 */

import { BaseRenderer } from './BaseRenderer.js';

export class TextRenderer extends BaseRenderer {
  async render(content) {
    this.clear();

    const pre = document.createElement('pre');
    pre.className = 'prose-pre';

    const lines = content.split('\n');
    const fragment = document.createDocumentFragment();

    lines.forEach((line, i) => {
      const span = document.createElement('span');
      span.className = 'line';
      span.textContent = line || '\u200B'; // 빈 줄 처리 (zero-width space)
      fragment.appendChild(span);
    });

    pre.appendChild(fragment);
    this.container.appendChild(pre);
  }
}
