import { useMemo } from 'react'

import {
  analyzeReadability,
  analyzeLength,
  countSentencesByEnding,
} from '@/lib/readabilityAnalyzers'

interface Props {
  text: string
}

const LEVEL_KO: Record<string, string> = {
  easy: '읽기 쉬움',
  ok: '적정',
  hard: '복잡함',
}

const DOMINANT_KO: Record<string, string> = {
  formal: '합니다체',
  declarative: '다./했다체',
  polite: '해요체',
  mixed: '혼합',
  none: '-',
}

export default function CoverLetterReadabilityPanel({ text }: Props) {
  const readability = useMemo(() => analyzeReadability(text), [text])
  const length = useMemo(() => analyzeLength(text), [text])
  const endings = useMemo(() => countSentencesByEnding(text), [text])

  if (text.trim().length < 80 || readability.sentenceCount < 3) return null

  const isHard = readability.level === 'hard'
  const hasMixedStyle = endings.dominant === 'mixed'
  const issueCount = [isHard, hasMixedStyle].filter(Boolean).length
  const tone = isHard ? 'warning' : hasMixedStyle ? 'neutral' : 'good'

  return (
    <aside
      className={`cl-readability-card cl-readability-card--${tone}`}
      aria-label="자기소개서 가독성 분석"
    >
      <header className="cl-readability-card__head">
        <span className="cl-readability-card__eyebrow">Readability</span>
        <span className="cl-readability-card__label">
          {LEVEL_KO[readability.level]} · {readability.readabilityScore}점
          {issueCount > 0 && ` · ${issueCount}개 개선점`}
        </span>
      </header>

      {/* Stats row */}
      <dl className="cl-readability-card__stats">
        <div className="cl-readability-card__stat">
          <dt>글자</dt>
          <dd>{length.charsWithoutSpaces.toLocaleString()}</dd>
        </div>
        <div className="cl-readability-card__stat">
          <dt>단어</dt>
          <dd>{length.words}</dd>
        </div>
        <div className="cl-readability-card__stat">
          <dt>문단</dt>
          <dd>{length.paragraphs}</dd>
        </div>
        <div className="cl-readability-card__stat">
          <dt>문장당 평균</dt>
          <dd>{readability.avgSentenceLength}자</dd>
        </div>
      </dl>

      <p className="cl-readability-card__hint">{readability.suggestion}</p>

      {/* Sentence ending style */}
      {endings.total >= 5 && (
        <div className="cl-readability-card__style">
          <span className="cl-readability-card__style-label">문체</span>
          <span
            className={`cl-readability-card__style-badge cl-readability-card__style-badge--${endings.dominant}`}
          >
            {DOMINANT_KO[endings.dominant]}
          </span>
          {endings.dominant === 'mixed' && (
            <span className="cl-readability-card__style-note">
              합{endings.formal} / 다{endings.declarative} / 요{endings.polite} — 한 가지로
              통일하세요
            </span>
          )}
        </div>
      )}
    </aside>
  )
}
