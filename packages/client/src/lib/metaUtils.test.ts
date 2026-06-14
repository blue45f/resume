import { describe, expect, it } from 'vitest'

import {
  estimateReadingTime,
  extractLinks,
  generateHashtags,
  countCharsByCategory,
} from './metaUtils'

describe('estimateReadingTime', () => {
  it('returns "본문 없음" for empty', () => {
    const r = estimateReadingTime('')
    expect(r.chars).toBe(0)
    expect(r.label).toContain('없')
  })

  it('reports short for tiny text', () => {
    const r = estimateReadingTime('짧은 글입니다.')
    expect(r.label).toMatch(/30초|약/)
  })

  it('estimates minutes for longer text', () => {
    const text = '가'.repeat(900)
    const r = estimateReadingTime(text)
    expect(r.minutes).toBeGreaterThanOrEqual(2)
    expect(r.label).toMatch(/약\s*3분|약 3분/)
  })
})

describe('extractLinks', () => {
  it('detects platform of github link', () => {
    const r = extractLinks('https://github.com/foo/bar')
    expect(r.count).toBe(1)
    expect(r.links[0].platform).toBe('github')
    expect(r.links[0].hasScheme).toBe(true)
  })

  it('flags missing scheme links', () => {
    const r = extractLinks('github.com/foo')
    expect(r.links[0].hasScheme).toBe(false)
    expect(r.missingScheme).toBe(1)
  })

  it('classifies linkedin/notion/velog', () => {
    const r = extractLinks(
      'https://www.linkedin.com/in/me https://my.notion.so/page https://velog.io/@me'
    )
    const platforms = r.links.map((l) => l.platform)
    expect(platforms).toContain('linkedin')
    expect(platforms).toContain('notion')
    expect(platforms).toContain('velog')
  })

  it('returns no links for clean text', () => {
    const r = extractLinks('이력서 텍스트입니다.')
    expect(r.count).toBe(0)
  })
})

describe('generateHashtags', () => {
  it('returns at most topN hashtags', () => {
    const text =
      '백엔드 개발자입니다. Java Kotlin Spring JPA Kafka PostgreSQL Redis 카카오 네이버 결제 시스템.'
    const tags = generateHashtags(text, 5)
    expect(tags.length).toBeLessThanOrEqual(5)
    for (const t of tags) expect(t.startsWith('#')).toBe(true)
  })
})

describe('countCharsByCategory', () => {
  it('categorizes mixed input', () => {
    const r = countCharsByCategory('가나다 abc 123 . ')
    expect(r.korean).toBe(3)
    expect(r.english).toBe(3)
    expect(r.digits).toBe(3)
    expect(r.whitespace).toBeGreaterThanOrEqual(3)
    expect(r.punctuation).toBeGreaterThanOrEqual(1)
  })

  it('handles empty string without crash', () => {
    const r = countCharsByCategory('')
    expect(r.total).toBe(1) // 분모 0 방지 가드 (코드 내 || 1)
  })

  it('percents sum to ~100 for non-empty input', () => {
    const r = countCharsByCategory('가나다 abc 123')
    const sum =
      r.percents.korean +
      r.percents.english +
      r.percents.digits +
      r.percents.whitespace +
      r.percents.punctuation +
      r.percents.other
    // 반올림 오차 허용
    expect(sum).toBeGreaterThan(99)
    expect(sum).toBeLessThan(101)
  })
})
