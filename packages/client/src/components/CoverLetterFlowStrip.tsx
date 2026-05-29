import { useMemo } from 'react';
import { buildCoverLetterFlowMap, FLOW_BLOCK_LABEL } from '@/lib/coverLetterFlowMap';
import type { FlowBlock } from '@/lib/coverLetterFlowMap';

interface Props {
  text: string;
}

const LEGEND_ORDER: FlowBlock[] = [
  'motivation',
  'competency',
  'experience',
  'aspiration',
  'narrative',
];

export default function CoverLetterFlowStrip({ text }: Props) {
  const report = useMemo(() => buildCoverLetterFlowMap(text), [text]);

  if (text.trim().length < 80) return null;
  if (report.paragraphCount === 0) return null;

  const usedBlocks = LEGEND_ORDER.filter((b) => report.segments.some((s) => s.block === b));

  return (
    <section className="flow-strip" aria-label="자기소개서 흐름 맵">
      <header className="flow-strip__head">
        <span className="flow-strip__title">🗺️ 자기소개서 흐름</span>
        <span className="flow-strip__meta">{report.paragraphCount}문단</span>
      </header>

      <div className="flow-strip__bar" role="img" aria-label="문단별 내용 블록 구성">
        {report.segments.map((seg) => (
          <div
            key={seg.index}
            className={`flow-strip__seg flow-strip__seg--${seg.block}`}
            style={{ flexGrow: Math.max(1, Math.round(seg.weight * 100)) }}
            title={`${FLOW_BLOCK_LABEL[seg.block]} · ${seg.preview}`}
          >
            <span className="flow-strip__seg-label">{FLOW_BLOCK_LABEL[seg.block]}</span>
          </div>
        ))}
      </div>

      <div className="flow-strip__legend">
        {usedBlocks.map((b) => (
          <span key={b} className={`flow-strip__legend-item flow-strip__legend-item--${b}`}>
            {FLOW_BLOCK_LABEL[b]}
          </span>
        ))}
      </div>

      {report.notes.length > 0 && (
        <ul className="flow-strip__notes" aria-label="흐름 개선 메모">
          {report.notes.slice(0, 3).map((n, i) => (
            <li key={i} className="flow-strip__note">
              → {n}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
