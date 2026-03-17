/**
 * FormatValidator.js - 신호 점수화 기반 형식 감지 및 불일치 검증
 */

import { markdownRules, MARKDOWN_THRESHOLD } from './rules/markdownRules.js';
import { htmlRules, HTML_THRESHOLD } from './rules/htmlRules.js';
import { mermaidRules, MERMAID_THRESHOLD } from './rules/mermaidRules.js';

const DETECTORS = [
  {
    id: 'html',
    rules: htmlRules,
    threshold: HTML_THRESHOLD,
    // HTML은 강한 신호가 하나라도 있으면 즉시 판정
    earlyExit: (rules, text) => {
      const strong = rules.filter(r => r.score >= 5);
      return strong.some(r => r.pattern.test(text));
    },
  },
  {
    id: 'mermaid',
    rules: mermaidRules,
    threshold: MERMAID_THRESHOLD,
    earlyExit: null,
  },
  {
    id: 'markdown',
    rules: markdownRules,
    threshold: MARKDOWN_THRESHOLD,
    earlyExit: null,
  },
];

export class FormatValidator {
  /**
   * 텍스트에서 형식을 자동 감지합니다.
   * @param {string} text
   * @returns {{ formatId: string|null, confidence: number, scores: Object }}
   */
  static detect(text) {
    if (!text || typeof text !== 'string') {
      return { formatId: null, confidence: 0, scores: {} };
    }

    const sampleText = text.slice(0, 10000); // 앞 10KB만 분석
    const scores = {};

    for (const detector of DETECTORS) {
      // earlyExit 체크
      if (detector.earlyExit?.(detector.rules, sampleText)) {
        scores[detector.id] = 999; // 즉시 판정
        break;
      }

      // 점수 합산
      let total = 0;
      for (const rule of detector.rules) {
        if (rule.pattern.test(sampleText)) {
          total += rule.score;
        }
      }
      scores[detector.id] = total;
    }

    // 최고 점수 형식 선택
    const entries = Object.entries(scores);
    const [bestId, bestScore] = entries.reduce(
      ([maxId, maxScore], [id, score]) =>
        score > maxScore ? [id, score] : [maxId, maxScore],
      [null, -1]
    );

    // 임계값 확인
    const detector = DETECTORS.find(d => d.id === bestId);
    const threshold = detector?.threshold ?? 5;
    const passed = bestScore >= threshold;

    return {
      formatId: passed ? bestId : null,
      confidence: bestScore,
      scores,
    };
  }

  /**
   * 선언 형식과 감지 형식이 불일치하는지 확인합니다.
   * @param {string} declared - 사용자가 선택한 형식 ('auto' 포함)
   * @param {string} text
   * @returns {{ mismatch: boolean, detected: string|null, confidence: number }}
   */
  static checkMismatch(declared, text) {
    // 'auto'이거나 바이너리 형식이면 불일치 검사 불필요
    if (!declared || declared === 'auto' || declared === 'docx' || declared === 'pdf') {
      return { mismatch: false, detected: null, confidence: 0 };
    }

    const { formatId: detected, confidence } = FormatValidator.detect(text);

    if (!detected) {
      return { mismatch: false, detected: null, confidence };
    }

    // 같으면 불일치 없음
    if (detected === declared) {
      return { mismatch: false, detected, confidence };
    }

    // 신뢰도 임계값 (너무 낮은 신뢰도는 경고 안 함)
    const CONFIDENCE_MIN = 3;
    if (confidence < CONFIDENCE_MIN) {
      return { mismatch: false, detected, confidence };
    }

    return { mismatch: true, detected, confidence };
  }

  /**
   * 'auto' 선택 시 자동으로 형식을 결정합니다.
   * @param {string} text
   * @param {string|null} fileFormatId - 파일 확장자로 감지된 형식 (우선)
   * @returns {string} formatId (기본값: 'text')
   */
  static resolveAuto(text, fileFormatId = null) {
    if (fileFormatId && fileFormatId !== 'auto') return fileFormatId;
    const { formatId } = FormatValidator.detect(text);
    return formatId || 'text';
  }
}
