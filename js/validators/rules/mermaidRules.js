/**
 * mermaidRules.js - Mermaid 신호 점수화 규칙
 */

export const mermaidRules = [
  // 다이어그램 선언 키워드 (즉시 판정 수준)
  { pattern: /^graph\s+(TD|TB|BT|RL|LR)\b/im,  score: 5, desc: 'graph 방향 선언' },
  { pattern: /^flowchart\s+(TD|TB|BT|RL|LR)\b/im, score: 5, desc: 'flowchart 방향 선언' },
  { pattern: /^sequenceDiagram\b/im,            score: 5, desc: 'sequenceDiagram 선언' },
  { pattern: /^classDiagram\b/im,               score: 5, desc: 'classDiagram 선언' },
  { pattern: /^stateDiagram(-v2)?\b/im,         score: 5, desc: 'stateDiagram 선언' },
  { pattern: /^gantt\b/im,                      score: 5, desc: 'gantt 선언' },
  { pattern: /^erDiagram\b/im,                  score: 5, desc: 'erDiagram 선언' },
  { pattern: /^journey\b/im,                    score: 5, desc: 'journey 선언' },
  { pattern: /^pie\b/im,                        score: 4, desc: 'pie 선언' },
  { pattern: /^mindmap\b/im,                    score: 5, desc: 'mindmap 선언' },
  { pattern: /^timeline\b/im,                   score: 5, desc: 'timeline 선언' },
  { pattern: /^gitGraph\b/im,                   score: 5, desc: 'gitGraph 선언' },
  { pattern: /^quadrantChart\b/im,              score: 5, desc: 'quadrantChart 선언' },
  { pattern: /^xychart-beta\b/im,               score: 5, desc: 'xychart 선언' },

  // 연결 구문 신호 (+2)
  { pattern: /-->/,                             score: 2, desc: '--> 화살표' },
  { pattern: /---/,                             score: 1, desc: '--- 연결선' },
  { pattern: /participant\s+\w+/i,              score: 2, desc: 'participant 선언' },
];

export const MERMAID_THRESHOLD = 5;
