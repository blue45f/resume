import { describe, expect, it } from 'vitest'

import { checkCareerNarrative } from './resumeCareerNarrativeChecker'

describe('checkCareerNarrative', () => {
  it('returns coherent for empty text', () => {
    const r = checkCareerNarrative('')
    expect(r.cohesion).toBe('coherent')
    expect(r.issues.length).toBe(0)
  })

  it('returns coherent for single-domain resume', () => {
    const r = checkCareerNarrative(
      'React 개발 3년. Vue 기반 프론트엔드 팀 리드 경험. TypeScript SPA 설계.'
    )
    expect(r.cohesion).toBe('coherent')
    const domainPositive = r.positives.find((p) => p.includes('도메인'))
    expect(domainPositive).toBeDefined()
  })

  it('detects domain scatter for 4+ domains', () => {
    const r = checkCareerNarrative(
      'React 프론트엔드 개발. Spring 백엔드 API 개발. iOS 모바일 앱 개발. 머신러닝 모델 개발. 인프라 팀 DevOps 엔지니어.'
    )
    const scatter = r.issues.find((i) => i.type === 'domain_scatter')
    expect(scatter).toBeDefined()
  })

  it('does not flag domain scatter with progression narrative', () => {
    const r = checkCareerNarrative(
      'React 프론트엔드. 백엔드 API 개발. iOS 모바일. ML 모델. 성장하며 기술 리드 전환. 팀 빌딩 경험.'
    )
    const scatter = r.issues.find((i) => i.type === 'domain_scatter')
    expect(scatter).toBeUndefined()
  })

  it('detects role regression (senior then junior)', () => {
    const text = '팀장으로 5년 근무. 이후 신입으로 재직.'
    const r = checkCareerNarrative(text)
    const regression = r.issues.find((i) => i.type === 'role_regression')
    expect(regression).toBeDefined()
  })

  it('positive: detects senior experience', () => {
    const r = checkCareerNarrative('Lead 엔지니어로 팀을 이끌었습니다. 시니어 개발자 경험.')
    const seniorPositive = r.positives.find((p) => p.includes('시니어'))
    expect(seniorPositive).toBeDefined()
  })

  it('returns adequate cohesion for single issue', () => {
    const text = '팀장으로 5년 근무. 이후 신입으로 재직. React 개발자.'
    const r = checkCareerNarrative(text)
    expect(['adequate', 'fragmented']).toContain(r.cohesion)
  })

  it('suggestion is non-empty string', () => {
    const r = checkCareerNarrative('일반적인 이력서 내용입니다. React 개발자.')
    expect(r.suggestion.length).toBeGreaterThan(10)
  })
})
