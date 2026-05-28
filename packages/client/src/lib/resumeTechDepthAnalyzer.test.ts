import { describe, expect, it } from 'vitest';
import { analyzeResumeTechDepth } from './resumeTechDepthAnalyzer';

describe('analyzeResumeTechDepth', () => {
  it('returns none for empty text', () => {
    const r = analyzeResumeTechDepth('');
    expect(r.grade).toBe('none');
    expect(r.depthSignals.length).toBe(0);
  });

  it('detects scale_metric signal (TPS)', () => {
    const r = analyzeResumeTechDepth('초당 10,000 TPS 처리 가능한 시스템을 설계했습니다.');
    const signal = r.depthSignals.find((s) => s.type === 'scale_metric');
    expect(signal).toBeDefined();
  });

  it('detects architecture_decision signal', () => {
    const r = analyzeResumeTechDepth('모놀리식 한계 파악 후 MSA 전환 설계를 주도했습니다.');
    const signal = r.depthSignals.find((s) => s.type === 'architecture_decision');
    expect(signal).toBeDefined();
  });

  it('detects tradeoff_reasoning signal', () => {
    const r = analyzeResumeTechDepth(
      '성능 vs 일관성 트레이드오프 분석 후 최종 일관성을 선택했습니다.',
    );
    const signal = r.depthSignals.find((s) => s.type === 'tradeoff_reasoning');
    expect(signal).toBeDefined();
  });

  it('detects optimization_detail (N+1 query)', () => {
    const r = analyzeResumeTechDepth('N+1 쿼리 문제를 해결하여 응답 속도를 50% 개선했습니다.');
    const signal = r.depthSignals.find((s) => s.type === 'optimization_detail');
    expect(signal).toBeDefined();
  });

  it('detects debugging_depth (postmortem)', () => {
    const r = analyzeResumeTechDepth('프로덕션 이슈 원인 파악 후 포스트모템을 작성했습니다.');
    const signal = r.depthSignals.find((s) => s.type === 'debugging_depth');
    expect(signal).toBeDefined();
  });

  it('grades deep for rich depth signals', () => {
    const r = analyzeResumeTechDepth(
      '초당 5,000 TPS 처리. MSA 전환 설계. 장단점 분석 후 이벤트 드리븐 아키텍처 채택. N+1 쿼리 해결. p99 latency 100ms 이하 달성.',
    );
    expect(r.grade).toBe('deep');
  });

  it('detects surface signal from buzzword list', () => {
    const r = analyzeResumeTechDepth('기술 스택: Java / Spring / React / MySQL / Redis / Docker');
    const surface = r.surfaceSignals.find((s) => s.type === 'buzzword_list');
    expect(surface).toBeDefined();
  });

  it('grades surface when surface > depth', () => {
    const r = analyzeResumeTechDepth(
      '기술 스택: React / Vue / Angular / Node.js / Python. 능숙하게 활용 가능합니다.',
    );
    expect(r.grade).toBe('surface');
  });

  it('provides suggestions for missing depth types', () => {
    const r = analyzeResumeTechDepth('Spring Boot 백엔드 개발 3년 경력.');
    expect(r.suggestions.length).toBeGreaterThan(0);
  });

  it('summary is non-empty string', () => {
    const r = analyzeResumeTechDepth('일반적인 이력서 내용입니다.');
    expect(r.summary.length).toBeGreaterThan(10);
  });
});
