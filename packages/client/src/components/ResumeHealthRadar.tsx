import { useMemo } from 'react';
import { buildResumeHealthRadar } from '@/lib/resumeHealthRadar';
import type { RadarGrade } from '@/lib/resumeHealthRadar';

interface Props {
  text: string;
}

const GRADE_LABEL: Record<RadarGrade, string> = {
  excellent: '최상',
  good: '양호',
  fair: '보통',
  weak: '보강 필요',
};

// SVG geometry
const VB_W = 280;
const VB_H = 232;
const CX = 140;
const CY = 104;
const R = 72;
const AXES = 6;
const RING_FRACTIONS = [0.25, 0.5, 0.75, 1];

function vertex(index: number, frac: number): [number, number] {
  const angle = ((-90 + index * (360 / AXES)) * Math.PI) / 180;
  return [CX + R * frac * Math.cos(angle), CY + R * frac * Math.sin(angle)];
}

function ringPath(frac: number): string {
  return Array.from({ length: AXES }, (_, i) => vertex(i, frac).join(','))
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`)
    .join(' ')
    .concat(' Z');
}

function labelAnchor(index: number): 'start' | 'middle' | 'end' {
  const angle = ((-90 + index * (360 / AXES)) * Math.PI) / 180;
  const cos = Math.cos(angle);
  if (cos > 0.3) return 'start';
  if (cos < -0.3) return 'end';
  return 'middle';
}

export default function ResumeHealthRadar({ text }: Props) {
  const report = useMemo(() => buildResumeHealthRadar(text), [text]);

  if (text.trim().length < 60) return null;

  const dataPoints = report.axes.map((a, i) => vertex(i, a.score / 100));
  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.join(',')}`).join(' ') + ' Z';

  return (
    <section className={`radar radar--${report.grade}`} aria-label="이력서 건강 레이더">
      <header className="radar__head">
        <span className="radar__eyebrow">이력서 건강 레이더</span>
        <span className="radar__badge">{GRADE_LABEL[report.grade]}</span>
      </header>

      <div className="radar__body">
        <div className="radar__chart-wrap">
          <svg
            className="radar__chart"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            role="img"
            aria-label={`6개 축 종합 점수 ${report.overall}점`}
          >
            {/* grid rings */}
            {RING_FRACTIONS.map((f) => (
              <path key={f} className="radar__ring" d={ringPath(f)} />
            ))}
            {/* spokes */}
            {report.axes.map((_, i) => {
              const [x, y] = vertex(i, 1);
              return <line key={i} className="radar__spoke" x1={CX} y1={CY} x2={x} y2={y} />;
            })}
            {/* data polygon */}
            <path className="radar__area" d={dataPath} />
            {/* data dots */}
            {dataPoints.map(([x, y], i) => (
              <circle key={i} className="radar__dot" cx={x} cy={y} r={3.2} />
            ))}
            {/* axis labels + scores */}
            {report.axes.map((a, i) => {
              const [lx, ly] = vertex(i, 1.34);
              const anchor = labelAnchor(i);
              return (
                <text key={a.key} className="radar__axis-label" x={lx} y={ly} textAnchor={anchor}>
                  <tspan x={lx} dy={i === 3 ? 10 : 0}>
                    {a.label}
                  </tspan>
                  <tspan x={lx} dy="11" className="radar__axis-score">
                    {a.score}
                  </tspan>
                </text>
              );
            })}
          </svg>
        </div>

        <div className="radar__readout">
          <div className="radar__overall" aria-label={`종합 ${report.overall}점`}>
            <span className="radar__overall-num">{report.overall}</span>
            <span className="radar__overall-unit">/100</span>
          </div>
          <p className="radar__headline">{report.headline}</p>
          <div className="radar__tags">
            {report.topStrength && (
              <span className="radar__tag radar__tag--up">↑ {report.topStrength.label}</span>
            )}
            {report.topWeakness && report.topWeakness.key !== report.topStrength?.key && (
              <span className="radar__tag radar__tag--down">↓ {report.topWeakness.label}</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
