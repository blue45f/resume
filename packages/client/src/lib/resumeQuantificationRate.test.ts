import { describe, expect, it } from 'vitest';
import { buildQuantReport } from './resumeQuantificationRate';

describe('buildQuantReport', () => {
  it('returns score 0 for empty input', () => {
    const r = buildQuantReport('');
    expect(r.score).toBe(0);
    expect(r.bullets).toHaveLength(0);
    expect(r.tone).toBe('warning');
  });

  it('detects percentage quantification', () => {
    const text = `React를 도입하여 초기 로딩 속도를 40% 단축하였습니다.\n`;
    const r = buildQuantReport(text);
    expect(r.quantifiedCount).toBeGreaterThanOrEqual(1);
    expect(r.bullets.find((b) => b.quantified)?.match).toMatch(/%/);
  });

  it('detects Korean monetary value (억원)', () => {
    const text = `신규 고객 유치로 연간 매출 3억원을 달성하였습니다.\n`;
    const r = buildQuantReport(text);
    expect(r.quantifiedCount).toBeGreaterThanOrEqual(1);
    expect(r.bullets[0]?.match).toMatch(/억/);
  });

  it('detects 배 multiplier', () => {
    const text = `캐시 적용으로 API 응답 속도를 5배 향상시켰습니다.\n`;
    const r = buildQuantReport(text);
    expect(r.quantifiedCount).toBeGreaterThanOrEqual(1);
  });

  it('detects headcount (명)', () => {
    const text = `30명 규모의 TF를 리드하며 프로젝트를 완수하였습니다.\n`;
    const r = buildQuantReport(text);
    expect(r.quantifiedCount).toBeGreaterThanOrEqual(1);
  });

  it('marks bullets without numbers as unquantified', () => {
    const text = `팀원들과 협력하여 서비스 안정성을 개선하였습니다.\n`;
    const r = buildQuantReport(text);
    expect(r.quantifiedCount).toBe(0);
    expect(r.suggestions).toHaveLength(1);
    expect(r.suggestions[0]).toContain('협력');
  });

  it('gives good tone when >= 60% quantified', () => {
    const lines = [
      '매출을 30% 증가시켰습니다.',
      '팀원 20명을 리드하였습니다.',
      '서비스 응답 속도를 2배 줄였습니다.',
      '신규 기능을 출시하였습니다.',
    ].join('\n');
    const r = buildQuantReport(lines);
    expect(r.tone).toBe('good');
    expect(r.score).toBeGreaterThanOrEqual(60);
  });

  it('gives warning tone when < 35% quantified', () => {
    const lines = [
      '팀원들과 협력하여 서비스를 개선하였습니다.',
      '고객 불만을 처리하고 피드백을 수집하였습니다.',
      '시스템 운영 및 유지보수를 담당하였습니다.',
      '매출을 50% 달성하였습니다.',
    ].join('\n');
    const r = buildQuantReport(lines);
    expect(r.tone).toBe('warning');
  });

  it('rate is between 0 and 1', () => {
    const text = `매출을 20% 증가시켰습니다.\n팀과 협력하였습니다.\n비용을 절감하였습니다.\n`;
    const r = buildQuantReport(text);
    expect(r.rate).toBeGreaterThanOrEqual(0);
    expect(r.rate).toBeLessThanOrEqual(1);
  });

  it('does not count 4-digit years as quantification', () => {
    const text = `2023년부터 서비스를 운영하며 안정성을 높였습니다.\n`;
    const r = buildQuantReport(text);
    // Year mention alone should not count as a quantified metric
    expect(r.quantifiedCount).toBe(0);
  });

  it('suggestions are capped at 5', () => {
    const lines = Array.from(
      { length: 10 },
      (_, i) => `팀과 협력하여 업무를 수행하였습니다 - 항목 ${i}.`,
    ).join('\n');
    const r = buildQuantReport(lines);
    expect(r.suggestions.length).toBeLessThanOrEqual(5);
  });
});
