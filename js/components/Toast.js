/**
 * Toast.js - 알림 토스트 컴포넌트
 */

export class Toast {
  constructor(containerId = 'toast-container') {
    this._container = document.getElementById(containerId);
    this._queue = [];
  }

  /**
   * 일반 메시지 토스트를 표시합니다.
   * @param {string} message
   * @param {Object} options
   */
  show(message, options = {}) {
    const {
      type = 'info',   // 'info' | 'success' | 'warning' | 'error'
      duration = 4000, // 0이면 자동 닫기 없음
      actions = [],    // [{ label, primary, onClick }]
    } = options;

    const el = this._createToastEl(message, type, actions);
    this._container.appendChild(el);

    if (duration > 0) {
      setTimeout(() => this._dismiss(el), duration);
    }

    return () => this._dismiss(el);
  }

  /**
   * 형식 불일치 경고 토스트를 표시합니다.
   * @param {string} declared - 사용자가 선택한 형식
   * @param {string} detected - 자동 감지된 형식
   * @param {Function} onSwitch - "감지 형식으로 전환" 선택 시 콜백
   * @param {Function} onIgnore - "무시" 선택 시 콜백
   */
  showMismatch(declared, detected, onSwitch, onIgnore) {
    const formatLabels = {
      markdown: 'Markdown',
      html: 'HTML',
      text: 'Plain Text',
      mermaid: 'Mermaid',
    };

    const detectedLabel = formatLabels[detected] || detected;
    const declaredLabel = formatLabels[declared] || declared;

    const message = `⚠️ <strong>${detectedLabel}</strong> 형식이 감지되었습니다. 현재 선택: <strong>${declaredLabel}</strong>`;

    const actions = [
      {
        label: `${detectedLabel}으로 렌더링`,
        primary: true,
        onClick: (dismiss) => { dismiss(); onSwitch?.(detected); },
      },
      {
        label: `${declaredLabel}으로 계속`,
        primary: false,
        onClick: (dismiss) => { dismiss(); onIgnore?.(); },
      },
    ];

    return this.show(message, { type: 'warning', duration: 0, actions });
  }

  _createToastEl(message, type, actions) {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', 'alert');

    const msgEl = document.createElement('div');
    msgEl.className = 'toast__message';
    msgEl.innerHTML = message;
    el.appendChild(msgEl);

    if (actions.length > 0) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'toast__actions';

      const dismiss = () => this._dismiss(el);

      actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'toast__action' + (action.primary ? ' toast__action--primary' : '');
        btn.textContent = action.label;
        btn.addEventListener('click', () => action.onClick(dismiss));
        actionsEl.appendChild(btn);
      });

      el.appendChild(actionsEl);
    }

    return el;
  }

  _dismiss(el) {
    if (!el || el.classList.contains('is-leaving')) return;
    el.classList.add('is-leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    // 애니메이션 없이 즉시 제거되는 경우 대비
    setTimeout(() => el.remove(), 400);
  }

  dismissAll() {
    this._container.querySelectorAll('.toast').forEach(el => this._dismiss(el));
  }
}
