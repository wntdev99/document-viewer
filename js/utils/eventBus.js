/**
 * eventBus.js - Pub/Sub 컴포넌트 통신
 * 컴포넌트 간 직접 의존성 없이 이벤트로 통신합니다.
 */

class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  /**
   * 이벤트 구독
   * @param {string} event
   * @param {Function} handler
   * @returns {Function} unsubscribe 함수
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /**
   * 이벤트 구독 해제
   */
  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
  }

  /**
   * 이벤트 발행
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    this._listeners.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
    });
  }

  /**
   * 한 번만 실행되는 구독
   */
  once(event, handler) {
    const wrapper = (data) => {
      handler(data);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
}

export const eventBus = new EventBus();

// 앱 전역 이벤트 상수
export const EVENTS = {
  FILE_LOADED:        'file:loaded',       // { content, formatId, filename }
  FORMAT_CHANGED:     'format:changed',    // { formatId }
  RENDER_REQUESTED:   'render:requested',  // { content, formatId }
  RENDER_COMPLETE:    'render:complete',   // { formatId }
  RENDER_ERROR:       'render:error',      // { error }
  MISMATCH_DETECTED:  'mismatch:detected', // { declared, detected, content }
  THEME_CHANGED:      'theme:changed',     // { theme: 'light'|'dark' }
  ZOOM_CHANGED:       'zoom:changed',      // { level: number }
  PDF_PAGE_CHANGED:   'pdf:page_changed',  // { current, total }
  TOAST_SHOW:         'toast:show',        // { message, type, actions? }
};
