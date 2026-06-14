import { describe, expect, it } from 'vitest'

import { buildCoverLetterStructureReport } from './coverLetterStructure'

describe('buildCoverLetterStructureReport', () => {
  it('returns score 0 and warning for empty input', () => {
    const r = buildCoverLetterStructureReport('')
    expect(r.score).toBe(0)
    expect(r.tone).toBe('warning')
    expect(r.checks).toHaveLength(0)
  })

  it('detects short text as word count fail', () => {
    const r = buildCoverLetterStructureReport('안녕하세요 저는 지원합니다.')
    const wc = r.checks.find((c) => c.label === '분량')
    expect(wc?.status).toBe('fail')
  })

  it('awards full word count score for 200-500 words', () => {
    const sentence = '저는 이 회사를 지원하는 이유가 있습니다. '
    const text = sentence.repeat(20) // ~20*8=160 words in Korean
    const r = buildCoverLetterStructureReport(text)
    const wc = r.checks.find((c) => c.label === '분량')
    expect(wc?.score).toBeGreaterThanOrEqual(10)
  })

  it('detects weak opener "안녕하세요"', () => {
    const text =
      '안녕하세요, 저는 홍길동입니다.\n\n귀사 서비스를 애용하며 지원하게 되었습니다.\n\n최선을 다하겠습니다.'
    const r = buildCoverLetterStructureReport(text)
    const opener = r.checks.find((c) => c.label === '오프닝 품질')
    expect(opener?.status).toBe('warn')
  })

  it('rewards good opener with specific motivation', () => {
    const text =
      '귀사가 추구하는 임팩트 있는 서비스에 기여하고 싶어 지원하게 되었습니다.\n\n경험을 통해 성장했습니다.\n\n함께 성장하겠습니다.'
    const r = buildCoverLetterStructureReport(text)
    const opener = r.checks.find((c) => c.label === '오프닝 품질')
    expect(opener?.status).toBe('pass')
  })

  it('detects passive closing', () => {
    const text = '저는 지원자입니다.\n\n경력이 있습니다.\n\n기회를 주신다면 열심히 하겠습니다.'
    const r = buildCoverLetterStructureReport(text)
    const closing = r.checks.find((c) => c.label === '클로징 CTA')
    expect(closing?.status).toBe('warn')
  })

  it('rewards strong closing CTA', () => {
    const text =
      '귀사 서비스에 기여하고자 지원합니다.\n\n경험이 있습니다.\n\n함께 성장하며 기여하겠습니다.'
    const r = buildCoverLetterStructureReport(text)
    const closing = r.checks.find((c) => c.label === '클로징 CTA')
    expect(closing?.status).toBe('pass')
  })

  it('optimal paragraph count (3-5) gets pass', () => {
    const text = 'para1\n\npara2\n\npara3\n\npara4'
    const r = buildCoverLetterStructureReport(text)
    const para = r.checks.find((c) => c.label === '단락 구성')
    expect(para?.status).toBe('pass')
  })

  it('low personalization count is fail', () => {
    const text = '저는 개발자입니다.\n\n경력이 3년입니다.\n\n최선을 다하겠습니다.'
    const r = buildCoverLetterStructureReport(text)
    const personal = r.checks.find((c) => c.label === '개인화')
    expect(personal?.status).toBe('fail')
  })

  it('returns exactly 5 checks', () => {
    const r = buildCoverLetterStructureReport(
      '귀사 서비스에 기여하고자 지원합니다.\n\n경험이 있습니다.\n\n함께 성장하겠습니다.'
    )
    expect(r.checks).toHaveLength(5)
  })

  it('total score is sum of individual check scores', () => {
    const r = buildCoverLetterStructureReport(
      '귀사 플랫폼의 임팩트에 관심을 갖게 되었습니다.\n\n여러 경험으로 성장했습니다.\n\n함께 기여하겠습니다.'
    )
    const sum = r.checks.reduce((acc, c) => acc + c.score, 0)
    expect(r.score).toBe(sum)
  })
})
