/**
 * 자기소개서 문장 어미 단조성 감지기 — 같은 어미(했습니다, 드리겠습니다 등)가
 * 연속으로 3번 이상 반복되는 패턴을 감지해 문장 다양성 개선을 유도한다.
 */

export type SentenceEnding =
  | '했습니다'
  | '입니다'
  | '드리겠습니다'
  | '겠습니다'
  | '습니다'
  | '바랍니다'
  | '됩니다'
  | '있습니다'
  | '없습니다'
  | '합니다'
  | '기타'

export interface MonotonousRun {
  ending: string
  count: number
  /** 0-based index of first sentence in this run */
  startIndex: number
  /** Sample phrases from the run (up to 2) */
  samples: string[]
}

export type EndingMonotonyGrade = 'varied' | 'adequate' | 'monotonous'

export interface EndingMonotonyReport {
  sentenceCount: number
  /** Unique ending types detected */
  uniqueEndings: number
  /** Ratio uniqueEndings / sentenceCount (0-1) */
  diversityRatio: number
  grade: EndingMonotonyGrade
  runs: MonotonousRun[]
  /** Most frequently used ending */
  dominantEnding: string | null
  dominantEndingCount: number
  suggestion: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyEnding(sentence: string): string {
  const trimmed = sentence
    .trim()
    .replace(/[.!?。]+$/, '')
    .trimEnd()
  if (!trimmed) return '기타'
  const lastWord = trimmed.split(/\s+/).pop() ?? trimmed
  // Use last 4 chars as the ending key — captures verb inflection suffix precisely.
  // "개발했습니다" → "했습니다", "최적화했습니다" → "했습니다" (same bucket)
  // "해왔습니다" → "왔습니다" vs "받았습니다" → "았습니다" (different buckets)
  // This length captures formal endings like 했/겠/었/았/됩/입니다 without over-merging.
  if (lastWord.length >= 4 && /[가-힣]/.test(lastWord)) return lastWord.slice(-4)
  if (/[가-힣]/.test(lastWord)) return lastWord
  return '기타'
}

function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation or newlines; filter noise
  return text
    .split(/(?<=[.!?。])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8 && /[가-힣]/.test(s))
}

function detectRuns(endings: string[], sentences: string[]): MonotonousRun[] {
  const runs: MonotonousRun[] = []
  if (endings.length === 0) return runs

  let runStart = 0
  let runEnding = endings[0]
  let runCount = 1
  const samples: string[] = [sentences[0].slice(0, 40)]

  const flush = (_endIdx: number) => {
    if (runCount >= 3) {
      runs.push({
        ending: runEnding,
        count: runCount,
        startIndex: runStart,
        samples: samples.slice(0, 2),
      })
    }
  }

  for (let i = 1; i < endings.length; i++) {
    if (endings[i] === runEnding) {
      runCount++
      if (samples.length < 2) samples.push(sentences[i].slice(0, 40))
    } else {
      flush(i - 1)
      runStart = i
      runEnding = endings[i]
      runCount = 1
      samples.length = 0
      samples.push(sentences[i].slice(0, 40))
    }
  }
  flush(endings.length - 1)

  return runs
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function detectCoverLetterEndingMonotony(text: string): EndingMonotonyReport {
  const t = text ?? ''
  const sentences = splitSentences(t)
  const sentenceCount = sentences.length

  if (sentenceCount < 3) {
    return {
      sentenceCount,
      uniqueEndings: 0,
      diversityRatio: 0,
      grade: 'varied',
      runs: [],
      dominantEnding: null,
      dominantEndingCount: 0,
      suggestion: '텍스트가 충분하지 않아 분석할 수 없습니다.',
    }
  }

  const endings = sentences.map(classifyEnding)
  const endingFreq = new Map<string, number>()
  for (const e of endings) {
    endingFreq.set(e, (endingFreq.get(e) ?? 0) + 1)
  }

  const uniqueEndings = endingFreq.size
  const diversityRatio = Math.round((uniqueEndings / sentenceCount) * 100) / 100

  let dominantEnding: string | null = null
  let dominantEndingCount = 0
  for (const [ending, count] of endingFreq) {
    if (count > dominantEndingCount) {
      dominantEndingCount = count
      dominantEnding = ending
    }
  }

  const runs = detectRuns(endings, sentences)
  const hasLongRun = runs.some((r) => r.count >= 4)
  const dominantRatio = dominantEndingCount / sentenceCount

  let grade: EndingMonotonyGrade
  if (hasLongRun || dominantRatio > 0.55) {
    grade = 'monotonous'
  } else if (runs.length > 0 || dominantRatio > 0.4) {
    grade = 'adequate'
  } else {
    grade = 'varied'
  }

  let suggestion: string
  if (grade === 'varied') {
    suggestion = '문장 어미가 다양하게 사용되어 글의 리듬감이 좋습니다.'
  } else if (grade === 'adequate') {
    const d = dominantEnding ?? '습니다'
    suggestion = `"${d}"로 끝나는 문장이 상대적으로 많습니다. 간헐적으로 다른 어미나 명사형(-함, -임, -성과) 또는 의문문을 섞으세요.`
  } else {
    const d = dominantEnding ?? '습니다'
    if (runs.length > 0) {
      const worst = runs.reduce((a, b) => (b.count > a.count ? b : a), runs[0])
      suggestion = `"${d}"로 끝나는 문장이 ${dominantEndingCount}회 반복됩니다. 연속 ${worst.count}회 반복 구간이 있습니다. 어미를 바꾸거나 능동형 구문으로 변환하세요.`
    } else {
      suggestion = `"${d}"로 끝나는 문장이 ${dominantEndingCount}회 반복됩니다(전체 ${sentenceCount}문장). 다른 어미나 명사형으로 변환하세요.`
    }
  }

  return {
    sentenceCount,
    uniqueEndings,
    diversityRatio,
    grade,
    runs,
    dominantEnding,
    dominantEndingCount,
    suggestion,
  }
}
