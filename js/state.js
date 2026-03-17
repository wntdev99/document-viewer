/**
 * state.js - Observer 패턴 기반 상태 관리
 */

import { eventBus, EVENTS } from './utils/eventBus.js';

const initialState = {
  formatId: 'auto',       // 선택된 형식 (또는 'auto')
  content: null,          // 현재 문서 내용 (string | ArrayBuffer)
  filename: null,         // 파일명
  isRendered: false,      // 렌더링 완료 여부
  currentTheme: 'light',  // 현재 테마
  zoomLevel: 100,         // 줌 레벨 (%)
  pdfTotalPages: 0,       // PDF 전체 페이지 수
  pdfCurrentPage: 1,      // PDF 현재 페이지
  statusFormat: null,     // 상태바 형식 표시
};

class AppState {
  constructor() {
    this._state = { ...initialState };
    this._subscribers = new Map();
  }

  get(key) {
    return this._state[key];
  }

  getAll() {
    return { ...this._state };
  }

  set(key, value) {
    const prev = this._state[key];
    if (prev === value) return;
    this._state[key] = value;
    this._notify(key, value, prev);
  }

  patch(updates) {
    const changed = {};
    for (const [key, value] of Object.entries(updates)) {
      if (this._state[key] !== value) {
        changed[key] = { prev: this._state[key], next: value };
        this._state[key] = value;
      }
    }
    for (const [key, { next, prev }] of Object.entries(changed)) {
      this._notify(key, next, prev);
    }
  }

  subscribe(key, handler) {
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, new Set());
    }
    this._subscribers.get(key).add(handler);
    return () => this._subscribers.get(key)?.delete(handler);
  }

  _notify(key, value, prev) {
    this._subscribers.get(key)?.forEach(handler => {
      try { handler(value, prev); }
      catch (err) { console.error(`[State] Error in subscriber for "${key}":`, err); }
    });
    this._subscribers.get('*')?.forEach(handler => {
      try { handler({ key, value, prev }); }
      catch (err) { console.error(`[State] Error in wildcard subscriber:`, err); }
    });
  }

  reset() {
    this._state = { ...initialState };
  }
}

export const state = new AppState();
