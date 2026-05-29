import { useMemo } from 'react';
import { buildJdSignalDashboard } from '@/lib/jdSignalDashboard';

interface Props {
  text: string;
}

export default function JdSignalDashboard({ text }: Props) {
  const report = useMemo(() => buildJdSignalDashboard(text), [text]);

  if (text.trim().length < 60) return null;

  const overallTone =
    report.concernCount >= 1 ? 'concern' : report.cautionCount >= 3 ? 'caution' : 'good';

  return (
    <section className={`jd-board jd-board--${overallTone}`} aria-label="채용공고 신호등 대시보드">
      <header className="jd-board__head">
        <span className="jd-board__title">📊 공고 신호등</span>
        <div className="jd-board__counts" aria-label="신호 요약">
          <span className="jd-board__count jd-board__count--good">양호 {report.goodCount}</span>
          <span className="jd-board__count jd-board__count--caution">
            주의 {report.cautionCount}
          </span>
          <span className="jd-board__count jd-board__count--concern">
            우려 {report.concernCount}
          </span>
        </div>
      </header>

      <p className="jd-board__headline">{report.headline}</p>

      <div className="jd-board__grid">
        {report.signals.map((s) => (
          <div key={s.key} className={`jd-board__cell jd-board__cell--${s.status}`}>
            <span className="jd-board__dot" aria-hidden="true" />
            <span className="jd-board__label">{s.label}</span>
            <span className="jd-board__note">{s.note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
