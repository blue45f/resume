import { describe, expect, it } from 'vitest'

import { analyzeResumeLeadership } from './resumeLeadershipAnalyzer'

describe('analyzeResumeLeadership', () => {
  it('returns none for empty text', () => {
    const r = analyzeResumeLeadership('')
    expect(r.strength).toBe('none')
    expect(r.totalWeight).toBe(0)
    expect(r.signals.length).toBe(0)
  })

  it('returns none for text with no leadership signals', () => {
    const r = analyzeResumeLeadership('React TypeScript로 SPA 개발. Jest 단위 테스트 작성.')
    expect(r.strength).toBe('none')
  })

  it('detects people management from team size mention', () => {
    const r = analyzeResumeLeadership('5명 관리하며 스프린트를 진행했습니다.')
    expect(r.signals.some((s) => s.type === 'people_management')).toBe(true)
    expect(r.peopleManagement).toBe(true)
  })

  it('detects 팀장 as people management', () => {
    const r = analyzeResumeLeadership('2023.01 ~ 현재 프론트엔드 팀장 (팀원 7명)')
    expect(r.signals.some((s) => s.type === 'people_management')).toBe(true)
  })

  it('detects project ownership (Tech Lead)', () => {
    const r = analyzeResumeLeadership('결제 서비스 Tech Lead로 MSA 전환 주도.')
    expect(r.signals.some((s) => s.type === 'project_ownership')).toBe(true)
  })

  it('detects mentoring signal', () => {
    const r = analyzeResumeLeadership('주니어 3명 멘토링 및 코드 리뷰 주도.')
    expect(r.signals.some((s) => s.type === 'mentoring')).toBe(true)
  })

  it('detects architecture ownership', () => {
    const r = analyzeResumeLeadership('마이크로서비스 아키텍처 설계 주도. 기술 스택 선택 결정권.')
    expect(r.signals.some((s) => s.type === 'process_ownership')).toBe(true)
  })

  it('returns strong strength for high-weight resume', () => {
    const text = `
      팀장 (팀원 10명) / 2022.03 ~ 현재
      - 결제 서비스 Tech Lead로 MSA 전환 주도
      - 주니어 멘토링 및 코드 리뷰 문화 주도
      - 아키텍처 설계 결정
      - 유관 부서 협업 조율 (기획/디자인)
      - 예산 3억원 관리
    `
    const r = analyzeResumeLeadership(text)
    expect(r.totalWeight).toBeGreaterThanOrEqual(8)
    expect(r.strength).toBe('strong')
  })

  it('provides suggestions when leadership signals are weak', () => {
    const r = analyzeResumeLeadership('React 개발 경험 5년.')
    expect(r.suggestions.length).toBeGreaterThan(0)
  })
})
