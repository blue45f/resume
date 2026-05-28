import { useMemo } from 'react';
import {
  analyzePassiveVoice,
  analyzeSentenceEndings,
  analyzeSentenceStarts,
} from '@/lib/sentenceStructure';

interface Props {
  text: string;
}

export default function ResumeVoicePanel({ text }: Props) {
  const passive = useMemo(() => analyzePassiveVoice(text), [text]);
  const endings = useMemo(() => analyzeSentenceEndings(text), [text]);
  const starts = useMemo(() => analyzeSentenceStarts(text), [text]);

  const passiveIssue = passive.level === 'high' || passive.level === 'medium';
  const endingIssue = endings.monotonyScore >= 60;
  const startsIssue = starts.repeatedStartRatio >= 0.4 && starts.totalSentences >= 5;
  if (!passiveIssue && !endingIssue && !startsIssue) return null;

  const issueCount = [passiveIssue, endingIssue, startsIssue].filter(Boolean).length;
  const tone = passive.level === 'high' || endings.monotonyScore >= 80 ? 'warning' : 'neutral';

  return (
    <aside
      className={`resume-voice-card resume-voice-card--${tone}`}
      aria-label="이력서 문장 능동성 분석"
    >
      <header className="resume-voice-card__head">
        <span className="resume-voice-card__eyebrow">Voice &amp; variety</span>
        <span className="resume-voice-card__label">
          {issueCount === 0 ? '양호' : `${issueCount}가지 개선점`}
        </span>
      </header>

      <ul className="resume-voice-card__checks" aria-label="문장 능동성 항목">
        {/* Passive voice */}
        <li
          className={`resume-voice-card__check${passiveIssue ? ' resume-voice-card__check--warn' : ''}`}
          aria-label="수동태 비율"
        >
          <span className="resume-voice-card__icon" aria-hidden="true">
            {passiveIssue ? '▲' : '✓'}
          </span>
          <div>
            <strong>수동태</strong>
            <span className="resume-voice-card__badge">
              {passive.passiveCount}건 / 능동 {passive.activeCount}건
            </span>
            <p className="resume-voice-card__hint">{passive.suggestion}</p>
            {passive.examples.length > 0 && (
              <ul className="resume-voice-card__examples" aria-label="수동태 예시">
                {passive.examples.map((e, i) => (
                  <li key={`${e.phrase}-${i}`}>
                    <code className="resume-voice-card__example-phrase">{e.phrase}</code>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>

        {/* Sentence ending variety */}
        {endings.total >= 5 && (
          <li
            className={`resume-voice-card__check${endingIssue ? ' resume-voice-card__check--warn' : ''}`}
            aria-label="종결어미 다양성"
          >
            <span className="resume-voice-card__icon" aria-hidden="true">
              {endingIssue ? '▲' : '✓'}
            </span>
            <div>
              <strong>종결어미 다양성</strong>
              <span className="resume-voice-card__badge">단조로움 {endings.monotonyScore}점</span>
              <p className="resume-voice-card__hint">{endings.suggestion}</p>
              {endings.dominantEndings.length > 0 && (
                <div className="resume-voice-card__ending-chips">
                  {endings.dominantEndings.slice(0, 4).map((e) => (
                    <span
                      key={e.ending}
                      className={`resume-voice-card__ending-chip${e.percent >= 50 ? ' resume-voice-card__ending-chip--dominant' : ''}`}
                    >
                      {e.ending} <span>{Math.round(e.percent)}%</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </li>
        )}

        {/* Sentence start variety */}
        {startsIssue && (
          <li
            className="resume-voice-card__check resume-voice-card__check--warn"
            aria-label="문장 시작 반복"
          >
            <span className="resume-voice-card__icon" aria-hidden="true">
              ▲
            </span>
            <div>
              <strong>문장 시작 반복</strong>
              <span className="resume-voice-card__badge">
                {Math.round(starts.repeatedStartRatio * 100)}% 반복
              </span>
              <p className="resume-voice-card__hint">{starts.suggestion}</p>
              {starts.topStarts.length > 0 && (
                <div className="resume-voice-card__ending-chips">
                  {starts.topStarts.slice(0, 3).map((s) => (
                    <span
                      key={s.word}
                      className={`resume-voice-card__ending-chip${s.percent >= 30 ? ' resume-voice-card__ending-chip--dominant' : ''}`}
                    >
                      {s.word} <span>{Math.round(s.percent)}%</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </li>
        )}
      </ul>
    </aside>
  );
}
