/**
 * BaseRenderer.js - 추상 렌더러 기반 클래스
 * 모든 렌더러는 이 클래스를 상속해야 합니다.
 */

export class BaseRenderer {
  /**
   * @param {HTMLElement} container - 렌더링 결과를 삽입할 컨테이너
   */
  constructor(container) {
    if (new.target === BaseRenderer) {
      throw new Error('BaseRenderer는 직접 인스턴스화할 수 없습니다.');
    }
    this.container = container;
  }

  /**
   * 렌더링 실행 (서브클래스에서 반드시 구현)
   * @param {string|ArrayBuffer} content
   * @returns {Promise<void>}
   */
  async render(content) {
    throw new Error(`render() 미구현: ${this.constructor.name}`);
  }

  /**
   * 렌더러 정리 (필요 시 서브클래스에서 오버라이드)
   */
  destroy() {}

  /**
   * 컨테이너를 비웁니다.
   */
  clear() {
    this.container.innerHTML = '';
  }

  /**
   * 로딩 스피너를 표시합니다.
   */
  showLoading() {
    this.container.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:center;height:200px;">
        <div class="spinner"></div>
      </div>
    `;
  }
}

/**
 * RendererFactory - 형식 ID에 맞는 렌더러를 생성합니다.
 */
export class RendererFactory {
  static _registry = new Map();

  static register(formatId, RendererClass) {
    RendererFactory._registry.set(formatId, RendererClass);
  }

  /**
   * @param {string} formatId
   * @param {HTMLElement} container
   * @returns {BaseRenderer}
   */
  static create(formatId, container) {
    const RendererClass = RendererFactory._registry.get(formatId);
    if (!RendererClass) {
      throw new Error(`지원하지 않는 형식: ${formatId}`);
    }
    return new RendererClass(container);
  }

  static has(formatId) {
    return RendererFactory._registry.has(formatId);
  }
}
