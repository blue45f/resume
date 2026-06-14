import { describe, it, expect } from 'vitest'

import { analyzeJdCompetitiveLandscape, INTENSITY_LABELS } from './jdCompetitiveLandscape'

describe('analyzeJdCompetitiveLandscape', () => {
  it('너무 짧은 공고는 unknown 으로 처리한다', () => {
    const r = analyzeJdCompetitiveLandscape('프론트 개발자')
    expect(r.competitionIntensity).toBe('unknown')
    expect(r.technicalBarrier).toBe('unknown')
    expect(r.implicitChallenges).toHaveLength(0)
    expect(r.summary).toContain('부족')
  })

  it('시니어·5년 이상 니치 공고는 기술 장벽 높음·경쟁 낮음', () => {
    const text =
      '시니어 백엔드 엔지니어를 찾습니다. 경력 7년 이상, 대규모 트래픽 처리 경험 필수. ' +
      'Kotlin, Spring, Kafka, Kubernetes, gRPC, Redis 등 깊이 있는 이해 필요. 아키텍트 수준의 설계 역량 요구.'
    const r = analyzeJdCompetitiveLandscape(text)
    expect(r.technicalBarrier).toBe('high')
    expect(r.competitionIntensity).toBe('low')
    expect(r.demandedExperience.some((d) => d.includes('7년'))).toBe(true)
  })

  it('신입 환영·대량 채용 공고는 경쟁 높음·장벽 낮음', () => {
    const text =
      '신입 환영! 경력 무관, 다수 채용합니다. 열정 있는 분이라면 누구나 지원 가능합니다. ' +
      '기본적인 컴퓨터 활용 능력만 있으면 됩니다. 함께 성장할 동료를 찾습니다.'
    const r = analyzeJdCompetitiveLandscape(text)
    expect(r.competitionIntensity).toBe('high')
    expect(r.technicalBarrier).toBe('low')
  })

  it('암묵적 근무 난제를 근거와 함께 감지한다', () => {
    const text =
      '빠른 의사결정이 가능한 환경에서 주도적으로 일할 분을 찾습니다. ' +
      '초기 스타트업으로 KPI 달성에 집중합니다. 자격요건: 관련 경력 3년 이상.'
    const r = analyzeJdCompetitiveLandscape(text)
    const challenges = r.implicitChallenges.map((c) => c.challenge)
    expect(challenges).toContain('빠른 의사결정·실행 속도 요구')
    expect(challenges).toContain('높은 자율성·오너십 기대')
    expect(challenges).toContain('초기 스타트업의 불확실성·리소스 제약')
    expect(challenges).toContain('높은 성과 압박')
    // 각 난제는 근거 표현과 함의를 가진다
    for (const c of r.implicitChallenges) {
      expect(c.evidence.length).toBeGreaterThan(0)
      expect(c.implication.length).toBeGreaterThan(0)
    }
  })

  it('요구 경력과 역할 신호를 추출한다', () => {
    const text =
      '프론트엔드 리드를 모집합니다. 경력 5년 이상이며 팀을 이끈 경험이 있는 분. ' +
      'React 기반 대형 서비스 운영 경험 필수.'
    const r = analyzeJdCompetitiveLandscape(text)
    expect(r.demandedExperience.some((d) => d.includes('5년'))).toBe(true)
    expect(r.demandedExperience.some((d) => /리드|역할/.test(d))).toBe(true)
  })

  it('summary 는 경쟁·기술 장벽 요약을 포함한다', () => {
    const text =
      '백엔드 개발자 채용. 경력 3년 이상, Node.js와 PostgreSQL 경험. ' +
      '빠른 환경에서 자율적으로 일할 분.'
    const r = analyzeJdCompetitiveLandscape(text)
    expect(r.summary).toMatch(/경쟁/)
    expect(r.summary).toMatch(/장벽/)
    expect(r.fitmentSuggestion.length).toBeGreaterThan(0)
  })

  it('INTENSITY_LABELS 가 한글 라벨을 제공한다', () => {
    expect(INTENSITY_LABELS.low).toBe('낮음')
    expect(INTENSITY_LABELS.medium).toBe('보통')
    expect(INTENSITY_LABELS.high).toBe('높음')
    expect(INTENSITY_LABELS.unknown).toBe('불명')
  })
})
