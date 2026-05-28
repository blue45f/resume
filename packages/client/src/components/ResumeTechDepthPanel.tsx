import { useMemo } from 'react';
import { analyzeResumeTechDepth } from '@/lib/resumeTechDepthAnalyzer';
import type { TechDepthSignalType } from '@/lib/resumeTechDepthAnalyzer';

interface Props {
  text: string;
}

const DEPTH_TYPE_LABEL: Record<TechDepthSignalType, string> = {
  architecture_decision: '아키텍처 결정',
  tradeoff_reasoning: '트레이드오프',
  scale_metric: '규모 지표',
  system_design: '시스템 설계',
  optimization_detail: '최적화 상세',
  debugging_depth: '디버깅 깊이',
};

const GRADE_LABEL: Record<string, string> = {
  deep: '깊음',
  adequate: '보통',
  surface: '표면적',
  none: '미감지',
};

export default function ResumeTechDepthPanel({ text }: Props) {
  const report = useMemo(() => analyzeResumeTechDepth(text), [text]);

  if (text.trim().length < 100) return null;
  if (report.grade === 'deep') return null;
  if (report.grade === 'none' && report.surfaceSignals.length === 0) return null;

  const isWarning = report.grade === 'surface';

  return (
    <aside
      className={`tech-depth-card${isWarning ? ' tech-depth-card--warning' : ''}`}
      aria-label="기술 깊이 신호 분석"
    >
      <header className="tech-depth-card__head">
        <span className="tech-depth-card__eyebrow">기술 깊이</span>
        <span className={`tech-depth-card__badge tech-depth-card__badge--${report.grade}`}>
          {GRADE_LABEL[report.grade]}
        </span>
      </header>

      <p className="tech-depth-card__hint">{report.summary}</p>

      {report.depthSignals.length > 0 && (
        <div className="tech-depth-card__chips" aria-label="기술 깊이 신호">
          {report.depthSignals.map((sig, i) => (
            <span key={i} className="tech-depth-card__chip tech-depth-card__chip--good">
              {DEPTH_TYPE_LABEL[sig.type]}
            </span>
          ))}
        </div>
      )}

      {report.surfaceSignals.length > 0 && (
        <div className="tech-depth-card__chips" aria-label="표면 신호">
          {report.surfaceSignals.map((sig, i) => (
            <span key={i} className="tech-depth-card__chip tech-depth-card__chip--warn">
              {sig.type === 'buzzword_list' ? '기술명 나열' : '모호한 숙련도'}
            </span>
          ))}
        </div>
      )}

      {report.suggestions.length > 0 && (
        <ul className="tech-depth-card__suggestions" aria-label="개선 제안">
          {report.suggestions.map((s, i) => (
            <li key={i} className="tech-depth-card__suggestion">
              → {s}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
