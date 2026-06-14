import { describe, expect, it } from 'vitest'

import { checkResumeContactInfo } from './resumeContactInfoChecker'

describe('checkResumeContactInfo', () => {
  it('returns minimal for empty text', () => {
    const r = checkResumeContactInfo('')
    expect(r.completeness).toBe('minimal')
    expect(r.foundFields).toHaveLength(0)
  })

  it('detects Korean phone number', () => {
    const r = checkResumeContactInfo('010-1234-5678')
    expect(r.foundFields).toContain('phone')
  })

  it('detects email', () => {
    const r = checkResumeContactInfo('john.doe@example.com')
    expect(r.foundFields).toContain('email')
  })

  it('detects LinkedIn URL', () => {
    const r = checkResumeContactInfo('linkedin.com/in/johndoe')
    expect(r.foundFields).toContain('linkedin')
  })

  it('detects GitHub URL', () => {
    const r = checkResumeContactInfo('github.com/johndoe')
    expect(r.foundFields).toContain('github')
  })

  it('detects Korean location', () => {
    const r = checkResumeContactInfo('서울특별시 거주')
    expect(r.foundFields).toContain('location')
  })

  it('grades complete for phone + email + linkedin + github', () => {
    const r = checkResumeContactInfo(
      '010-9876-5432 | dev@example.com | linkedin.com/in/dev | github.com/dev'
    )
    expect(r.completeness).toBe('complete')
  })

  it('grades partial when only phone present', () => {
    const r = checkResumeContactInfo('010-1234-5678')
    expect(r.completeness).toBe('partial')
  })

  it('grades good when phone + email + one professional link', () => {
    const r = checkResumeContactInfo('010-9876-5432 dev@example.com linkedin.com/in/dev')
    expect(['good', 'complete']).toContain(r.completeness)
  })

  it('missing phone adds no_phone to missingFields', () => {
    const r = checkResumeContactInfo('dev@example.com linkedin.com/in/dev')
    expect(r.missingFields).toContain('no_phone')
  })

  it('missing email adds no_email to missingFields', () => {
    const r = checkResumeContactInfo('010-1234-5678 linkedin.com/in/dev')
    expect(r.missingFields).toContain('no_email')
  })

  it('recommendations mention github for dev roles', () => {
    const r = checkResumeContactInfo('010-1234-5678 dev@example.com 백엔드 개발자')
    expect(r.recommendations.some((rec) => rec.includes('GitHub'))).toBe(true)
  })

  it('summary is non-empty', () => {
    const r = checkResumeContactInfo('일반 텍스트')
    expect(r.summary.length).toBeGreaterThan(5)
  })
})
