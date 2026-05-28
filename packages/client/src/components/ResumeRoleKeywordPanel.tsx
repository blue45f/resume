import { useMemo } from 'react';
import { analyzeRoleKeywordGap } from '@/lib/roleKeywordGapAnalyzer';

interface Props {
  text: string;
}

export default function ResumeRoleKeywordPanel({ text }: Props) {
  const report = useMemo(() => analyzeRoleKeywordGap(text), [text]);

  if (report.category === 'unknown') return null;
  if (report.score >= 70) return null;
  if (report.missing.length === 0) return null;

  const tone = report.score < 40 ? 'warning' : 'neutral';
  const fill = Math.max(0.04, report.score / 100);

  return (
    <aside
      className={`role-kw-card role-kw-card--${tone}`}
      aria-label={`${report.categoryLabel} 역할 키워드 갭 분석`}
    >
      <header className="role-kw-card__head">
        <span className="role-kw-card__eyebrow">Role keywords</span>
        <span className="role-kw-card__label">
          {report.categoryLabel} · {report.score}%
        </span>
      </header>

      <div
        className="role-kw-card__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={report.score}
        aria-label={`${report.categoryLabel} 키워드 충족률`}
      >
        <span
          className="role-kw-card__meter-fill"
          style={{ ['--role-kw-fill' as never]: String(fill) }}
        />
      </div>

      <p className="role-kw-card__hint">{report.suggestion}</p>

      {report.missing.length > 0 && (
        <section className="role-kw-card__section" aria-label="누락 키워드">
          <h4 className="role-kw-card__section-title">추가 권장 키워드</h4>
          <div className="role-kw-card__chips">
            {report.missing.slice(0, 6).map((kw) => (
              <span key={kw} className="role-kw-card__chip role-kw-card__chip--missing">
                {kw}
              </span>
            ))}
          </div>
        </section>
      )}

      {report.matched.length > 0 && (
        <section className="role-kw-card__section" aria-label="보유 키워드">
          <h4 className="role-kw-card__section-title">이미 포함된 키워드</h4>
          <div className="role-kw-card__chips">
            {report.matched.slice(0, 6).map((kw) => (
              <span key={kw} className="role-kw-card__chip role-kw-card__chip--matched">
                {kw}
              </span>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
