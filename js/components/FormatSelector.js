/**
 * FormatSelector.js - 형식 선택 컴포넌트
 */

import { eventBus, EVENTS } from '../utils/eventBus.js';
import { state } from '../state.js';

export class FormatSelector {
  constructor(selectId) {
    this._select = document.getElementById(selectId);
    this._init();
  }

  _init() {
    if (!this._select) return;

    this._select.addEventListener('change', (e) => {
      const formatId = e.target.value;
      state.set('formatId', formatId);
      eventBus.emit(EVENTS.FORMAT_CHANGED, { formatId });
    });

    // 파일 로드 시 형식 자동 선택
    eventBus.on(EVENTS.FILE_LOADED, ({ formatId }) => {
      if (formatId && formatId !== 'auto') {
        // docx, pdf는 드롭다운에 없으므로 변경하지 않음
        const option = this._select.querySelector(`option[value="${formatId}"]`);
        if (option) {
          this._select.value = formatId;
          state.set('formatId', formatId);
        }
      }
    });
  }

  getValue() {
    return this._select?.value || 'auto';
  }

  setValue(formatId) {
    if (this._select) {
      this._select.value = formatId;
      state.set('formatId', formatId);
    }
  }
}
