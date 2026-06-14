import { describe, expect, it } from 'vitest'

import { checkCoverLetterFirstPerson } from './coverLetterFirstPersonChecker'

describe('checkCoverLetterFirstPerson', () => {
  it('returns varied for empty text', () => {
    const r = checkCoverLetterFirstPerson('')
    expect(r.grade).toBe('varied')
    expect(r.firstPersonSentences).toBe(0)
  })

  it('detects "저는" sentence starts', () => {
    const r = checkCoverLetterFirstPerson(
      '저는 5년간 개발을 해왔습니다. 저는 특히 백엔드에 관심이 있습니다.'
    )
    expect(r.occurrences.some((o) => o.pattern === 'sentence_start_jeoneun')).toBe(true)
  })

  it('detects "제가" sentence starts', () => {
    const r = checkCoverLetterFirstPerson('제가 주도한 프로젝트에서 성과를 냈습니다.')
    expect(r.occurrences.some((o) => o.pattern === 'sentence_start_jega')).toBe(true)
  })

  it('grades monotone when 60%+ sentences are first-person', () => {
    const sentences = [
      '저는 5년간 개발을 했습니다.',
      '저는 백엔드에 집중했습니다.',
      '저는 성과를 달성했습니다.',
      '저는 팀에 기여했습니다.',
      '저는 최선을 다했습니다.',
      '당시 팀에서 문제가 있었습니다.',
    ]
    const r = checkCoverLetterFirstPerson(sentences.join('\n'))
    expect(['monotone', 'repetitive']).toContain(r.grade)
  })

  it('grades varied for diverse sentence starts', () => {
    const text = [
      '당시 팀에서 성능 이슈가 있었습니다.',
      '이를 해결하기 위해 캐시를 도입했습니다.',
      '그 결과 응답 시간이 40% 단축되었습니다.',
      'API 설계는 RESTful 원칙을 따랐습니다.',
      '배포 파이프라인 자동화도 진행했습니다.',
    ].join('\n')
    const r = checkCoverLetterFirstPerson(text)
    expect(['varied', 'adequate']).toContain(r.grade)
  })

  it('firstPersonRatio is between 0 and 100', () => {
    const r = checkCoverLetterFirstPerson('저는 개발자입니다. 코드를 작성합니다.')
    expect(r.firstPersonRatio).toBeGreaterThanOrEqual(0)
    expect(r.firstPersonRatio).toBeLessThanOrEqual(100)
  })

  it('provides alternatives for repetitive grade', () => {
    const sentences = Array(6).fill('저는 열심히 일했습니다.').join('\n')
    const r = checkCoverLetterFirstPerson(sentences)
    expect(r.alternatives.length).toBeGreaterThan(0)
  })

  it('summary is non-empty', () => {
    const r = checkCoverLetterFirstPerson('일반 텍스트입니다.')
    expect(r.summary.length).toBeGreaterThan(5)
  })
})
