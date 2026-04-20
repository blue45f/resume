import { describe, expect, it } from 'vitest';
import { detectCareerGaps, scoreInterviewability } from './derivedScores';
import { calculateOverallHealth } from './koreanChecker';

const sampleResumeText = `
이력서 제목: 백엔드 개발자
자기소개: 7년차 백엔드 개발자로서 대규모 트래픽 서비스 설계·운영 경험.
경력: 카카오 · 시니어 엔지니어 · 2020.01 ~ 2022.12
결제 플랫폼 리팩토링을 주도하여 응답시간을 30% 단축하고 장애율을 50% 감소시켰습니다.
경력: 네이버 · 백엔드 개발자 · 2016.03 ~ 2019.12
추천 시스템 개발을 담당했고 일 사용자 100만명 기반 API 를 설계·구축했습니다.
스킬 (Backend): Java, Kotlin, Spring, JPA, Kafka
`.trim();

describe('calculateOverallHealth', () => {
  it('returns 3-axis score + tier for sufficiently long text', () => {
    const r = calculateOverallHealth(sampleResumeText);
    expect(r.health).toBeGreaterThanOrEqual(0);
    expect(r.health).toBeLessThanOrEqual(100);
    expect(['excellent', 'good', 'fair', 'poor']).toContain(r.tier);
    expect(r.quality).toBeGreaterThanOrEqual(0);
    expect(r.completeness).toBeGreaterThanOrEqual(0);
    expect(r.interviewability).toBeGreaterThanOrEqual(0);
  });
});

describe('detectCareerGaps', () => {
  it('detects gap between two experience periods', () => {
    const text = `
      경력: A사 · 2018.01 ~ 2019.06
      경력: B사 · 2021.01 ~ 2022.12
    `;
    const r = detectCareerGaps(text);
    expect(r.gaps.length).toBeGreaterThanOrEqual(1);
    expect(r.totalGapMonths).toBeGreaterThan(6);
  });

  it('reports no gaps when ranges are adjacent', () => {
    const text = `
      경력: A사 · 2019.01 ~ 2020.12
      경력: B사 · 2021.01 ~ 2022.12
    `;
    const r = detectCareerGaps(text);
    expect(r.gaps.length).toBe(0);
  });
});

describe('scoreInterviewability', () => {
  it('yields an overall 0-100 and 5-axis breakdown', () => {
    const iv = scoreInterviewability(sampleResumeText);
    expect(iv.overall).toBeGreaterThanOrEqual(0);
    expect(iv.overall).toBeLessThanOrEqual(100);
    expect(iv.breakdown).toHaveLength(5);
    expect(['call-back', 'promising', 'needs-work', 'below-bar']).toContain(iv.tier);
  });
});
