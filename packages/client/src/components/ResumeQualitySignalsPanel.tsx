import { useState, useMemo } from 'react';
import { detectEmptyClaims, analyzeVerbTense, detectAllCapsOveruse } from '@/lib/qualitySignals';
import { analyzeNumericFormat } from '@/lib/numericFormat';
import { estimateReadingTime } from '@/lib/metaUtils';

interface Props {
  text: string;
}

export default function ResumeQualitySignalsPanel({ text }: Props) {
  const emptyClaims = useMemo(() => detectEmptyClaims(text), [text]);
  const tense = useMemo(() => analyzeVerbTense(text), [text]);
  const allCaps = useMemo(() => detectAllCapsOveruse(text), [text]);
  const numericFmt = useMemo(() => analyzeNumericFormat(text), [text]);
  const readingTime = useMemo(() => estimateReadingTime(text), [text]);
  const [expanded, setExpanded] = useState(false);

  const tenseGood = tense.dominant === 'past' || tense.dominant === 'none';
  const claimsGood = emptyClaims.level === 'none';
  const capsGood = allCaps.count === 0;
  const numericGood = numericFmt.consistent || numericFmt.distinct <= 1;
  // Warn if too thin (< 0.5 min = < ~150 chars) or too long (> 4 min = > ~1200 chars)
  const readingThin = readingTime.minutes < 0.5 && readingTime.chars > 0;
  const readingLong = readingTime.minutes > 4;
  const readingOk = !readingThin && !readingLong;

  const hasIssues = !claimsGood || !tenseGood || !capsGood || !numericGood || !readingOk;
  if (!hasIssues) return null;

  const issueCount = [!tenseGood, !claimsGood, !capsGood, !numericGood, !readingOk].filter(
    Boolean,
  ).length;
  const tone =
    issueCount === 0
      ? 'good'
      : emptyClaims.level === 'many' || tense.dominant === 'mixed'
        ? 'warning'
        : 'neutral';

  const visibleHits = expanded ? emptyClaims.hits : emptyClaims.hits.slice(0, 2);
  const remaining = emptyClaims.hits.length - visibleHits.length;

  return (
    <aside
      className={`quality-signals-card quality-signals-card--${tone}`}
      aria-label="이력서 품질 신호 분석"
    >
      <header className="quality-signals-card__head">
        <span className="quality-signals-card__eyebrow">Quality signals</span>
        <span className="quality-signals-card__label">
          {issueCount === 0 ? '이상 없음' : `${issueCount}가지 개선점`}
        </span>
      </header>

      <ul className="quality-signals-card__checks" aria-label="품질 항목">
        {/* Verb tense */}
        <li
          className={`quality-signals-card__check${tenseGood ? '' : ' quality-signals-card__check--warn'}`}
          aria-label="시제 일관성"
        >
          <span className="quality-signals-card__icon" aria-hidden="true">
            {tenseGood ? '✓' : '▲'}
          </span>
          <div>
            <strong>시제 일관성</strong>
            {tense.total > 0 && (
              <span className="quality-signals-card__meta">
                과거 {tense.past} · 현재 {tense.present} · 미래 {tense.future}
              </span>
            )}
            <p className="quality-signals-card__hint">{tense.suggestion}</p>
          </div>
        </li>

        {/* ALL CAPS overuse */}
        {!capsGood && (
          <li
            className="quality-signals-card__check quality-signals-card__check--warn"
            aria-label="ALL CAPS 과용"
          >
            <span className="quality-signals-card__icon" aria-hidden="true">
              ▲
            </span>
            <div>
              <strong>ALL CAPS 과용</strong>
              <span className="quality-signals-card__meta">{allCaps.count}건</span>
              <p className="quality-signals-card__hint">{allCaps.suggestion}</p>
              {allCaps.hits.length > 0 && (
                <div className="quality-signals-card__hits" aria-label="ALL CAPS 단어 목록">
                  {allCaps.hits.slice(0, 5).map((h) => (
                    <mark key={`${h.word}-${h.index}`} className="quality-signals-card__hit-phrase">
                      {h.word}
                    </mark>
                  ))}
                </div>
              )}
            </div>
          </li>
        )}

        {/* Numeric format */}
        {!numericGood && (
          <li
            className="quality-signals-card__check quality-signals-card__check--warn"
            aria-label="숫자 포맷 혼재"
          >
            <span className="quality-signals-card__icon" aria-hidden="true">
              ▲
            </span>
            <div>
              <strong>숫자 포맷 혼재</strong>
              <span className="quality-signals-card__meta">
                쉼표형 {numericFmt.comma} · 단순형 {numericFmt.plain} · 한글형 {numericFmt.korean}
              </span>
              <p className="quality-signals-card__hint">{numericFmt.suggestion}</p>
            </div>
          </li>
        )}

        {/* Reading length */}
        {!readingOk && (
          <li
            className="quality-signals-card__check quality-signals-card__check--warn"
            aria-label="이력서 분량"
          >
            <span className="quality-signals-card__icon" aria-hidden="true">
              ▲
            </span>
            <div>
              <strong>이력서 분량</strong>
              <span className="quality-signals-card__meta">
                {readingTime.label} ({readingTime.chars.toLocaleString()}자)
              </span>
              <p className="quality-signals-card__hint">
                {readingThin
                  ? '내용이 너무 적습니다. 경력·기술·성과를 더 자세히 기술해 주세요.'
                  : '이력서가 너무 깁니다. 핵심 내용 위주로 압축하면 가독성이 높아집니다.'}
              </p>
            </div>
          </li>
        )}

        {/* Empty claims */}
        {emptyClaims.level !== 'none' && (
          <li
            className={`quality-signals-card__check quality-signals-card__check--warn`}
            aria-label="빈 주장"
          >
            <span className="quality-signals-card__icon" aria-hidden="true">
              ▲
            </span>
            <div>
              <strong>빈 주장</strong>
              <span className="quality-signals-card__meta">{emptyClaims.count}건</span>
              <p className="quality-signals-card__hint">{emptyClaims.suggestion}</p>
              {visibleHits.length > 0 && (
                <ul className="quality-signals-card__hits" aria-label="빈 주장 목록">
                  {visibleHits.map((h, i) => (
                    <li key={`${h.phrase}-${i}`} className="quality-signals-card__hit">
                      <mark className="quality-signals-card__hit-phrase">{h.phrase}</mark>
                      <span className="quality-signals-card__hit-reason">{h.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
              {remaining > 0 && (
                <button
                  type="button"
                  className="quality-signals-card__toggle"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? '접기' : `+${remaining}개 더 보기`}
                </button>
              )}
            </div>
          </li>
        )}
      </ul>
    </aside>
  );
}
