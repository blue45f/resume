import { describe, expect, it } from 'vitest';
import { buildInterviewStrategyReport } from './jdInterviewStrategy';

describe('buildInterviewStrategyReport', () => {
  it('returns fallback behavior + culture-fit for empty JD', () => {
    const r = buildInterviewStrategyReport('');
    expect(r.formats.length).toBeGreaterThan(0);
    expect(r.prepAreas.length).toBeGreaterThan(0);
  });

  it('includes coding-challenge for backend roles', () => {
    const r = buildInterviewStrategyReport('백엔드 개발자, Spring + MySQL 경험');
    expect(r.formats).toContain('coding-challenge');
  });

  it('includes system-design for senior backend role', () => {
    const r = buildInterviewStrategyReport('시니어 백엔드 개발자, 5년 이상, MSA 경험');
    expect(r.formats).toContain('system-design');
  });

  it('includes behavioral for bigtech companies', () => {
    const r = buildInterviewStrategyReport('네이버 클라우드 플랫폼 시니어 개발자');
    expect(r.formats).toContain('behavioral');
  });

  it('includes culture-fit for startup', () => {
    const r = buildInterviewStrategyReport('Series A 스타트업, 우리 팀과 함께 성장할 개발자');
    expect(r.formats).toContain('culture-fit');
  });

  it('includes case-study for data roles', () => {
    const r = buildInterviewStrategyReport('데이터 사이언티스트, ML 파이프라인 경험');
    expect(r.formats).toContain('case-study');
  });

  it('prepares more weeks for lead roles', () => {
    const r1 = buildInterviewStrategyReport('팀장급 엔지니어링 리드');
    const r2 = buildInterviewStrategyReport('신입 개발자 0~2년');
    expect(r1.prepWeeks).toBeGreaterThan(r2.prepWeeks);
  });

  it('high priority area for algorithm prep in junior backend', () => {
    const r = buildInterviewStrategyReport('신입 백엔드 개발자, Spring 사용, 0~2년');
    const algoArea = r.prepAreas.find((a) => a.area === '알고리즘·자료구조');
    expect(algoArea?.priority).toBe('high');
  });

  it('includes startup culture area for startup JD', () => {
    const r = buildInterviewStrategyReport('스타트업 프론트엔드 개발자, react 경험 필요');
    const cultureArea = r.prepAreas.find((a) => a.area === '회사·서비스 이해도');
    expect(cultureArea).toBeDefined();
  });

  it('report has summary and label', () => {
    const r = buildInterviewStrategyReport('시니어 프론트엔드, 카카오 채용');
    expect(r.summary.length).toBeGreaterThan(20);
    expect(r.label.length).toBeGreaterThan(5);
  });

  it('formats are limited to 5', () => {
    const r = buildInterviewStrategyReport('시니어 백엔드 리드, 네이버, 시스템 설계, Spring + K8s');
    expect(r.formats.length).toBeLessThanOrEqual(5);
  });
});
