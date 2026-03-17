/**
 * app.js - 진입점, 이벤트 오케스트레이터
 * 모든 컴포넌트를 초기화하고 이벤트를 조율합니다.
 */

import { eventBus, EVENTS } from './utils/eventBus.js';
import { state } from './state.js';

import { FORMAT_REGISTRY } from './config/formats.js';
import { FormatValidator } from './validators/FormatValidator.js';

import { BaseRenderer, RendererFactory } from './renderers/BaseRenderer.js';
import { MarkdownRenderer } from './renderers/MarkdownRenderer.js';
import { HtmlRenderer } from './renderers/HtmlRenderer.js';
import { TextRenderer } from './renderers/TextRenderer.js';
import { MermaidRenderer } from './renderers/MermaidRenderer.js';
import { DocxRenderer } from './renderers/DocxRenderer.js';
import { PdfRenderer } from './renderers/PdfRenderer.js';

import { DropZone } from './components/DropZone.js';
import { PastePanel } from './components/PastePanel.js';
import { FormatSelector } from './components/FormatSelector.js';
import { ViewerPanel } from './components/ViewerPanel.js';
import { Toolbar } from './components/Toolbar.js';
import { Toast } from './components/Toast.js';

// ---- 렌더러 등록 ----
RendererFactory.register('markdown', MarkdownRenderer);
RendererFactory.register('html', HtmlRenderer);
RendererFactory.register('text', TextRenderer);
RendererFactory.register('mermaid', MermaidRenderer);
RendererFactory.register('docx', DocxRenderer);
RendererFactory.register('pdf', PdfRenderer);

// ---- PDF.js 글로벌 설정 ----
// PDF.js는 ESM 모듈로 로드되지만 글로벌로 노출해야 함
async function loadPdfJs() {
  try {
    const pdfModule = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
    window.pdfjsLib = pdfModule;
    if (pdfModule.GlobalWorkerOptions) {
      pdfModule.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
    }
  } catch (err) {
    console.warn('[App] PDF.js 로드 실패 (PDF 렌더링 불가):', err);
  }
}

// ---- 앱 초기화 ----
class App {
  constructor() {
    this._viewerEl = document.getElementById('viewer-content');
    this._currentRenderer = null;

    this._toast = new Toast();
    this._toolbar = new Toolbar();
    this._viewerPanel = new ViewerPanel();
    this._dropZone = new DropZone('drop-zone', 'file-input');
    this._formatSelector = new FormatSelector('format-select');
    this._pastePanel = new PastePanel('paste-input', 'paste-clear', 'render-btn');

    this._bindEvents();
    this._toolbar.loadSavedTheme();
  }

  _bindEvents() {
    // 파일 로드 → 자동 렌더링
    eventBus.on(EVENTS.FILE_LOADED, async ({ content, formatId, filename }) => {
      if (content === null) return;

      state.patch({
        content,
        filename,
        formatId: formatId || state.get('formatId'),
      });

      // 형식 셀렉터 업데이트
      if (formatId && formatId !== 'auto') {
        const option = document.querySelector(`#format-select option[value="${formatId}"]`);
        if (option) {
          document.getElementById('format-select').value = formatId;
          state.set('formatId', formatId);
        }
      }

      // 바이너리 형식은 불일치 검사 없이 즉시 렌더링
      const fmt = FORMAT_REGISTRY[formatId];
      if (fmt?.binaryFormat) {
        await this._render(content, formatId);
        return;
      }

      // 텍스트 형식: 불일치 검사
      await this._checkAndRender(content, formatId || state.get('formatId'), false);
    });

    // 렌더링 요청 (붙여넣기 버튼)
    eventBus.on(EVENTS.RENDER_REQUESTED, async ({ content, formatId, source }) => {
      state.patch({ content, formatId });
      await this._checkAndRender(content, formatId, source === 'paste');
    });

    // 형식 변경 → 기존 콘텐츠 재렌더링
    eventBus.on(EVENTS.FORMAT_CHANGED, async ({ formatId }) => {
      const content = state.get('content');
      if (content) {
        await this._render(content, formatId === 'auto'
          ? FormatValidator.resolveAuto(content, null)
          : formatId);
      }
    });

    // 토스트 이벤트
    eventBus.on(EVENTS.TOAST_SHOW, ({ message, type, duration }) => {
      this._toast.show(message, { type, duration });
    });
  }

  /**
   * 불일치 검사 후 렌더링합니다.
   */
  async _checkAndRender(content, formatId, fromPaste = false) {
    // 'auto' 형식 해석
    let resolvedFormat = formatId;
    if (formatId === 'auto' || !formatId) {
      resolvedFormat = FormatValidator.resolveAuto(content, null);
    }

    // 불일치 검사 (붙여넣기 시)
    if (fromPaste && resolvedFormat && resolvedFormat !== 'auto') {
      const { mismatch, detected } = FormatValidator.checkMismatch(resolvedFormat, content);

      if (mismatch && detected) {
        // 토스트 경고 표시
        this._toast.showMismatch(
          resolvedFormat,
          detected,
          // "감지된 형식으로 렌더링"
          async (detectedFormat) => {
            // 형식 셀렉터 업데이트
            this._formatSelector.setValue(detectedFormat);
            state.set('formatId', detectedFormat);
            await this._render(content, detectedFormat);
          },
          // "선택한 형식으로 계속"
          async () => {
            await this._render(content, resolvedFormat);
          }
        );
        return; // 사용자 선택 대기
      }
    }

    await this._render(content, resolvedFormat);
  }

  /**
   * 실제 렌더링 실행
   */
  async _render(content, formatId) {
    if (!content || !formatId) return;

    // 이전 렌더러 정리
    this._currentRenderer?.destroy();
    this._currentRenderer = null;

    try {
      const renderer = RendererFactory.create(formatId, this._viewerEl);
      this._currentRenderer = renderer;

      await renderer.render(content);

      // isRendered만 업데이트. formatId는 FormatSelector/파일업로드만이 변경해야 함
      // (state.formatId를 덮어쓰면 'auto' 선택 후 다음 렌더 시 resolvedFormat이 사용됨)
      state.set('isRendered', true);
      eventBus.emit(EVENTS.RENDER_COMPLETE, { formatId, content });

      // PDF 페이지 정보 업데이트
      if (formatId === 'pdf' && renderer._totalPages > 0) {
        this._viewerPanel.showPdfPages(renderer._currentPage, renderer._totalPages);
      }

    } catch (err) {
      console.error('[App] 렌더링 오류:', err);
      eventBus.emit(EVENTS.RENDER_ERROR, { error: err });
      this._toast.show(`렌더링 실패: ${err.message}`, { type: 'error', duration: 6000 });
    }
  }
}

// ---- 앱 시작 ----
document.addEventListener('DOMContentLoaded', async () => {
  // PDF.js를 비동기로 미리 로드
  loadPdfJs();

  // 앱 초기화
  window.__app = new App();
});
