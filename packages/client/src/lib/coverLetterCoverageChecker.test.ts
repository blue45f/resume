import { describe, expect, it } from 'vitest'

import { checkCoverLetterCoverage } from './coverLetterCoverageChecker'

describe('checkCoverLetterCoverage', () => {
  it('grades sparse for near-empty text', () => {
    const r = checkCoverLetterCoverage('안녕하세요.')
    expect(r.grade).toBe('sparse')
  })

  it('detects all four blocks in a complete letter', () => {
    const text = [
      '귀사의 결제 서비스에 매력을 느껴 지원하게 되었습니다.',
      '저의 강점은 백엔드 설계 역량입니다.',
      '이전 프로젝트에서 결제 시스템을 개발했습니다.',
      '입사 후 결제 안정성에 기여하고 싶습니다.',
    ].join('\n')
    const r = checkCoverLetterCoverage(text)
    expect(r.grade).toBe('complete')
    expect(r.presentCount).toBe(4)
    expect(r.missingBlocks.length).toBe(0)
  })

  it('detects motivation block', () => {
    const r = checkCoverLetterCoverage('이 직무에 지원하게 된 이유는 명확합니다.')
    expect(r.presentBlocks).toContain('motivation')
  })

  it('detects aspiration block', () => {
    const r = checkCoverLetterCoverage('입사 후 팀의 성장에 기여하고 싶습니다.')
    expect(r.presentBlocks).toContain('aspiration')
  })

  it('flags missing aspiration in a motivation+experience letter', () => {
    const text = '지원 동기는 분명합니다. 다양한 프로젝트를 개발했습니다.'
    const r = checkCoverLetterCoverage(text)
    expect(r.missingBlocks).toContain('aspiration')
  })

  it('grades good when three blocks present', () => {
    const text = [
      '지원 동기가 있습니다.',
      '저의 역량은 분명합니다.',
      '프로젝트를 진행했습니다.',
    ].join('\n')
    const r = checkCoverLetterCoverage(text)
    expect(r.grade).toBe('good')
  })

  it('provides suggestions for missing blocks', () => {
    const text = '다양한 프로젝트를 개발했습니다.'
    const r = checkCoverLetterCoverage(text)
    expect(r.suggestions.length).toBeGreaterThan(0)
  })

  it('summary is non-empty', () => {
    const r = checkCoverLetterCoverage('내용')
    expect(r.summary.length).toBeGreaterThan(5)
  })
})
