import { describe, expect, it } from 'vitest'

import { buildCoverLetterFlowMap } from './coverLetterFlowMap'

const LETTER = [
  '귀사의 결제 서비스에 매력을 느껴 지원하게 되었습니다.',
  '저의 강점은 대규모 트래픽을 다루는 백엔드 설계 역량입니다.',
  '이전 프로젝트에서 결제 시스템을 단독으로 개발했습니다.',
  '입사 후 결제 안정성을 높이는 데 기여하고 싶습니다.',
].join('\n\n')

describe('buildCoverLetterFlowMap', () => {
  it('produces one segment per paragraph', () => {
    const r = buildCoverLetterFlowMap(LETTER)
    expect(r.paragraphCount).toBe(4)
    expect(r.segments.length).toBe(4)
  })

  it('classifies blocks by paragraph', () => {
    const r = buildCoverLetterFlowMap(LETTER)
    expect(r.segments[0].block).toBe('motivation')
    expect(r.segments[3].block).toBe('aspiration')
    expect(r.aspirationAtEnd).toBe(true)
  })

  it('weights sum to ~1', () => {
    const r = buildCoverLetterFlowMap(LETTER)
    const sum = r.segments.reduce((s, seg) => s + seg.weight, 0)
    expect(sum).toBeCloseTo(1, 5)
  })

  it('notes a wall of text when single paragraph', () => {
    const r = buildCoverLetterFlowMap('지원 동기와 역량과 경험과 포부를 한 문단에 담았습니다.')
    expect(r.paragraphCount).toBe(1)
    expect(r.notes.some((n) => n.includes('한 덩어리'))).toBe(true)
  })

  it('notes missing aspiration', () => {
    const text = ['지원 동기가 있습니다.', '다양한 프로젝트를 개발했습니다.'].join('\n\n')
    const r = buildCoverLetterFlowMap(text)
    expect(r.notes.some((n) => n.includes('포부'))).toBe(true)
  })

  it('flags aspiration not at end', () => {
    const text = [
      '입사 후 기여하고 싶은 포부가 있습니다.',
      '다양한 프로젝트를 개발한 경험이 있습니다.',
    ].join('\n\n')
    const r = buildCoverLetterFlowMap(text)
    expect(r.aspirationAtEnd).toBe(false)
    expect(r.notes.some((n) => n.includes('마지막'))).toBe(true)
  })

  it('computes a dominant block', () => {
    const r = buildCoverLetterFlowMap(LETTER)
    expect(r.dominantBlock).not.toBeNull()
  })
})
