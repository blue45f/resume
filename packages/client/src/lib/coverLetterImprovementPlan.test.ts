import { describe, it, expect } from 'vitest'

import { buildCoverLetterImprovementPlan } from './coverLetterImprovementPlan'

const WEAK = '안녕하세요. 저는 부족하지만 열심히 하겠습니다. 잘 부탁드립니다.'

const STRONG = [
  '귀사의 사용자 중심 제품 철학에 깊이 공감하여 프론트엔드 개발자로 지원하게 되었습니다.',
  '저는 React와 TypeScript로 대형 서비스를 운영하며 직무 역량을 쌓아왔습니다.',
  '특히 결제 화면을 재설계해 전환율을 18% 높이고 응답 속도를 40% 단축한 구체적 경험이 있습니다.',
  '입사 후에는 디자인 시스템을 고도화하여 팀 전체의 개발 생산성을 끌어올리는 데 기여하겠습니다.',
  '함께 성장할 기회를 주신다면 최선을 다하겠습니다. 면접에서 더 자세히 말씀드리고 싶습니다.',
].join('\n\n')

describe('buildCoverLetterImprovementPlan', () => {
  it('약한 자소서는 개선 과제를 임팩트 순으로 반환한다', () => {
    const plan = buildCoverLetterImprovementPlan(WEAK)
    expect(plan.items.length).toBeGreaterThan(0)
    expect(plan.hasRoom).toBe(true)
    for (let i = 1; i < plan.items.length; i++) {
      expect(plan.items[i - 1].impact).toBeGreaterThanOrEqual(plan.items[i].impact)
    }
    expect(plan.items[0].impact).toBeGreaterThan(0)
    expect(plan.items[0].advice.length).toBeGreaterThan(0)
  })

  it('각 항목은 유효한 value·impact·severity·advice 를 가진다', () => {
    const plan = buildCoverLetterImprovementPlan(WEAK, 4)
    for (const item of plan.items) {
      expect(item.value).toBeGreaterThanOrEqual(0)
      expect(item.value).toBeLessThanOrEqual(100)
      expect(item.impact).toBeGreaterThanOrEqual(0)
      expect(['high', 'medium', 'low']).toContain(item.severity)
      expect(item.advice.length).toBeGreaterThan(0)
      if (item.impact >= 10) expect(item.severity).toBe('high')
      else if (item.impact >= 5) expect(item.severity).toBe('medium')
      else expect(item.severity).toBe('low')
    }
  })

  it('topN 으로 과제 수를 제한한다', () => {
    const plan = buildCoverLetterImprovementPlan(WEAK, 2)
    expect(plan.items.length).toBeLessThanOrEqual(2)
  })

  it('강한 자소서는 약한 자소서보다 종합 점수가 높다', () => {
    const weak = buildCoverLetterImprovementPlan(WEAK)
    const strong = buildCoverLetterImprovementPlan(STRONG)
    expect(strong.overall).toBeGreaterThan(weak.overall)
  })

  it('topAdvice 는 최상위 과제 축을 언급한다(개선 여지가 있을 때)', () => {
    const plan = buildCoverLetterImprovementPlan(WEAK)
    if (plan.hasRoom) {
      expect(plan.topAdvice).toContain(plan.items[0].axis)
      expect(plan.topAdvice).toMatch(/\+\d+점/)
    }
  })

  it('구성 축이 약하면 4대 블록 보강 조언을 준다', () => {
    const plan = buildCoverLetterImprovementPlan(WEAK, 4)
    const coverage = plan.items.find((i) => i.key === 'coverage')
    expect(coverage).toBeDefined()
    expect(coverage?.advice).toMatch(/블록|지원동기|핵심/)
  })
})
