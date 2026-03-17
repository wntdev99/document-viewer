/**
 * fileUtils.js - 파일 읽기, MIME 처리
 */

/**
 * 파일을 텍스트로 읽습니다.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error(`파일 읽기 실패: ${file.name}`));
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * 파일을 ArrayBuffer로 읽습니다 (바이너리 형식용).
 * @param {File} file
 * @returns {Promise<ArrayBuffer>}
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error(`파일 읽기 실패: ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 파일 크기를 사람이 읽기 좋은 형태로 변환합니다.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * 글자 수를 포맷합니다.
 * @param {string|ArrayBuffer} content
 * @returns {string}
 */
export function formatCharCount(content) {
  if (!content) return '0자';
  if (typeof content === 'string') {
    const count = content.length;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k자`;
    return `${count}자`;
  }
  if (content instanceof ArrayBuffer) {
    const bytes = content.byteLength;
    return formatFileSize(bytes);
  }
  return '0자';
}
