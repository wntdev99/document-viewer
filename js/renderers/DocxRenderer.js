/**
 * DocxRenderer.js - mammoth.js (ArrayBuffer → HTML)
 */

import { BaseRenderer } from './BaseRenderer.js';

export class DocxRenderer extends BaseRenderer {
  async render(content) {
    this.showLoading();

    if (typeof mammoth === 'undefined') {
      throw new Error('mammoth.js 라이브러리가 로드되지 않았습니다.');
    }

    if (!(content instanceof ArrayBuffer)) {
      throw new Error('DOCX 렌더러는 ArrayBuffer 형식의 콘텐츠가 필요합니다.');
    }

    const result = await mammoth.convertToHtml(
      { arrayBuffer: content },
      {
        styleMap: [
          "p[style-name='Section Title'] => h1:fresh",
          "p[style-name='Subsection Title'] => h2:fresh",
        ],
      }
    );

    // 변환 경고 출력
    if (result.messages?.length > 0) {
      const warnings = result.messages
        .filter(m => m.type === 'warning')
        .map(m => m.message);
      if (warnings.length > 0) {
        console.warn('[DocxRenderer] 변환 경고:', warnings);
      }
    }

    this.clear();

    const wrapper = document.createElement('div');
    wrapper.className = 'prose';

    const cleanHtml = typeof DOMPurify !== 'undefined'
      ? DOMPurify.sanitize(result.value)
      : result.value;

    wrapper.innerHTML = cleanHtml;
    this.container.appendChild(wrapper);
  }
}
