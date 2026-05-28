import { useMemo } from 'react';
import { analyzeDateConsistency } from '@/lib/dateAnalyzers';

interface Props {
  text: string;
}

const FORMAT_LABEL: Record<string, string> = {
  dot: 'YYYY.MM',
  hyphen: 'YYYY-MM',
  slash: 'YYYY/MM',
  korean: 'YYYY년 MM월',
  other: '기타',
};

export default function ResumeDateConsistencyPanel({ text }: Props) {
  const analysis = useMemo(() => analyzeDateConsistency(text), [text]);

  if (analysis.consistent || analysis.hits.length === 0) return null;

  return (
    <aside className="date-cons-card" aria-label="날짜 포맷 일관성 분석">
      <header className="date-cons-card__head">
        <span className="date-cons-card__eyebrow">date format</span>
        <span className="date-cons-card__title">날짜 표기 혼재</span>
        <span className="date-cons-card__badge">{analysis.distinctFormats}종 혼재</span>
      </header>

      <p className="date-cons-card__suggestion">{analysis.suggestion}</p>

      <div className="date-cons-card__formats" aria-label="감지된 날짜 포맷">
        {(Object.entries(analysis.formatCounts) as [string, number][])
          .filter(([, count]) => count > 0)
          .sort(([, a], [, b]) => b - a)
          .map(([fmt, count]) => (
            <span
              key={fmt}
              className={`date-cons-card__fmt${fmt === analysis.dominantFormat ? ' date-cons-card__fmt--dominant' : ''}`}
            >
              <code>{FORMAT_LABEL[fmt] ?? fmt}</code>
              <span className="date-cons-card__fmt-count">×{count}</span>
            </span>
          ))}
      </div>

      <p className="date-cons-card__tip">
        가장 많이 쓰인 <code>{FORMAT_LABEL[analysis.dominantFormat ?? 'dot']}</code> 형식으로
        통일하세요.
      </p>
    </aside>
  );
}
