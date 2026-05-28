import { describe, expect, it } from 'vitest';
import { buildJdCompensationReport, detectSalaryRange } from './jdCompensationSignals';

describe('detectSalaryRange', () => {
  it('finds Korean 만원 band', () => {
    expect(detectSalaryRange('연봉 4,500~6,500만원 (협의 가능)')).toContain('4,500');
  });

  it('finds USD k band', () => {
    expect(detectSalaryRange('Compensation: $120k - $160k')).toContain('120');
  });

  it('returns null when no numeric band present', () => {
    expect(detectSalaryRange('연봉은 면접 시 안내')).toBe(null);
  });
});

describe('buildJdCompensationReport', () => {
  it('returns warning when JD has no compensation mention at all', () => {
    const report = buildJdCompensationReport('백엔드 엔지니어 모집. 5년 이상 경력.');
    expect(report.transparencyScore).toBeLessThan(40);
    expect(report.tone).toBe('warning');
    expect(report.categories.find((c) => c.category === 'salary')?.present).toBe(false);
  });

  it('rewards explicit salary band + benefits + flexibility', () => {
    const report = buildJdCompensationReport(
      '연봉 4,500~6,500만원, 성과급 별도. 스톡옵션 부여. 4대보험, 식대 월 15만원, 도서 구입비 지원. 재택 근무 주 2회.',
    );
    expect(report.hasExplicitSalaryRange).toBe(true);
    expect(report.transparencyScore).toBeGreaterThanOrEqual(85);
    expect(report.tone).toBe('good');
  });

  it('flags hedged salary mention without numeric band', () => {
    const report = buildJdCompensationReport(
      '연봉은 면접 시 안내합니다. 4대보험, 식대 지원. 재택 가능.',
    );
    expect(report.hasExplicitSalaryRange).toBe(false);
    expect(report.tone).toBe('warning');
    expect(report.summary).toMatch(/협의|면접/);
  });

  it('captures category excerpts', () => {
    const report = buildJdCompensationReport(
      '연봉 5천만원 이상. 스톡옵션 부여. 4대보험. 원격 근무.',
    );
    expect(report.categories.find((c) => c.category === 'equity')?.present).toBe(true);
    expect(report.categories.find((c) => c.category === 'benefits')?.present).toBe(true);
    expect(report.categories.find((c) => c.category === 'flexibility')?.present).toBe(true);
  });

  it('caps the score at 100', () => {
    const text = `연봉 5,000~7,500만원. 성과급, 인센티브, 보너스 별도.
    스톡옵션 (RSU) 지급. 4대보험, 식대, 교통비, 자기계발비, 도서 구입비, 건강검진, 경조사비, 학자금.
    재택 근무 + 하이브리드 + 유연근무 + 워케이션 가능.`;
    const report = buildJdCompensationReport(text);
    expect(report.transparencyScore).toBeLessThanOrEqual(100);
  });
});
