import { describe, expect, it } from 'vitest'

import { detectCompanyStage } from './jdCompanyStageDetector'

describe('detectCompanyStage', () => {
  it('returns unclear for empty text', () => {
    const r = detectCompanyStage('')
    expect(r.stage).toBe('unclear')
    expect(r.confidence).toBe('low')
  })

  it('detects startup from 시리즈 A 신호', () => {
    const text = '시리즈 A 투자 완료한 핀테크 스타트업. 초기 멤버 모집.'
    const r = detectCompanyStage(text)
    expect(r.stage).toBe('startup')
    expect(r.signals.length).toBeGreaterThan(0)
  })

  it('detects enterprise from 대기업 그룹사 신호', () => {
    const text = '삼성그룹 계열사. 코스피 상장 기업. 하반기 공채 진행.'
    const r = detectCompanyStage(text)
    expect(r.stage).toBe('enterprise')
  })

  it('detects foreign company from 외국계 신호', () => {
    const text = '글로벌 외국계 기업. 해외 본사 미국. 영어 업무 필수.'
    const r = detectCompanyStage(text)
    expect(r.stage).toBe('foreign')
  })

  it('detects public institution from 공공기관 신호', () => {
    const text = 'NCS 기반 채용. 공공기관 정규직 채용. 국가직 직무 능력 평가 포함.'
    const r = detectCompanyStage(text)
    expect(r.stage).toBe('public')
  })

  it('confidence is high when 2+ signals match', () => {
    const text = '외국계 기업. 해외 본사 싱가포르. 영어 업무 필수. 글로벌 팀.'
    const r = detectCompanyStage(text)
    expect(r.confidence).toBe('high')
  })

  it('provides non-empty tips', () => {
    const text = '스타트업. 초기 멤버.'
    const r = detectCompanyStage(text)
    expect(r.tips.length).toBeGreaterThan(0)
  })

  it('stageLabel is a Korean string', () => {
    const text = '스타트업. 시리즈 B 투자.'
    const r = detectCompanyStage(text)
    expect(r.stageLabel).toBeTruthy()
    expect(r.stageLabel).not.toBe('unclear')
  })
})
