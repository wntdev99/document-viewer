/**
 * PastePanel.js - 텍스트 붙여넣기 패널 컴포넌트
 */

import { eventBus, EVENTS } from '../utils/eventBus.js';
import { state } from '../state.js';

export class PastePanel {
  constructor(textareaId, clearBtnId, renderBtnId) {
    this._textarea = document.getElementById(textareaId);
    this._clearBtn = document.getElementById(clearBtnId);
    this._renderBtn = document.getElementById(renderBtnId);
    this._init();
  }

  _init() {
    if (!this._textarea) return;

    // 텍스트 변경 감지
    this._textarea.addEventListener('input', () => {
      this._updateRenderBtn();
    });

    // Ctrl+Enter로 빠른 렌더링
    this._textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this._triggerRender();
      }
    });

    // 지우기 버튼
    this._clearBtn?.addEventListener('click', () => {
      this._textarea.value = '';
      this._textarea.focus();
      this._updateRenderBtn();
      // 뷰어 초기화
      eventBus.emit(EVENTS.FILE_LOADED, {
        content: null,
        formatId: null,
        filename: null,
      });
    });

    // 렌더링 버튼
    this._renderBtn?.addEventListener('click', () => this._triggerRender());

    // 파일 로드 시 textarea에 텍스트 콘텐츠 표시 (바이너리 제외)
    eventBus.on(EVENTS.FILE_LOADED, ({ content, formatId }) => {
      if (typeof content === 'string') {
        this._textarea.value = content;
        this._updateRenderBtn();
      } else if (content === null) {
        this._textarea.value = '';
        this._updateRenderBtn();
      }
    });
  }

  _triggerRender() {
    const text = this._textarea.value.trim();
    if (!text) return;

    // DOM에서 직접 읽어 내부 렌더링으로 변경된 state를 우회
    const selectEl = document.getElementById('format-select');
    const formatId = selectEl?.value || state.get('formatId') || 'auto';

    eventBus.emit(EVENTS.RENDER_REQUESTED, {
      content: this._textarea.value,
      formatId,
      source: 'paste',
    });
  }

  _updateRenderBtn() {
    if (this._renderBtn) {
      this._renderBtn.disabled = !this._textarea.value.trim();
    }
  }

  getValue() {
    return this._textarea?.value || '';
  }

  setValue(text) {
    if (this._textarea) {
      this._textarea.value = text;
      this._updateRenderBtn();
    }
  }
}
