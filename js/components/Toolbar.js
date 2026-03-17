/**
 * Toolbar.js - 툴바 컴포넌트 (테마, 줌, 인쇄)
 */

import { eventBus, EVENTS } from '../utils/eventBus.js';
import { state } from '../state.js';
import { setText } from '../utils/domUtils.js';

const ZOOM_STEP = 10;
const ZOOM_MIN = 50;
const ZOOM_MAX = 500;

export class Toolbar {
  constructor() {
    this._themeToggle = document.getElementById('theme-toggle');
    this._zoomIn = document.getElementById('zoom-in');
    this._zoomOut = document.getElementById('zoom-out');
    this._zoomReset = document.getElementById('zoom-reset');
    this._zoomLevel = document.getElementById('zoom-level');
    this._printBtn = document.getElementById('print-btn');
    this._init();
  }

  _init() {
    // 테마 토글
    this._themeToggle?.addEventListener('click', () => this._toggleTheme());

    // 줌 컨트롤
    this._zoomIn?.addEventListener('click', () => this._setZoom(state.get('zoomLevel') + ZOOM_STEP));
    this._zoomOut?.addEventListener('click', () => this._setZoom(state.get('zoomLevel') - ZOOM_STEP));
    this._zoomReset?.addEventListener('click', () => this._setZoom(100));

    // 인쇄
    this._printBtn?.addEventListener('click', () => window.print());

    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') { e.preventDefault(); this._setZoom(state.get('zoomLevel') + ZOOM_STEP); }
        if (e.key === '-') { e.preventDefault(); this._setZoom(state.get('zoomLevel') - ZOOM_STEP); }
        if (e.key === '0') { e.preventDefault(); this._setZoom(100); }
      }
    });

    // 상태 구독
    state.subscribe('currentTheme', (theme) => this._applyTheme(theme));
    state.subscribe('zoomLevel', (level) => {
      setText(this._zoomLevel, `${level}%`);
      this._updateZoomBtns(level);
    });

    // 초기값 적용
    this._applyTheme(state.get('currentTheme'));
    setText(this._zoomLevel, `${state.get('zoomLevel')}%`);
  }

  _toggleTheme() {
    const current = state.get('currentTheme');
    const next = current === 'light' ? 'dark' : 'light';
    state.set('currentTheme', next);
    eventBus.emit(EVENTS.THEME_CHANGED, { theme: next });
  }

  _applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);

    // CSS 테마 파일 스왑
    const lightEl = document.getElementById('theme-light');
    const darkEl = document.getElementById('theme-dark');
    if (lightEl) lightEl.disabled = theme === 'dark';
    if (darkEl) darkEl.disabled = theme === 'light';

    // highlight.js 테마 스왑
    const hljsTheme = document.getElementById('hljs-theme');
    if (hljsTheme) {
      hljsTheme.href = theme === 'dark'
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
    }

    // 아이콘 스왑
    const sunIcon = this._themeToggle?.querySelector('.icon-sun');
    const moonIcon = this._themeToggle?.querySelector('.icon-moon');
    if (sunIcon) sunIcon.style.display = theme === 'dark' ? 'none' : 'block';
    if (moonIcon) moonIcon.style.display = theme === 'dark' ? 'block' : 'none';

    this._themeToggle?.setAttribute('title', theme === 'dark' ? '라이트 모드' : '다크 모드');

    // localStorage 저장
    try { localStorage.setItem('dv-theme', theme); } catch {}
  }

  _setZoom(level) {
    const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(level / ZOOM_STEP) * ZOOM_STEP));
    state.set('zoomLevel', clamped);
    eventBus.emit(EVENTS.ZOOM_CHANGED, { level: clamped });
  }

  _updateZoomBtns(level) {
    if (this._zoomIn) this._zoomIn.disabled = level >= ZOOM_MAX;
    if (this._zoomOut) this._zoomOut.disabled = level <= ZOOM_MIN;
  }

  loadSavedTheme() {
    try {
      const saved = localStorage.getItem('dv-theme');
      if (saved === 'dark' || saved === 'light') {
        state.set('currentTheme', saved);
      }
    } catch {}
  }
}
