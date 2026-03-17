/**
 * markdownRules.js - Markdown 신호 점수화 규칙
 */

export const markdownRules = [
  // 강력한 신호 (+4~+5)
  { pattern: /^#{1,6}\s+\S/m,           score: 4, desc: 'ATX 헤딩 (#)' },
  { pattern: /^```[\w\s]*\n[\s\S]*?^```/m, score: 4, desc: '펜스드 코드블록' },
  { pattern: /^---\s*$/m,               score: 3, desc: 'YAML front matter 또는 HR' },

  // 중간 신호 (+2~+3)
  { pattern: /\*\*[^*\n]+\*\*/,         score: 2, desc: '볼드 (**text**)' },
  { pattern: /\*[^*\n]+\*/,             score: 1, desc: '이탤릭 (*text*)' },
  { pattern: /\[.+?\]\(.+?\)/,          score: 3, desc: 'Markdown 링크 [text](url)' },
  { pattern: /!\[.*?\]\(.+?\)/,         score: 3, desc: 'Markdown 이미지 ![alt](url)' },
  { pattern: /^>\s+\S/m,                score: 2, desc: '인용 블록 (>)' },
  { pattern: /^[-*+]\s+\S/m,            score: 2, desc: '비순서 목록 (-, *, +)' },
  { pattern: /^\d+\.\s+\S/m,            score: 2, desc: '순서 목록 (1.)' },
  { pattern: /`[^`\n]+`/,               score: 1, desc: '인라인 코드 (`)' },
  { pattern: /^\|.+\|.+\|/m,            score: 3, desc: 'GFM 테이블 (|)' },
  { pattern: /^- \[[ x]\]/im,           score: 3, desc: 'GFM 체크박스' },
];

export const MARKDOWN_THRESHOLD = 5;
