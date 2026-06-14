import { describe, expect, it } from 'vitest'

import { analyzeInterviewBait } from './resumeInterviewBaitAnalyzer'

describe('analyzeInterviewBait', () => {
  it('returns none level for empty text', () => {
    const r = analyzeInterviewBait('')
    expect(r.level).toBe('none')
    expect(r.hookScore).toBe(0)
    expect(r.baits.length).toBe(0)
  })

  it('returns none for generic text without story hooks', () => {
    const r = analyzeInterviewBait('React와 TypeScript를 사용해 컴포넌트를 개발했습니다.')
    expect(r.level).toBe('none')
    expect(r.baits.length).toBe(0)
  })

  it('detects transformation hook (A→B metric)', () => {
    const r = analyzeInterviewBait('응답 시간을 3000ms에서 200ms로 단축했습니다.')
    expect(r.baits.some((b) => b.type === 'transformation')).toBe(true)
  })

  it('detects scale hook (DAU/MAU)', () => {
    const r = analyzeInterviewBait('DAU 500만 서비스의 결제 시스템을 담당했습니다.')
    expect(r.baits.some((b) => b.type === 'scale')).toBe(true)
  })

  it('detects challenge overcome hook', () => {
    const r = analyzeInterviewBait('프로세스 부재했던 환경을 구축하며 팀 생산성을 개선했습니다.')
    expect(r.baits.some((b) => b.type === 'challenge_overcome')).toBe(true)
  })

  it('detects initiative hook', () => {
    const r = analyzeInterviewBait('아무도 하지 않았던 코드 리뷰 문화를 사내 최초로 도입했습니다.')
    expect(r.baits.some((b) => b.type === 'initiative')).toBe(true)
  })

  it('returns rich level for multiple story hooks', () => {
    const text = `
      신입임에도 불구하고 결제 서비스 아키텍처를 주도 설계.
      DAU 100만 사용자 서비스 운영.
      응답 시간 5000ms → 200ms로 단축.
      장애 대응으로 서비스 복구 시간 90% 단축.
      없던 배포 프로세스를 구축하여 릴리즈 주기 1주 → 1일로 개선.
    `
    const r = analyzeInterviewBait(text)
    expect(r.hookScore).toBeGreaterThanOrEqual(50)
    expect(r.level).toBe('rich')
  })

  it('provides a non-empty tip', () => {
    const r = analyzeInterviewBait('Python으로 API 개발 경험 보유.')
    expect(r.tip.length).toBeGreaterThan(0)
  })
})
