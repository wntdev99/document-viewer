/**
 * PdfRenderer.js - PDF.js Canvas 렌더링 + 페이지 네비게이션
 */

import { BaseRenderer } from './BaseRenderer.js';
import { eventBus, EVENTS } from '../utils/eventBus.js';

export class PdfRenderer extends BaseRenderer {
  constructor(container) {
    super(container);
    this._pdfDoc = null;
    this._currentPage = 1;
    this._totalPages = 0;
    this._renderTask = null;
    this._unsubscribers = [];
  }

  async render(content) {
    this.showLoading();

    // PDF.js 로드 확인
    if (typeof pdfjsLib === 'undefined') {
      // PDF.js는 모듈로 로드되므로 globalThis에서 확인
      throw new Error('PDF.js 라이브러리가 로드되지 않았습니다.');
    }

    const pdfLib = window.pdfjsLib;
    if (!pdfLib) throw new Error('PDF.js를 찾을 수 없습니다.');

    // Worker 설정
    if (!pdfLib.GlobalWorkerOptions.workerSrc) {
      pdfLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
    }

    try {
      const loadingTask = pdfLib.getDocument({ data: content });
      this._pdfDoc = await loadingTask.promise;
      this._totalPages = this._pdfDoc.numPages;
      this._currentPage = 1;

      eventBus.emit(EVENTS.PDF_PAGE_CHANGED, {
        current: this._currentPage,
        total: this._totalPages,
      });

      await this._renderPage(this._currentPage);

      // 페이지 이동 이벤트 구독
      const unsubPrev = eventBus.on('pdf:prev', () => this._goPage(this._currentPage - 1));
      const unsubNext = eventBus.on('pdf:next', () => this._goPage(this._currentPage + 1));
      this._unsubscribers.push(unsubPrev, unsubNext);

    } catch (err) {
      this.clear();
      throw new Error(`PDF 로드 실패: ${err.message}`);
    }
  }

  async _renderPage(pageNum) {
    if (!this._pdfDoc) return;
    pageNum = Math.max(1, Math.min(pageNum, this._totalPages));

    // 이전 렌더 작업 취소
    if (this._renderTask) {
      try { this._renderTask.cancel(); } catch {}
    }

    const page = await this._pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: this._calcScale(page) });

    this.clear();

    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'pdf-canvas-wrapper';

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvasWrapper.appendChild(canvas);
    this.container.appendChild(canvasWrapper);

    const ctx = canvas.getContext('2d');
    this._renderTask = page.render({ canvasContext: ctx, viewport });

    try {
      await this._renderTask.promise;
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('[PdfRenderer] 페이지 렌더 오류:', err);
      }
    }
  }

  _calcScale(page) {
    const viewport = page.getViewport({ scale: 1 });
    const containerWidth = this.container.clientWidth - 80;
    return Math.min(containerWidth / viewport.width, 1.5);
  }

  async _goPage(pageNum) {
    if (pageNum < 1 || pageNum > this._totalPages) return;
    this._currentPage = pageNum;
    eventBus.emit(EVENTS.PDF_PAGE_CHANGED, {
      current: this._currentPage,
      total: this._totalPages,
    });
    await this._renderPage(this._currentPage);
  }

  destroy() {
    this._unsubscribers.forEach(fn => fn?.());
    this._unsubscribers = [];
    if (this._renderTask) {
      try { this._renderTask.cancel(); } catch {}
    }
    this._pdfDoc?.destroy();
    this._pdfDoc = null;
  }
}
