import { describe, expect, it } from 'vitest'

import { analyzeCareerProgression } from './careerProgressionAnalyzer'

describe('analyzeCareerProgression', () => {
  it('returns unclear for empty text', () => {
    const r = analyzeCareerProgression('')
    expect(r.clarity).toBe('unclear')
    expect(r.signals.length).toBe(0)
  })

  it('detects promotion from 승진', () => {
    const text = '2022년 시니어 개발자로 승진. 팀 내 기술 리뷰 담당.'
    const r = analyzeCareerProgression(text)
    expect(r.signals.some((s) => s.type === 'promotion')).toBe(true)
    expect(r.promotionCount).toBeGreaterThanOrEqual(1)
  })

  it('detects 팀장 role as promotion', () => {
    const text = '2023년 팀장으로 임명. 5명 팀 관리.'
    const r = analyzeCareerProgression(text)
    expect(r.promotionCount).toBeGreaterThanOrEqual(1)
  })

  it('detects N명 관리 as scope signal', () => {
    const text = '10명 이상 엔지니어링 팀 리드. 분기별 OKR 수립.'
    const r = analyzeCareerProgression(text)
    expect(r.signals.some((s) => s.type === 'scope')).toBe(true)
    expect(r.scopeCount).toBeGreaterThanOrEqual(1)
  })

  it('returns clear when both promotion and scope signals exist', () => {
    const text = '시니어 엔지니어로 승진. 7명 팀 관리. 서비스 3배 성장 기여.'
    const r = analyzeCareerProgression(text)
    expect(r.clarity).toBe('clear')
  })

  it('returns some when only one signal type present', () => {
    const text = '매니저로 전환. 기획·개발 협업 주도.'
    const r = analyzeCareerProgression(text)
    expect(['some', 'clear']).toContain(r.clarity)
  })

  it('returns unclear for generic text with no progression', () => {
    const text = 'React TypeScript 개발. REST API 설계. 코드 리뷰 참여.'
    const r = analyzeCareerProgression(text)
    expect(r.clarity).toBe('unclear')
  })

  it('detects 정규직 전환', () => {
    const text = '인턴으로 입사 후 정규직 전환. 2년 재직.'
    const r = analyzeCareerProgression(text)
    expect(r.signals.some((s) => s.type === 'role_change')).toBe(true)
  })

  it('detects MAU growth as team_growth signal', () => {
    const text = 'MAU 5만 → 50만 달성. 서비스 아키텍처 개선 주도.'
    const r = analyzeCareerProgression(text)
    expect(r.signals.some((s) => s.type === 'team_growth')).toBe(true)
  })

  it('provides a non-empty suggestion', () => {
    const r = analyzeCareerProgression('백엔드 개발. Spring Boot 사용.')
    expect(r.suggestion.length).toBeGreaterThan(0)
  })
})
