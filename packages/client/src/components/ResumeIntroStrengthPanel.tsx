import { useMemo } from 'react';
import { analyzeResumeIntro } from '@/lib/resumeIntroAnalyzer';

interface Props {
  text: string;
}

const STRENGTH_LABEL: Record<string, string> = {
  strong: '강함',
  moderate: '보통',
  weak: '취약',
};

export default function ResumeIntroStrengthPanel({ text }: Props) {
  const report = useMemo(() => analyzeResumeIntro(text), [text]);

  if (report.strength === 'strong') return null;
  if (!report.intro || report.intro.length < 15) return null;

  const tone =
    report.strength === 'moderate'
      ? 'neutral'
      : report.clicheHits.length >= 3
        ? 'warning'
        : 'neutral';

  return (
    <aside
      className={`intro-strength-card intro-strength-card--${tone}`}
      aria-label="이력서 도입부 강도 분석"
    >
      <header className="intro-strength-card__head">
        <span className="intro-strength-card__eyebrow">Intro strength</span>
        <span className="intro-strength-card__label">
          도입부 강도 · {STRENGTH_LABEL[report.strength]}
        </span>
      </header>

      <blockquote className="intro-strength-card__preview">
        {report.intro.slice(0, 120)}
        {report.intro.length > 120 && '…'}
      </blockquote>

      <ul className="intro-strength-card__checks" aria-label="도입부 체크">
        <li
          className={`intro-strength-card__check${report.hasCareerClaim ? '' : ' intro-strength-card__check--warn'}`}
        >
          <span className="intro-strength-card__icon" aria-hidden="true">
            {report.hasCareerClaim ? '✓' : '▲'}
          </span>
          <span>{report.hasCareerClaim ? '경력·직무 명시됨' : '경력·직무 미명시'}</span>
        </li>
        <li
          className={`intro-strength-card__check${report.hasMetric ? '' : ' intro-strength-card__check--warn'}`}
        >
          <span className="intro-strength-card__icon" aria-hidden="true">
            {report.hasMetric ? '✓' : '▲'}
          </span>
          <span>{report.hasMetric ? '수치 포함됨' : '수치 없음'}</span>
        </li>
        {report.clicheHits.length > 0 && (
          <li className="intro-strength-card__check intro-strength-card__check--warn">
            <span className="intro-strength-card__icon" aria-hidden="true">
              ▲
            </span>
            <div>
              <span>클리셰 {report.clicheHits.length}건</span>
              <div className="intro-strength-card__cliche-chips" aria-label="클리셰 목록">
                {report.clicheHits.map((h) => (
                  <mark key={h} className="intro-strength-card__cliche-chip">
                    {h}
                  </mark>
                ))}
              </div>
            </div>
          </li>
        )}
      </ul>

      <p className="intro-strength-card__suggestion">{report.suggestion}</p>
    </aside>
  );
}
