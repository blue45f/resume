import { useMemo } from 'react';
import { analyzeCareerProgression } from '@/lib/careerProgressionAnalyzer';

interface Props {
  text: string;
}

export default function CareerProgressionPanel({ text }: Props) {
  const report = useMemo(() => analyzeCareerProgression(text), [text]);

  if (report.clarity === 'clear') return null;
  if (text.trim().length < 60) return null;

  const isWarning = report.clarity === 'unclear';

  const typeIcon: Record<string, string> = {
    promotion: '⬆',
    scope: '↔',
    team_growth: '📈',
    role_change: '🔄',
  };

  return (
    <aside
      className={`career-prog-card${isWarning ? ' career-prog-card--warning' : ''}`}
      aria-label="커리어 성장 가시성 분석"
    >
      <header className="career-prog-card__head">
        <span className="career-prog-card__eyebrow">Career progression</span>
        <span className={`career-prog-card__badge career-prog-card__badge--${report.clarity}`}>
          {report.clarity === 'unclear' ? '미검출' : '일부 검출'}
        </span>
      </header>

      <p className="career-prog-card__hint">{report.suggestion}</p>

      {report.signals.length > 0 && (
        <section className="career-prog-card__signals" aria-label="검출된 성장 신호">
          <h4 className="career-prog-card__section-title">검출된 성장 신호</h4>
          <ul className="career-prog-card__signal-list">
            {report.signals.map((s, i) => (
              <li key={i} className="career-prog-card__signal-item">
                <span className="career-prog-card__signal-icon" aria-hidden="true">
                  {typeIcon[s.type] ?? '•'}
                </span>
                <span className="career-prog-card__signal-label">{s.label}</span>
                <span className="career-prog-card__signal-text">"{s.text}"</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.clarity === 'unclear' && (
        <section className="career-prog-card__tips" aria-label="추가 권장사항">
          <h4 className="career-prog-card__section-title">추가하면 좋은 내용</h4>
          <ul className="career-prog-card__tip-list">
            <li>직책 변화 — 시니어/리드/팀장으로 승진한 연도 명시</li>
            <li>팀 규모 — 관리/리드한 인원 수 (예: "5명 팀 리드")</li>
            <li>책임 확대 — 담당 서비스나 시스템 규모 변화</li>
            <li>성과 지표 — MAU, 매출, 처리량 등의 성장 전후 수치</li>
          </ul>
        </section>
      )}
    </aside>
  );
}
