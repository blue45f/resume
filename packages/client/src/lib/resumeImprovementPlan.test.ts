import { describe, it, expect } from 'vitest';
import { buildResumeImprovementPlan } from './resumeImprovementPlan';

const WEAK = '저는 열심히 일했습니다. 다양한 업무를 담당했고 여러 가지를 경험했습니다.';

const STRONG = [
  '자기소개: 5년차 백엔드 엔지니어로 결제 시스템을 주도적으로 설계·구축했습니다.',
  '경력: 네이버 페이 (2020.01 ~ 2024.12)',
  '성과: 결제 응답 시간을 40% 단축하고 운영 비용을 3천만원 절감했습니다.',
  '기술 스택: Kotlin, Spring, Kafka, Redis',
  '학력: 서울대학교 컴퓨터공학 (2014.03 ~ 2018.02)',
  '수상: 전사 해커톤 대상 수상, 정보처리기사 자격증 취득',
  '프로젝트: 정산 배치 시스템 구축으로 처리량 3배 증가',
  '스킬 (백엔드): Kotlin, Java, Spring Boot',
].join('\n');

describe('buildResumeImprovementPlan', () => {
  it('약한 이력서는 개선 과제를 임팩트 순으로 반환한다', () => {
    const plan = buildResumeImprovementPlan(WEAK);
    expect(plan.items.length).toBeGreaterThan(0);
    expect(plan.hasRoom).toBe(true);
    // 임팩트 내림차순 정렬 보장
    for (let i = 1; i < plan.items.length; i++) {
      expect(plan.items[i - 1].impact).toBeGreaterThanOrEqual(plan.items[i].impact);
    }
    // 최상위 과제는 구체 조언과 양의 임팩트를 가진다
    expect(plan.items[0].impact).toBeGreaterThan(0);
    expect(plan.items[0].advice.length).toBeGreaterThan(0);
  });

  it('각 항목은 유효한 value·impact·severity·advice 를 가진다', () => {
    const plan = buildResumeImprovementPlan(WEAK);
    for (const item of plan.items) {
      expect(item.value).toBeGreaterThanOrEqual(0);
      expect(item.value).toBeLessThanOrEqual(100);
      expect(item.impact).toBeGreaterThanOrEqual(0);
      expect(['high', 'medium', 'low']).toContain(item.severity);
      expect(item.advice.length).toBeGreaterThan(0);
    }
  });

  it('topN 으로 과제 수를 제한한다', () => {
    const plan = buildResumeImprovementPlan(WEAK, 2);
    expect(plan.items.length).toBeLessThanOrEqual(2);
  });

  it('강한 이력서는 약한 이력서보다 종합 점수가 높다', () => {
    const weak = buildResumeImprovementPlan(WEAK);
    const strong = buildResumeImprovementPlan(STRONG);
    expect(strong.overall).toBeGreaterThan(weak.overall);
  });

  it('topAdvice 는 최상위 과제 축을 언급한다(개선 여지가 있을 때)', () => {
    const plan = buildResumeImprovementPlan(WEAK);
    if (plan.hasRoom) {
      expect(plan.topAdvice).toContain(plan.items[0].axis);
      expect(plan.topAdvice).toMatch(/\+\d+점/);
    }
  });

  it('정량 지표가 약하면 수치 보강 조언을 준다', () => {
    // 숫자가 전혀 없는 이력서 → 정량 지표 축이 약함
    const plan = buildResumeImprovementPlan(WEAK, 5);
    const quant = plan.items.find((i) => i.axis === '정량 지표');
    expect(quant).toBeDefined();
    expect(quant?.advice).toMatch(/수치|숫자|%/);
  });

  it('severity 는 impact 임계값(10/5)을 따른다', () => {
    const plan = buildResumeImprovementPlan(WEAK, 5);
    for (const item of plan.items) {
      if (item.impact >= 10) expect(item.severity).toBe('high');
      else if (item.impact >= 5) expect(item.severity).toBe('medium');
      else expect(item.severity).toBe('low');
    }
  });
});
