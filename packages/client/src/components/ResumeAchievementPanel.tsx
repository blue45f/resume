import { useMemo } from 'react';
import { countAchievements, analyzeActionVerbs } from '@/lib/achievementSignals';

interface Props {
  text: string;
}

export default function ResumeAchievementPanel({ text }: Props) {
  const achievements = useMemo(() => countAchievements(text), [text]);
  const verbs = useMemo(() => analyzeActionVerbs(text), [text]);

  const achIssue = achievements.level === 'low';
  const verbIssue = verbs.level === 'low';
  if (!achIssue && !verbIssue && achievements.total === 0) return null;
  if (text.trim().length < 100) return null;

  const tone = achIssue && verbIssue ? 'warning' : achIssue || verbIssue ? 'neutral' : 'good';

  return (
    <aside
      className={`achievement-card achievement-card--${tone}`}
      aria-label="이력서 성취 밀도 분석"
    >
      <header className="achievement-card__head">
        <span className="achievement-card__eyebrow">Achievement density</span>
        <span className="achievement-card__label">
          성취 {achievements.total}건 · 강한동사 {verbs.strong}건
        </span>
      </header>

      {/* Achievement keywords */}
      <section className="achievement-card__section" aria-label="객관적 성취">
        <h4 className="achievement-card__section-title">객관적 성취</h4>
        {achievements.total > 0 ? (
          <>
            <div className="achievement-card__chips">
              {achievements.byKeyword.slice(0, 6).map((k) => (
                <span key={k.keyword} className="achievement-card__chip">
                  {k.keyword}
                  <span className="achievement-card__chip-count">×{k.count}</span>
                </span>
              ))}
            </div>
            <p className="achievement-card__hint">{achievements.suggestion}</p>
          </>
        ) : (
          <p className="achievement-card__hint achievement-card__hint--warn">
            {achievements.suggestion}
          </p>
        )}
      </section>

      {/* Action verb strength */}
      {verbs.strong + verbs.weak >= 3 && (
        <section className="achievement-card__section" aria-label="액션 동사 강도">
          <h4 className="achievement-card__section-title">액션 동사 강도</h4>
          <div className="achievement-card__verb-meter">
            <span className="achievement-card__verb-label achievement-card__verb-label--strong">
              강 {verbs.strong}
            </span>
            <div className="achievement-card__verb-bar" aria-hidden="true">
              <span
                className="achievement-card__verb-fill"
                style={{ ['--verb-ratio' as never]: String(verbs.ratio) }}
              />
            </div>
            <span className="achievement-card__verb-label achievement-card__verb-label--weak">
              약 {verbs.weak}
            </span>
          </div>
          {verbs.topWeak.length > 0 && (
            <div className="achievement-card__weak-chips">
              {verbs.topWeak.map((v) => (
                <span key={v} className="achievement-card__weak-chip">
                  {v}
                </span>
              ))}
            </div>
          )}
          <p className="achievement-card__hint">{verbs.suggestion}</p>
        </section>
      )}
    </aside>
  );
}
