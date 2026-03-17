/**
 * formats.js - 지원 형식 레지스트리 (단일 진실 소스)
 * 새 형식 추가 시 이 파일만 수정하면 됩니다 (OCP 원칙).
 */

export const FORMAT_REGISTRY = {
  markdown: {
    id: 'markdown',
    label: 'Markdown',
    extensions: ['.md', '.markdown'],
    mimeTypes: ['text/markdown', 'text/x-markdown'],
    binaryFormat: false,
    rendererClass: 'MarkdownRenderer',
    validatorRules: 'markdownRules',
    icon: 'M',
  },
  html: {
    id: 'html',
    label: 'HTML',
    extensions: ['.html', '.htm'],
    mimeTypes: ['text/html'],
    binaryFormat: false,
    rendererClass: 'HtmlRenderer',
    validatorRules: 'htmlRules',
    icon: 'H',
  },
  docx: {
    id: 'docx',
    label: 'DOCX',
    extensions: ['.docx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    binaryFormat: true,       // ArrayBuffer로 읽어야 함
    rendererClass: 'DocxRenderer',
    validatorRules: null,      // 바이너리 형식 - 텍스트 감지 불필요
    icon: 'W',
  },
  pdf: {
    id: 'pdf',
    label: 'PDF',
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    binaryFormat: true,
    rendererClass: 'PdfRenderer',
    validatorRules: null,
    icon: 'P',
  },
  text: {
    id: 'text',
    label: 'Plain Text',
    extensions: ['.txt', '.text'],
    mimeTypes: ['text/plain'],
    binaryFormat: false,
    rendererClass: 'TextRenderer',
    validatorRules: null,
    icon: 'T',
  },
  mermaid: {
    id: 'mermaid',
    label: 'Mermaid Diagram',
    extensions: ['.mmd'],
    mimeTypes: ['text/x-mermaid'],
    binaryFormat: false,
    rendererClass: 'MermaidRenderer',
    validatorRules: 'mermaidRules',
    icon: 'D',
  },
};

/**
 * 파일 확장자로 형식을 감지합니다.
 * @param {string} filename
 * @returns {string|null} format id or null
 */
export function detectFormatByExtension(filename) {
  if (!filename) return null;
  const ext = '.' + filename.split('.').pop().toLowerCase();
  for (const [id, fmt] of Object.entries(FORMAT_REGISTRY)) {
    if (fmt.extensions.includes(ext)) return id;
  }
  return null;
}

/**
 * MIME 타입으로 형식을 감지합니다.
 * @param {string} mimeType
 * @returns {string|null} format id or null
 */
export function detectFormatByMime(mimeType) {
  if (!mimeType) return null;
  const mime = mimeType.split(';')[0].trim().toLowerCase();
  for (const [id, fmt] of Object.entries(FORMAT_REGISTRY)) {
    if (fmt.mimeTypes.includes(mime)) return id;
  }
  return null;
}

/**
 * 텍스트 기반 형식 목록 (붙여넣기 시 선택 가능)
 */
export const TEXT_FORMATS = Object.values(FORMAT_REGISTRY)
  .filter(f => !f.binaryFormat)
  .map(f => ({ id: f.id, label: f.label }));
