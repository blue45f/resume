import { describe, expect, it } from 'vitest'

import { buildResumeActionVerbReport } from './resumeActionVerbAnalyzer'

describe('buildResumeActionVerbReport', () => {
  it('returns zero state for empty text', () => {
    const report = buildResumeActionVerbReport('')
    expect(report.totalHits).toBe(0)
    expect(report.score).toBe(0)
    expect(report.tone).toBe('warning')
  })

  it('flags overuse of weak verbs', () => {
    const text = `프로젝트 A 업무 담당. 프로젝트 B 운영 담당. 신규 기능 담당했다.
    추가로 운영 업무를 수행했고 다른 팀 업무도 수행했다. 미팅에도 참여했다.`
    const report = buildResumeActionVerbReport(text)
    expect(report.weakCount).toBeGreaterThan(report.strongCount)
    expect(report.tone).toBe('warning')
    expect(report.summary).toMatch(/약한|담당|수행/)
    expect(report.weakVerbs[0]?.verb).toBe('담당')
  })

  it('rewards strong verb usage', () => {
    const text = `결제 시스템을 주도적으로 설계하고 출시했다. 응답 속도를 30% 개선했다.
    데이터 파이프라인을 구축했고 비용을 절감했다. 신규 채널을 확장했고 신규 고객을 확보했다.`
    const report = buildResumeActionVerbReport(text)
    expect(report.strongCount).toBeGreaterThanOrEqual(5)
    expect(report.score).toBeGreaterThanOrEqual(70)
    expect(report.tone).toBe('good')
  })

  it('flags low diversity when same verb repeats', () => {
    const text = `A 기능 개발. B 기능 개발. C 기능 개발. D 기능 개발. E 기능 개발. F 기능 개발.`
    const report = buildResumeActionVerbReport(text)
    expect(report.diversityRatio).toBeLessThan(0.5)
    expect(report.tone === 'warning' || report.tone === 'neutral').toBe(true)
  })

  it('detects English weak phrases', () => {
    const text = `Responsible for the dashboard. Worked on auth flow. Helped the frontend team.`
    const report = buildResumeActionVerbReport(text)
    expect(report.weakCount).toBeGreaterThanOrEqual(3)
    const weakLemmas = report.weakVerbs.map((v) => v.verb)
    expect(weakLemmas).toContain('responsible-for')
  })

  it('detects English strong phrases', () => {
    const text = `Led a team of 5. Launched the new pricing page. Reduced infra costs by 30%.
    Designed the on-call rotation. Optimized the build pipeline. Scaled the service to 10M users.`
    const report = buildResumeActionVerbReport(text)
    expect(report.strongCount).toBeGreaterThanOrEqual(6)
    expect(report.score).toBeGreaterThanOrEqual(70)
  })

  it('caps the score at 100', () => {
    const text = `결제 시스템 주도. 검색 설계. 결제 출시. 성능 개선. 인프라 구축.
    아키텍처 리드. 빌드 자동화. 응답 최적화. 비용 절감. 사용자 확장. 데이터 확보.
    핵심 도입. 신규 발굴. 협상 완료. 개선 제안.`
    const report = buildResumeActionVerbReport(text)
    expect(report.score).toBeLessThanOrEqual(100)
    expect(report.score).toBeGreaterThan(0)
  })

  it('reports suggested alternatives for weak verbs', () => {
    const text = `결제 업무 담당. 운영 업무 담당. 신규 기능 담당.`
    const report = buildResumeActionVerbReport(text)
    const damdang = report.weakVerbs.find((v) => v.verb === '담당')
    expect(damdang?.alternatives).toEqual(expect.arrayContaining(['주도', '설계']))
  })
})
