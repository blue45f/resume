import { describe, expect, it } from 'vitest'

import { detectJdTechObsolescence } from './jdTechObsolescenceDetector'

describe('detectJdTechObsolescence', () => {
  it('returns none for empty text', () => {
    const r = detectJdTechObsolescence('')
    expect(r.risk).toBe('none')
    expect(r.techs.length).toBe(0)
  })

  it('returns none for modern tech stack', () => {
    const r = detectJdTechObsolescence(
      'React 18, TypeScript, Next.js, PostgreSQL, AWS, Docker, Kubernetes'
    )
    expect(r.risk).toBe('none')
    expect(r.techs.length).toBe(0)
  })

  it('detects EOL Flash requirement', () => {
    const r = detectJdTechObsolescence('Adobe Flash를 이용한 웹 콘텐츠 제작 경험')
    const flash = r.techs.find((t) => t.name.includes('Flash'))
    expect(flash).toBeDefined()
    expect(flash?.level).toBe('eol')
    expect(r.risk).toBe('high')
  })

  it('detects EOL AngularJS 1.x', () => {
    const r = detectJdTechObsolescence('AngularJS 기반 SPA 개발 경험자 우대')
    const ng = r.techs.find((t) => t.name.includes('AngularJS'))
    expect(ng).toBeDefined()
    expect(ng?.level).toBe('eol')
  })

  it('detects declining jQuery standalone', () => {
    const r = detectJdTechObsolescence('jQuery를 활용한 프론트엔드 개발')
    const jq = r.techs.find((t) => t.name.includes('jQuery'))
    expect(jq).toBeDefined()
    expect(jq?.level).toBe('declining')
  })

  it('detects SVN as declining', () => {
    const r = detectJdTechObsolescence('SVN을 이용한 소스 관리 경험 필요')
    const svn = r.techs.find((t) => t.name.includes('SVN'))
    expect(svn).toBeDefined()
    expect(svn?.level).toBe('declining')
  })

  it('returns high risk for EOL + declining combo', () => {
    const r = detectJdTechObsolescence('Apache Struts 기반 백엔드 개발. SVN으로 버전 관리.')
    expect(r.risk).toBe('high')
    expect(r.eolCount).toBeGreaterThanOrEqual(1)
  })

  it('returns moderate risk for declining tech only', () => {
    const r = detectJdTechObsolescence('jQuery 및 JSP를 사용한 화면 개발 경험자')
    expect(['moderate', 'high']).toContain(r.risk)
  })

  it('provides modernAlternative for each detected tech', () => {
    const r = detectJdTechObsolescence('Flash 기반 콘텐츠 제작')
    expect(r.techs[0]?.modernAlternative).toBeTruthy()
  })

  it('summary mentions tech debt for high risk', () => {
    const r = detectJdTechObsolescence('AngularJS와 SVN을 이용한 프로젝트')
    expect(r.summary).toContain('기술 부채')
  })
})
