import { describe, expect, it } from 'vitest'

import { checkJdPostingCompleteness } from './jdPostingCompletenessChecker'

describe('checkJdPostingCompleteness', () => {
  it('grades sparse for an empty/bare posting', () => {
    const r = checkJdPostingCompleteness('백엔드 개발자 채용합니다.')
    expect(r.grade).toBe('sparse')
    expect(r.essentialPresent).toBe(0)
  })

  it('detects all sections in a full posting', () => {
    const text = [
      '담당업무: 결제 시스템 개발',
      '자격요건: Java 3년 이상',
      '우대사항: Kotlin 경험',
      '근무조건: 서울 강남, 정규직',
      '복리후생: 식대 지원, 자기계발비',
      '전형절차: 서류 → 면접',
    ].join('\n')
    const r = checkJdPostingCompleteness(text)
    expect(r.grade).toBe('complete')
    expect(r.essentialPresent).toBe(3)
    expect(r.recommendedPresent).toBe(3)
    expect(r.missingSections.length).toBe(0)
  })

  it('grades good when essentials present but some recommended missing', () => {
    const text = ['담당업무: 개발', '자격요건: 경력 3년', '근무조건: 정규직'].join('\n')
    const r = checkJdPostingCompleteness(text)
    expect(r.grade).toBe('good')
    expect(r.essentialPresent).toBe(3)
  })

  it('grades partial when only one essential present', () => {
    const r = checkJdPostingCompleteness('담당업무: 다양한 개발 업무')
    expect(r.grade).toBe('partial')
  })

  it('lists missing sections', () => {
    const r = checkJdPostingCompleteness('자격요건: Python 경력')
    expect(r.missingSections).toContain('responsibilities')
    expect(r.missingSections).toContain('conditions')
  })

  it('warns about missing essential info in tips', () => {
    const r = checkJdPostingCompleteness('우대사항: AWS 경험')
    expect(r.tips.some((t) => t.includes('필수 정보 누락'))).toBe(true)
  })

  it('detects English section headers', () => {
    const text = ['Responsibilities: build APIs', 'Requirements: 3y exp', 'Benefits: stock'].join(
      '\n'
    )
    const r = checkJdPostingCompleteness(text)
    expect(r.presentSections).toContain('responsibilities')
    expect(r.presentSections).toContain('qualifications')
    expect(r.presentSections).toContain('benefits')
  })

  it('summary is non-empty', () => {
    const r = checkJdPostingCompleteness('일반 공고')
    expect(r.summary.length).toBeGreaterThan(5)
  })
})
