/**
 * DropZone.js - 파일 드래그앤드롭 + 클릭 업로드 컴포넌트
 */

import { eventBus, EVENTS } from '../utils/eventBus.js';
import { detectFormatByExtension, detectFormatByMime, FORMAT_REGISTRY } from '../config/formats.js';
import { readFileAsText, readFileAsArrayBuffer } from '../utils/fileUtils.js';
import { setClass } from '../utils/domUtils.js';

export class DropZone {
  constructor(zoneId, fileInputId) {
    this._zone = document.getElementById(zoneId);
    this._input = document.getElementById(fileInputId);
    this._isDragging = false;
    this._init();
  }

  _init() {
    if (!this._zone) return;

    // 클릭으로 파일 선택 트리거
    this._zone.addEventListener('click', (e) => {
      if (e.target !== this._input) this._input.click();
    });

    // 키보드 접근성
    this._zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._input.click();
      }
    });

    // 파일 input change
    this._input.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) this._handleFile(file);
      // input 초기화 (같은 파일 재선택 가능하게)
      this._input.value = '';
    });

    // Drag events
    this._zone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._setDragging(true);
    });

    this._zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    });

    this._zone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // 자식 요소로 이동 시 false positive 방지
      if (!this._zone.contains(e.relatedTarget)) {
        this._setDragging(false);
      }
    });

    this._zone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) this._handleFile(file);
    });

    // 전역 drag-over 방지 (페이지 이동 방지)
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  }

  async _handleFile(file) {
    setClass(this._zone, 'is-loading', true);

    try {
      const formatId = detectFormatByExtension(file.name)
                    || detectFormatByMime(file.type)
                    || 'text';

      const fmt = FORMAT_REGISTRY[formatId];
      let content;

      if (fmt?.binaryFormat) {
        content = await readFileAsArrayBuffer(file);
      } else {
        content = await readFileAsText(file);
      }

      eventBus.emit(EVENTS.FILE_LOADED, {
        content,
        formatId,
        filename: file.name,
        fileSize: file.size,
      });
    } catch (err) {
      eventBus.emit(EVENTS.TOAST_SHOW, {
        message: `파일 로드 실패: ${err.message}`,
        type: 'error',
      });
    } finally {
      setClass(this._zone, 'is-loading', false);
    }
  }

  _setDragging(active) {
    setClass(this._zone, 'is-dragging', active);
    this._isDragging = active;
  }
}
