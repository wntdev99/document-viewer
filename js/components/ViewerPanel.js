/**
 * ViewerPanel.js - 렌더링 결과 표시 컴포넌트
 */

import { eventBus, EVENTS } from '../utils/eventBus.js';
import { state } from '../state.js';
import { show, hide, setText } from '../utils/domUtils.js';
import { formatCharCount } from '../utils/fileUtils.js';

export class ViewerPanel {
  constructor() {
    this._emptyEl = document.getElementById('viewer-empty');
    this._contentEl = document.getElementById('viewer-content');
    this._statusBar = document.getElementById('status-bar');
    this._statusFormat = document.getElementById('status-format');
    this._statusChars = document.getElementById('status-chars');
    this._statusPages = document.getElementById('status-pages');
    this._statusPagesSep = document.getElementById('status-pages-sep');
    this._pdfNav = document.getElementById('pdf-nav');
    this._pdfPrev = document.getElementById('pdf-prev');
    this._pdfNext = document.getElementById('pdf-next');
    this._pdfCurrent = document.getElementById('pdf-page-current');
    this._pdfTotal = document.getElementById('pdf-page-total');
    this._init();
  }

  _init() {
    eventBus.on(EVENTS.RENDER_COMPLETE, ({ formatId, content }) => {
      this._showContent();
      this._updateStatus(formatId, content);
      // 새 콘텐츠에 현재 줌 레벨 재적용
      this._applyZoom(state.get('zoomLevel'));
    });

    eventBus.on(EVENTS.RENDER_ERROR, ({ error }) => {
      this._showError(error);
    });

    eventBus.on(EVENTS.FILE_LOADED, ({ content }) => {
      if (content === null) {
        this._showEmpty();
      }
    });

    eventBus.on(EVENTS.PDF_PAGE_CHANGED, ({ current, total }) => {
      if (this._pdfCurrent) this._pdfCurrent.textContent = current;
      if (this._pdfTotal) this._pdfTotal.textContent = total;
    });

    // PDF 네비게이션 버튼
    this._pdfPrev?.addEventListener('click', () => {
      eventBus.emit('pdf:prev');
    });
    this._pdfNext?.addEventListener('click', () => {
      eventBus.emit('pdf:next');
    });

    // 줌 적용
    state.subscribe('zoomLevel', (level) => {
      this._applyZoom(level);
    });
  }

  _showContent() {
    hide(this._emptyEl);
    show(this._statusBar);
    this._contentEl.classList.add('is-visible');
  }

  _showEmpty() {
    show(this._emptyEl);
    hide(this._statusBar);
    hide(this._pdfNav);
    this._contentEl.classList.remove('is-visible');
    this._contentEl.innerHTML = '';
  }

  _showError(error) {
    this._showContent();
    this._contentEl.innerHTML = `
      <div style="padding: 2em; color: var(--color-danger); text-align: center;">
        <p style="font-size: 2em; margin-bottom: 0.5em;">⚠️</p>
        <p style="font-weight: 600;">렌더링 오류</p>
        <p style="color: var(--color-text-secondary); margin-top: 0.5em; font-size: 0.9em;">${error.message || error}</p>
      </div>
    `;
  }

  _updateStatus(formatId, content) {
    const formatLabels = {
      markdown: 'Markdown',
      html: 'HTML',
      docx: 'DOCX',
      pdf: 'PDF',
      text: 'Plain Text',
      mermaid: 'Mermaid',
    };

    setText(this._statusFormat, formatLabels[formatId] || formatId || '-');
    setText(this._statusChars, formatCharCount(content));

    // PDF 관련 상태바
    const isPdf = formatId === 'pdf';
    if (this._pdfNav) this._pdfNav.hidden = !isPdf;
    if (this._statusPages) this._statusPages.hidden = !isPdf;
    if (this._statusPagesSep) this._statusPagesSep.hidden = !isPdf;
  }

  showPdfPages(current, total) {
    if (this._statusPages) {
      this._statusPages.hidden = false;
      this._statusPages.textContent = `${total}페이지`;
    }
    if (this._statusPagesSep) this._statusPagesSep.hidden = false;
    if (this._pdfCurrent) this._pdfCurrent.textContent = current;
    if (this._pdfTotal) this._pdfTotal.textContent = total;
  }

  _applyZoom(level) {
    const zoomVal = `${level}%`;
    // CSS zoom은 transform과 달리 레이아웃에 영향을 주어 스크롤이 올바르게 동작함
    const prose = this._contentEl.querySelector('.prose');
    if (prose) { prose.style.zoom = zoomVal; return; }

    const prosePre = this._contentEl.querySelector('.prose-pre');
    if (prosePre) { prosePre.style.zoom = zoomVal; return; }

    const mermaid = this._contentEl.querySelector('.mermaid-wrapper');
    if (mermaid) { mermaid.style.zoom = zoomVal; return; }

    const iframe = this._contentEl.querySelector('iframe');
    if (iframe) { iframe.style.zoom = zoomVal; return; }

    const pdfWrapper = this._contentEl.querySelector('.pdf-canvas-wrapper');
    if (pdfWrapper) { pdfWrapper.style.zoom = zoomVal; }
  }

  getContentEl() {
    return this._contentEl;
  }
}
