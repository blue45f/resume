import { useMemo } from 'react'

import { analyzeSentiment, analyzeFirstPersonUsage, analyzeEnglishMix } from '@/lib/toneAnalyzers'

interface Props {
  text: string
}

const TONE_LABEL: Record<string, string> = {
  positive: '긍정적',
  balanced: '균형적',
  negative: '부정적',
  none: '중립',
}

const LEVEL_LABEL: Record<string, string> = {
  low: '적음',
  medium: '보통',
  high: '많음',
}

export default function CoverLetterTonePanel({ text }: Props) {
  const sentiment = useMemo(() => analyzeSentiment(text), [text])
  const firstPerson = useMemo(() => analyzeFirstPersonUsage(text), [text])
  const englishMix = useMemo(() => analyzeEnglishMix(text), [text])

  if (text.trim().length < 80) return null
  if (sentiment.tone === 'none' && firstPerson.total === 0) return null

  const toneGood = sentiment.tone === 'positive' || sentiment.tone === 'balanced'
  const fp1pGood = firstPerson.level !== 'high'
  const engGood = englishMix.level !== 'high'
  const issueCount = [!toneGood, !fp1pGood, !engGood].filter(Boolean).length
  const tone = issueCount === 0 ? 'good' : issueCount === 1 ? 'neutral' : 'warning'

  return (
    <aside className={`cl-tone-card cl-tone-card--${tone}`} aria-label="자기소개서 톤 분석">
      <header className="cl-tone-card__head">
        <span className="cl-tone-card__eyebrow">Writing tone</span>
        <span className="cl-tone-card__label">
          {TONE_LABEL[sentiment.tone]} {issueCount === 0 ? '· 양호' : `· ${issueCount}개 개선점`}
        </span>
      </header>

      <ul className="cl-tone-card__checks" aria-label="톤 분석 항목">
        {/* Sentiment */}
        <li
          className={`cl-tone-card__check${toneGood ? '' : ' cl-tone-card__check--warn'}`}
          aria-label="감성 어조"
        >
          <span className="cl-tone-card__check-icon" aria-hidden="true">
            {toneGood ? '✓' : '▲'}
          </span>
          <div className="cl-tone-card__check-body">
            <strong>감성 어조</strong>
            <span className={`cl-tone-card__badge cl-tone-card__badge--${sentiment.tone}`}>
              {TONE_LABEL[sentiment.tone]}
            </span>
            <p className="cl-tone-card__check-hint">{sentiment.suggestion}</p>
          </div>
        </li>

        {/* First person */}
        <li
          className={`cl-tone-card__check${fp1pGood ? '' : ' cl-tone-card__check--warn'}`}
          aria-label="1인칭 사용 빈도"
        >
          <span className="cl-tone-card__check-icon" aria-hidden="true">
            {fp1pGood ? '✓' : '▲'}
          </span>
          <div className="cl-tone-card__check-body">
            <strong>1인칭 빈도</strong>
            <span className={`cl-tone-card__badge cl-tone-card__badge--fp-${firstPerson.level}`}>
              {LEVEL_LABEL[firstPerson.level]} ({firstPerson.total}회)
            </span>
            <p className="cl-tone-card__check-hint">{firstPerson.suggestion}</p>
          </div>
        </li>

        {/* English mix */}
        <li
          className={`cl-tone-card__check${engGood ? '' : ' cl-tone-card__check--warn'}`}
          aria-label="영어 혼용 비율"
        >
          <span className="cl-tone-card__check-icon" aria-hidden="true">
            {engGood ? '✓' : '▲'}
          </span>
          <div className="cl-tone-card__check-body">
            <strong>영어 혼용</strong>
            <span className={`cl-tone-card__badge cl-tone-card__badge--eng-${englishMix.level}`}>
              {Math.round(englishMix.englishRatio * 100)}%
            </span>
            <p className="cl-tone-card__check-hint">{englishMix.suggestion}</p>
          </div>
        </li>
      </ul>
    </aside>
  )
}
