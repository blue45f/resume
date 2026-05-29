import { describe, expect, it } from 'vitest';
import { buildResumeHealthRadar } from './resumeHealthRadar';

describe('buildResumeHealthRadar', () => {
  it('returns 6 axes', () => {
    const r = buildResumeHealthRadar('백엔드 개발자입니다.');
    expect(r.axes.length).toBe(6);
    expect(r.axes.map((a) => a.key)).toEqual([
      'quantification',
      'actionVerbs',
      'specificity',
      'completeness',
      'contribution',
      'readability',
    ]);
  });

  it('clamps all scores to 0-100', () => {
    const r = buildResumeHealthRadar('다양한 경력과 프로젝트 경험이 있습니다.');
    for (const a of r.axes) {
      expect(a.score).toBeGreaterThanOrEqual(0);
      expect(a.score).toBeLessThanOrEqual(100);
    }
    expect(r.overall).toBeGreaterThanOrEqual(0);
    expect(r.overall).toBeLessThanOrEqual(100);
  });

  it('scores a rich resume higher than a bare one', () => {
    const bare = '안녕하세요. 잘 부탁드립니다.';
    const rich = [
      '경력 사항',
      '제가 결제 시스템을 단독으로 설계하고 구축했습니다.',
      '응답 시간을 40% 단축하고 月 매출 2억 원을 달성했습니다.',
      '학력: 서울대학교 컴퓨터공학과',
      '보유 기술: Java, Spring, AWS, Kubernetes',
    ].join('\n');
    expect(buildResumeHealthRadar(rich).overall).toBeGreaterThan(
      buildResumeHealthRadar(bare).overall,
    );
  });

  it('assigns a grade consistent with overall', () => {
    const r = buildResumeHealthRadar('일반적인 이력서 내용입니다.');
    const expected =
      r.overall >= 80 ? 'excellent' : r.overall >= 62 ? 'good' : r.overall >= 45 ? 'fair' : 'weak';
    expect(r.grade).toBe(expected);
  });

  it('identifies strength and weakness for substantial text', () => {
    const r = buildResumeHealthRadar(
      '제가 직접 결제 모듈을 개발하여 매출 30% 증가를 달성했습니다. 경력 사항과 학력을 정리했습니다.',
    );
    expect(r.topStrength).not.toBeNull();
    expect(r.topWeakness).not.toBeNull();
  });

  it('headline is non-empty', () => {
    const r = buildResumeHealthRadar('내용');
    expect(r.headline.length).toBeGreaterThan(5);
  });
});
