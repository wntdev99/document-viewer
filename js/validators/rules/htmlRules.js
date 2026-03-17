/**
 * htmlRules.js - HTML 신호 점수화 규칙
 */

export const htmlRules = [
  // 즉시 판정 신호 (+5)
  { pattern: /<!DOCTYPE\s+html/i,       score: 5, desc: 'DOCTYPE 선언' },
  { pattern: /<html[\s>]/i,             score: 5, desc: '<html> 태그' },

  // 강한 신호 (+3)
  { pattern: /<head[\s>]/i,             score: 3, desc: '<head> 태그' },
  { pattern: /<body[\s>]/i,             score: 3, desc: '<body> 태그' },
  { pattern: /<div[\s>]/i,              score: 3, desc: '<div> 태그' },
  { pattern: /<(p|span|a|h[1-6])[\s>]/i, score: 3, desc: '일반 블록 태그' },
  { pattern: /<script[\s>]/i,           score: 3, desc: '<script> 태그' },
  { pattern: /<style[\s>]/i,            score: 3, desc: '<style> 태그' },

  // 중간 신호 (+2)
  { pattern: /<(img|br|hr|input)[\s/>]/i, score: 2, desc: '빈 요소 태그' },
  { pattern: /<\/[a-z][a-z0-9]*>/i,     score: 2, desc: '닫는 태그' },

  // 속성 신호 (+1)
  { pattern: /\sclass=["']/i,           score: 1, desc: 'class 속성' },
  { pattern: /\shref=["']/i,            score: 1, desc: 'href 속성' },
  { pattern: /\ssrc=["']/i,             score: 1, desc: 'src 속성' },
];

export const HTML_THRESHOLD = 5;
