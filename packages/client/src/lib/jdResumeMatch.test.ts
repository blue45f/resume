import { describe, expect, it } from 'vitest';
import { buildJdResumeMatchReport } from './jdResumeMatch';

const SAMPLE_JD = `
자격요건
- Java 또는 Kotlin 3년 이상 경력
- Spring Boot 기반 REST API 개발 경험
- MySQL 또는 PostgreSQL 실무 경험

우대사항
- AWS 클라우드 인프라 경험
- 마이크로서비스 아키텍처(MSA) 경험
`;

const MATCHING_RESUME = `
5년간 Java/Kotlin 백엔드 개발. Spring Boot 기반 REST API 설계 및 구현.
MySQL 및 PostgreSQL 운영 경험. AWS EC2, RDS 운영. MSA 전환 프로젝트 리드.
`;

const WEAK_RESUME = `
프론트엔드 개발자. React, TypeScript 사용. UI 컴포넌트 개발.
`;

describe('buildJdResumeMatchReport', () => {
  it('returns warning on empty inputs', () => {
    const r = buildJdResumeMatchReport('', '');
    expect(r.matchScore).toBe(0);
    expect(r.tone).toBe('warning');
  });

  it('has high score for matching resume', () => {
    const r = buildJdResumeMatchReport(SAMPLE_JD, MATCHING_RESUME);
    expect(r.matchScore).toBeGreaterThan(50);
    expect(r.tone).not.toBe('warning');
  });

  it('has lower score for weak resume', () => {
    const r = buildJdResumeMatchReport(SAMPLE_JD, WEAK_RESUME);
    const matchingScore = buildJdResumeMatchReport(SAMPLE_JD, MATCHING_RESUME).matchScore;
    expect(r.matchScore).toBeLessThan(matchingScore);
  });

  it('identifies gaps in weak resume', () => {
    const r = buildJdResumeMatchReport(SAMPLE_JD, WEAK_RESUME);
    expect(r.gaps.length).toBeGreaterThan(0);
  });

  it('returns coverage items for all requirements', () => {
    const r = buildJdResumeMatchReport(SAMPLE_JD, MATCHING_RESUME);
    expect(r.coverageItems.length).toBeGreaterThan(0);
    expect(r.requiredCoverage.length).toBeGreaterThan(0);
    expect(r.preferredCoverage.length).toBeGreaterThan(0);
  });

  it('marks required items as type required', () => {
    const r = buildJdResumeMatchReport(SAMPLE_JD, MATCHING_RESUME);
    expect(r.requiredCoverage.every((c) => c.requirement.type === 'required')).toBe(true);
  });

  it('marks preferred items as type preferred', () => {
    const r = buildJdResumeMatchReport(SAMPLE_JD, MATCHING_RESUME);
    expect(r.preferredCoverage.every((c) => c.requirement.type === 'preferred')).toBe(true);
  });

  it('provides a non-empty summary', () => {
    const r = buildJdResumeMatchReport(SAMPLE_JD, MATCHING_RESUME);
    expect(r.summary.length).toBeGreaterThan(10);
  });

  it('matchScore is between 0 and 100', () => {
    const r = buildJdResumeMatchReport(SAMPLE_JD, MATCHING_RESUME);
    expect(r.matchScore).toBeGreaterThanOrEqual(0);
    expect(r.matchScore).toBeLessThanOrEqual(100);
  });

  it('label includes matchScore', () => {
    const r = buildJdResumeMatchReport(SAMPLE_JD, MATCHING_RESUME);
    expect(r.label).toContain(String(r.matchScore));
  });
});
