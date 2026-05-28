import { useMemo } from 'react';
import { analyzeSkillFreshness } from '@/lib/skillFreshnessAnalyzer';

interface Props {
  text: string;
}

export default function SkillFreshnessPanel({ text }: Props) {
  const report = useMemo(() => analyzeSkillFreshness(text), [text]);

  if (report.legacyCount === 0 && report.agingCount === 0) return null;
  if (text.trim().length < 40) return null;

  const isWarning = report.legacyCount >= 1;

  return (
    <aside
      className={`skill-freshness-card${isWarning ? ' skill-freshness-card--warning' : ''}`}
      aria-label="기술 스택 신선도 분석"
    >
      <header className="skill-freshness-card__head">
        <span className="skill-freshness-card__eyebrow">Skill freshness</span>
        <span
          className={`skill-freshness-card__badge${isWarning ? ' skill-freshness-card__badge--legacy' : ' skill-freshness-card__badge--aging'}`}
        >
          {isWarning ? `EOL ${report.legacyCount}개` : `노후화 ${report.agingCount}개`}
        </span>
      </header>

      <p className="skill-freshness-card__hint">{report.suggestion}</p>

      {report.legacySkills.length > 0 && (
        <section className="skill-freshness-card__section" aria-label="EOL 기술">
          <h4 className="skill-freshness-card__section-title">EOL / 단종 기술</h4>
          <ul className="skill-freshness-card__list">
            {report.legacySkills.map((item, i) => (
              <li key={i} className="skill-freshness-card__item skill-freshness-card__item--legacy">
                <span className="skill-freshness-card__skill">{item.skill}</span>
                <span className="skill-freshness-card__note">{item.note}</span>
                {item.modernAlternative && (
                  <span className="skill-freshness-card__alt">→ {item.modernAlternative}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.agingSkills.length > 0 && (
        <section className="skill-freshness-card__section" aria-label="노후화 기술">
          <h4 className="skill-freshness-card__section-title">사용 빈도 감소 기술</h4>
          <ul className="skill-freshness-card__list">
            {report.agingSkills.map((item, i) => (
              <li key={i} className="skill-freshness-card__item skill-freshness-card__item--aging">
                <span className="skill-freshness-card__skill">{item.skill}</span>
                <span className="skill-freshness-card__note">{item.note}</span>
                {item.modernAlternative && (
                  <span className="skill-freshness-card__alt">→ {item.modernAlternative}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
