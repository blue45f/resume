import { describe, it, expect } from 'vitest'

import { analyzeCoverLetterJdResonance } from './coverLetterJdResonance'

describe('analyzeCoverLetterJdResonance', () => {
  it('JD에 가치 테마가 없으면 neutral·빈 테마를 반환한다', () => {
    const r = analyzeCoverLetterJdResonance('자기소개서 내용입니다.', '백엔드 개발자 모집')
    expect(r.themes).toHaveLength(0)
    expect(r.tone).toBe('neutral')
    expect(r.resonanceScore).toBe(0)
  })

  it('JD가 강조한 테마를 자소서가 모두 반영하면 good', () => {
    const jd = '자율적으로 주도하며 빠른 실행을 중시하고, 데이터 기반 의사결정을 합니다.'
    const cl =
      '저는 주도적으로 프로젝트를 이끌며 빠른 실행으로 결과를 냈고, 데이터를 분석해 의사결정을 개선했습니다.'
    const r = analyzeCoverLetterJdResonance(cl, jd)
    expect(r.tone).toBe('good')
    expect(r.resonanceScore).toBeGreaterThanOrEqual(70)
    expect(r.missingLabels.length).toBe(0)
  })

  it('JD 가치를 자소서가 전혀 반영하지 않으면 warning + 누락 테마 안내', () => {
    const jd = '고객 중심으로 협업하며 글로벌 시장을 개척할 분을 찾습니다.'
    const cl = '저는 알고리즘에 강하고 코딩을 좋아합니다.'
    const r = analyzeCoverLetterJdResonance(cl, jd)
    expect(r.tone).toBe('warning')
    expect(r.resonanceScore).toBeLessThan(40)
    expect(r.missingLabels.length).toBeGreaterThan(0)
    expect(r.suggestion).toMatch(/중시|추가|보강/)
  })

  it('JD 테마별로 resonant 여부와 근거를 제공한다', () => {
    const jd = '협업과 소통을 중시하며, 성장하고 싶은 분.'
    const cl = '팀과 협업하며 소통을 잘합니다.' // 성장은 빠짐
    const r = analyzeCoverLetterJdResonance(cl, jd)
    const collab = r.themes.find((t) => t.id === 'collaboration')
    const growth = r.themes.find((t) => t.id === 'growth')
    expect(collab?.resonant).toBe(true)
    expect(collab?.jdEvidence.length).toBeGreaterThan(0)
    expect(collab?.clEvidence).toBeTruthy()
    expect(growth?.resonant).toBe(false)
    expect(growth?.clEvidence).toBeNull()
    expect(r.resonantLabels).toContain('협업·소통')
    expect(r.missingLabels).toContain('성장·학습')
  })

  it('부분 반영은 neutral 톤과 보강 제안을 준다', () => {
    const jd = '자율, 성장, 협업, 고객 지향, 데이터 기반을 모두 중시합니다.'
    const cl = '저는 자율적으로 일하고 협업도 잘합니다.' // 5개 중 2개
    const r = analyzeCoverLetterJdResonance(cl, jd)
    expect(r.resonanceScore).toBeGreaterThanOrEqual(40)
    expect(r.resonanceScore).toBeLessThan(70)
    expect(r.tone).toBe('neutral')
    expect(r.missingLabels.length).toBeGreaterThan(0)
  })
})
