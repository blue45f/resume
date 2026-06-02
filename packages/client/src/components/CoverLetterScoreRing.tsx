import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { buildCoverLetterScore } from '@/lib/coverLetterScore';
import type { CoverLetterScoreGrade } from '@/lib/coverLetterScore';
import { useCountUp } from '@/hooks/useCountUp';

interface Props {
  text: string;
}

const GRADE_LABEL: Record<CoverLetterScoreGrade, string> = {
  excellent: '최상',
  good: '양호',
  fair: '보통',
  weak: '보강 필요',
};

const RADIUS = 48;
const CIRC = 2 * Math.PI * RADIUS;

export default function CoverLetterScoreRing({ text }: Props) {
  const report = useMemo(() => buildCoverLetterScore(text), [text]);
  const hasEnoughText = text.trim().length >= 80;
  // hooks 는 조건부 return 전에 호출 (Rules of Hooks). 링 채움(0.85s)과 같은 호흡으로 count-up.
  const animatedOverall = useCountUp(hasEnoughText ? report.overall : 0, { durationMs: 900 });

  if (!hasEnoughText) return null;

  const offset = CIRC * (1 - report.overall / 100);
  const ringStyle = {
    '--ring-c': `${CIRC}`,
    '--ring-offset': `${offset}`,
  } as CSSProperties;

  return (
    <section className={`cl-ring cl-ring--${report.grade}`} aria-label="자기소개서 종합 점수">
      <div className="cl-ring__chart">
        <svg
          viewBox="0 0 120 120"
          className="cl-ring__svg"
          role="img"
          aria-label={`종합 ${report.overall}점`}
        >
          <circle className="cl-ring__track" cx="60" cy="60" r={RADIUS} />
          <circle
            className="cl-ring__value"
            cx="60"
            cy="60"
            r={RADIUS}
            style={ringStyle}
            transform="rotate(-90 60 60)"
          />
          <text className="cl-ring__num" x="60" y="58" textAnchor="middle" aria-hidden="true">
            {animatedOverall}
          </text>
          <text className="cl-ring__unit" x="60" y="74" textAnchor="middle">
            {GRADE_LABEL[report.grade]}
          </text>
        </svg>
      </div>

      <div className="cl-ring__detail">
        <div className="cl-ring__head">
          <span className="cl-ring__title">📨 자기소개서 점수</span>
        </div>
        <p className="cl-ring__headline">{report.headline}</p>
        <ul className="cl-ring__axes">
          {report.axes.map((a) => (
            <li key={a.key} className="cl-ring__axis">
              <span className="cl-ring__axis-label">{a.label}</span>
              <span className="cl-ring__bar">
                <span className="cl-ring__bar-fill" style={{ width: `${a.score}%` }} />
              </span>
              <span className="cl-ring__axis-score">{a.score}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
