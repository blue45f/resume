/**
 * 자기소개서 1인칭 과용 감지기 — "저는"으로 시작하는 문장이
 * 전체의 40% 이상일 때 경고하고 다양한 문장 시작을 권장한다.
 */

export type FirstPersonPattern =
  | 'sentence_start_jeoneun' // "저는"으로 문장 시작
  | 'sentence_start_jega' // "제가"로 문장 시작
  | 'sentence_start_boneun' // "본인은"으로 문장 시작
  | 'paragraph_start_repeat' // 같은 1인칭으로 문단 연속 시작

export interface FirstPersonOccurrence {
  pattern: FirstPersonPattern
  excerpt: string
}

export type FirstPersonGrade = 'varied' | 'adequate' | 'repetitive' | 'monotone'

export interface CoverLetterFirstPersonReport {
  totalSentences: number
  firstPersonSentences: number
  firstPersonRatio: number
  grade: FirstPersonGrade
  occurrences: FirstPersonOccurrence[]
  summary: string
  alternatives: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitKoreanSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。])\s+|(?<=습니다)\s+|(?<=했다)\s+|(?<=이다)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
}

const FIRST_PERSON_STARTERS = [
  { re: /^저는\s/, pattern: 'sentence_start_jeoneun' as FirstPersonPattern },
  { re: /^제가\s/, pattern: 'sentence_start_jega' as FirstPersonPattern },
  { re: /^본인은\s/, pattern: 'sentence_start_boneun' as FirstPersonPattern },
]

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkCoverLetterFirstPerson(text: string): CoverLetterFirstPersonReport {
  const t = (text ?? '').trim()

  const sentences = splitKoreanSentences(t)
  const totalSentences = sentences.length

  const occurrences: FirstPersonOccurrence[] = []
  let firstPersonCount = 0

  for (const sentence of sentences) {
    for (const { re, pattern } of FIRST_PERSON_STARTERS) {
      if (re.test(sentence)) {
        firstPersonCount++
        occurrences.push({ pattern, excerpt: sentence.slice(0, 40) })
        break
      }
    }
  }

  // Check for paragraph-level repetition
  const paragraphs = t
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 5)
  let consecutiveFirstPerson = 0
  for (const para of paragraphs) {
    const firstSentence = para.slice(0, 20)
    if (/^(?:저는|제가|본인은)\s/.test(firstSentence)) {
      consecutiveFirstPerson++
      if (consecutiveFirstPerson >= 3) {
        occurrences.push({
          pattern: 'paragraph_start_repeat',
          excerpt: firstSentence,
        })
        break
      }
    } else {
      consecutiveFirstPerson = 0
    }
  }

  const firstPersonRatio =
    totalSentences > 0 ? Math.round((firstPersonCount / totalSentences) * 100) : 0

  let grade: FirstPersonGrade
  if (firstPersonRatio >= 60) grade = 'monotone'
  else if (firstPersonRatio >= 40) grade = 'repetitive'
  else if (firstPersonRatio >= 20) grade = 'adequate'
  else grade = 'varied'

  let summary: string
  if (grade === 'monotone') {
    summary = `전체 문장의 ${firstPersonRatio}%가 "저는/제가"로 시작합니다. 단조롭게 느껴질 수 있으니 다양한 시작으로 변경하세요.`
  } else if (grade === 'repetitive') {
    summary = `문장의 ${firstPersonRatio}%가 1인칭으로 시작합니다. 일부 문장의 시작을 바꿔 보세요.`
  } else if (grade === 'adequate') {
    summary = `1인칭 시작 비율 ${firstPersonRatio}% — 적절한 수준입니다.`
  } else {
    summary = `1인칭 반복이 없어 문장 구조가 다양합니다.`
  }

  const alternatives: string[] = []
  if (grade === 'monotone' || grade === 'repetitive') {
    alternatives.push('"당시 팀에서는..." — 상황 묘사로 시작')
    alternatives.push('"OO 경험을 통해..." — 경험 중심 시작')
    alternatives.push('"이 경험이 저에게..." — 경험의 의미로 전환')
    alternatives.push('"결과적으로 이 프로젝트는..." — 결과 중심 시작')
  }

  return {
    totalSentences,
    firstPersonSentences: firstPersonCount,
    firstPersonRatio,
    grade,
    occurrences: occurrences.slice(0, 6),
    summary,
    alternatives,
  }
}
