/**
 * domUtils.js - DOM 유틸리티
 */

/**
 * 요소를 표시합니다.
 */
export function show(el) {
  if (el) el.hidden = false;
}

/**
 * 요소를 숨깁니다.
 */
export function hide(el) {
  if (el) el.hidden = true;
}

/**
 * 요소를 토글합니다.
 */
export function toggle(el, force) {
  if (el) el.hidden = force !== undefined ? !force : !el.hidden;
}

/**
 * 요소에 클래스를 안전하게 추가/제거합니다.
 */
export function setClass(el, className, add = true) {
  if (!el) return;
  if (add) el.classList.add(className);
  else el.classList.remove(className);
}

/**
 * 요소의 텍스트를 안전하게 설정합니다.
 */
export function setText(el, text) {
  if (el) el.textContent = text;
}

/**
 * 이벤트 리스너를 한 번에 여러 요소에 등록합니다.
 */
export function addListeners(elements, event, handler) {
  elements.forEach(el => el?.addEventListener(event, handler));
}

/**
 * 요소가 뷰포트 내에 있는지 확인합니다.
 */
export function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  return rect.top >= 0 && rect.bottom <= window.innerHeight;
}

/**
 * HTML 문자열을 안전하게 이스케이프합니다.
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
