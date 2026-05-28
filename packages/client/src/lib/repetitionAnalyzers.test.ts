import { describe, expect, it } from 'vitest';
import {
  analyzeLexicalDiversity,
  analyzeRedundancy,
  detectRepeatedPhrases,
  detectDuplicateSentences,
} from './repetitionAnalyzers';

describe('analyzeLexicalDiversity', () => {
  it('returns medium with insufficient vocab message for short text', () => {
    const r = analyzeLexicalDiversity('짧은 글');
    expect(r.level).toBe('medium');
  });

  it('rates high diversity for varied vocabulary', () => {
    // 한글 2자+ 토큰 30개 이상 필요 → 충분히 긴 다양 어휘
    const text = `
      카카오 결제 시스템 설계 운영 백엔드 분산 트래픽 안정성 모니터링 알림 캐시 비동기 격리 트랜잭션
      배포 보안 인증 권한 검증 성능 최적화 코드 리뷰 협업 문서 데이터 모델 분석 도구 환경 자동화
      메시지 정책 흐름 모듈 분리 처리 추론 학습 보고
    `;
    const r = analyzeLexicalDiversity(text);
    expect(r.tokenCount).toBeGreaterThanOrEqual(30);
    expect(r.ttr).toBeGreaterThan(0.6);
    expect(r.level).toBe('high');
  });
});

describe('analyzeRedundancy', () => {
  it('returns no hits for varied text', () => {
    const r = analyzeRedundancy('정확하고 명료한 문장입니다.');
    expect(r.hits.length).toBe(0);
  });

  it('flags close repetition of same word', () => {
    // 정확히 같은 토큰("수행")이 가까운 거리에서 재등장해야 hit. /[가-힣]{2,}/g 기준
    const r = analyzeRedundancy('수행 수행 수행', 50);
    expect(r.hits.length).toBeGreaterThan(0);
  });
});

describe('detectRepeatedPhrases', () => {
  it('detects repeated 2-grams', () => {
    const r = detectRepeatedPhrases('기여하고 싶습니다. 기여하고 싶습니다.');
    expect(r.length).toBeGreaterThan(0);
  });

  it('returns empty for diverse text', () => {
    expect(detectRepeatedPhrases('완전히 서로 다른 표현으로 채워진 문장입니다.')).toEqual([]);
  });
});

describe('detectDuplicateSentences', () => {
  it('returns no duplicates for distinct sentences', () => {
    expect(detectDuplicateSentences('첫 문장입니다. 두 번째 문장입니다.')).toEqual([]);
  });

  it('flags duplicate sentences', () => {
    const r = detectDuplicateSentences(
      '카카오 결제팀에서 일했습니다. 카카오 결제팀에서 일했습니다.',
    );
    expect(r.length).toBeGreaterThan(0);
  });
});

describe('analyzeLexicalDiversity - TTR range', () => {
  it('ttr is between 0 and 1', () => {
    const text = '개발 개발 개발 서비스 서비스 운영 운영 배포 배포 배포 분석 분석 설계 설계 최적화';
    const r = analyzeLexicalDiversity(text);
    expect(r.ttr).toBeGreaterThanOrEqual(0);
    expect(r.ttr).toBeLessThanOrEqual(1);
  });
});

describe('analyzeRedundancy - suggestion', () => {
  it('provides non-empty suggestion for repetitive text', () => {
    const r = analyzeRedundancy('개발 개발 개발', 50);
    if (r.hits.length > 0) {
      expect(r.suggestion.length).toBeGreaterThan(5);
    }
  });
});
