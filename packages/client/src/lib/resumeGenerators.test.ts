import { describe, expect, it } from 'vitest'

import {
  generateResumeTldr,
  generateStarBulletTemplate,
  computeTextSimilarity,
} from './resumeGenerators'

describe('generateResumeTldr', () => {
  it('returns 3 summary lines', () => {
    const text =
      '7년차 백엔드 개발자. Java Kotlin Spring 사용 경험. 카카오 결제 시스템 설계 및 운영. 협업 능력 우수.'
    const r = generateResumeTldr(text)
    expect(r.lines).toHaveLength(3)
    expect(r.summary.length).toBeGreaterThan(0)
  })
})

describe('generateStarBulletTemplate', () => {
  it('returns template with all STAR prompts', () => {
    const r = generateStarBulletTemplate('Kotlin', '카카오 결제 프로젝트')
    expect(r.skill).toBe('Kotlin')
    expect(r.template).toContain('Kotlin')
    expect(r.template).toContain('카카오 결제 프로젝트')
    expect(r.prompts.situation).toBeTruthy()
    expect(r.prompts.task).toBeTruthy()
    expect(r.prompts.action).toBeTruthy()
    expect(r.prompts.result).toBeTruthy()
  })

  it('uses fallback context when not provided', () => {
    const r = generateStarBulletTemplate('React')
    expect(r.template).toContain('해당 프로젝트')
  })
})

describe('computeTextSimilarity', () => {
  it('returns very high jaccard for identical text', () => {
    const t = '카카오 결제 시스템 백엔드 개발자 Java Kotlin Spring.'
    const r = computeTextSimilarity(t, t)
    expect(r.jaccard).toBe(1)
    expect(r.verdict).toBe('거의 동일')
  })

  it('returns 0 jaccard for empty inputs', () => {
    const r = computeTextSimilarity('', '')
    expect(r.jaccard).toBe(0)
  })

  it('returns "매우 다름" for unrelated texts', () => {
    const a = '백엔드 개발자 Java Spring 경력.'
    const b = '디자인 포트폴리오 Figma 일러스트.'
    const r = computeTextSimilarity(a, b)
    expect(r.verdict).toBe('매우 다름')
  })

  it('reports shared + unique keywords', () => {
    const a = '카카오 결제 백엔드 Java Kotlin'
    const b = '네이버 결제 백엔드 Java Python'
    const r = computeTextSimilarity(a, b)
    expect(r.shared).toContain('결제')
    expect(r.shared).toContain('백엔드')
    expect(r.uniqueA.some((k) => k === '카카오' || k === 'Kotlin')).toBe(true)
  })
})
