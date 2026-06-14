/**
 * 자기소개서 길이·균형 분석기 — 전체 길이, 문단 수,
 * 문장 다양성을 측정하고 비율이 왜곡된 경우를 경고한다.
 */

export type LengthIssue =
  | 'too_short' // 300자 미만 — 내용 부족
  | 'too_long' // 3000자 초과 — 집중도 저하
  | 'single_block' // 문단 분리 없는 긴 단일 블록
  | 'too_many_short_sentences' // 짧은 문장(15자 미만) 과다
  | 'repetitive_sentence_length' // 비슷한 길이 반복

export type LengthGrade = 'optimal' | 'acceptable' | 'warning' | 'poor'

export interface CoverLetterLengthReport {
  charCount: number
  sentenceCount: number
  paragraphCount: number
  avgSentenceLen: number
  issues: LengthIssue[]
  grade: LengthGrade
  summary: string
  suggestions: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?。]\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 5)
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeCoverLetterLengthBalance(text: string): CoverLetterLengthReport {
  const t = (text ?? '').trim()
  const charCount = t.length

  const sentences = splitSentences(t)
  const sentenceCount = sentences.length

  const paragraphs = splitParagraphs(t)
  const paragraphCount = paragraphs.length

  const avgSentenceLen =
    sentenceCount > 0
      ? Math.round(sentences.reduce((acc, s) => acc + s.length, 0) / sentenceCount)
      : 0

  const issues: LengthIssue[] = []

  if (charCount > 0 && charCount < 300) {
    issues.push('too_short')
  }
  if (charCount > 3000) {
    issues.push('too_long')
  }
  if (charCount > 500 && paragraphCount <= 1) {
    issues.push('single_block')
  }
  if (sentenceCount >= 5) {
    const shortSentences = sentences.filter((s) => s.length < 15).length
    if (shortSentences / sentenceCount >= 0.5) {
      issues.push('too_many_short_sentences')
    }
  }
  if (sentenceCount >= 6) {
    const lengths = sentences.map((s) => s.length)
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length
    const variance = lengths.reduce((acc, l) => acc + (l - mean) ** 2, 0) / lengths.length
    const stdDev = Math.sqrt(variance)
    // Low stdDev relative to mean → monotone sentence rhythm
    if (stdDev / mean < 0.25 && sentenceCount >= 8) {
      issues.push('repetitive_sentence_length')
    }
  }

  let grade: LengthGrade
  if (issues.length === 0) grade = 'optimal'
  else if (issues.length === 1 && !issues.includes('too_short') && !issues.includes('too_long')) {
    grade = 'acceptable'
  } else if (issues.includes('too_short') || issues.includes('too_long')) {
    grade = 'poor'
  } else {
    grade = 'warning'
  }

  let summary: string
  if (grade === 'optimal') {
    summary = `${charCount}자, ${paragraphCount}개 문단 — 길이와 구성이 적절합니다.`
  } else if (issues.includes('too_short')) {
    summary = `현재 ${charCount}자입니다. 300자 이상으로 늘려 지원 동기와 경험을 충분히 서술하세요.`
  } else if (issues.includes('too_long')) {
    summary = `${charCount}자로 다소 깁니다. 2,000~2,500자 내외로 핵심만 압축하세요.`
  } else if (issues.includes('single_block')) {
    summary = `문단이 분리되어 있지 않습니다. 3~5개 문단으로 구분하면 가독성이 높아집니다.`
  } else {
    summary = `${charCount}자, ${paragraphCount}개 문단 — 일부 구성 개선이 필요합니다.`
  }

  const suggestions: string[] = []
  if (issues.includes('too_short')) {
    suggestions.push('지원 동기, 핵심 경험 1-2개, 포부 문단을 추가해 300자 이상으로 늘리세요.')
  }
  if (issues.includes('too_long')) {
    suggestions.push('각 경험을 2~3문장 이내로 압축하고 중복 표현을 제거하세요.')
  }
  if (issues.includes('single_block')) {
    suggestions.push('도입부 / 경험 / 포부 등 주제별로 빈 줄을 추가해 문단을 나누세요.')
  }
  if (issues.includes('too_many_short_sentences')) {
    suggestions.push('짧은 문장들을 접속사로 연결해 문장 리듬에 변화를 주세요.')
  }
  if (issues.includes('repetitive_sentence_length')) {
    suggestions.push('긴 문장과 짧은 문장을 교차 배치해 단조로운 리듬을 깨세요.')
  }

  return {
    charCount,
    sentenceCount,
    paragraphCount,
    avgSentenceLen,
    issues,
    grade,
    summary,
    suggestions,
  }
}
