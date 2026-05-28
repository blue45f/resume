import { useMemo } from 'react';
import { analyzeResumeSocialProof } from '@/lib/resumeSocialProofAnalyzer';
import type { SocialProofType } from '@/lib/resumeSocialProofAnalyzer';

interface Props {
  text: string;
}

const TYPE_LABEL: Record<SocialProofType, string> = {
  publication: '논문/기술 블로그',
  conference_talk: '컨퍼런스 발표',
  patent: '특허',
  award: '수상',
  open_source: '오픈소스',
  teaching: '강의/교육',
  media: '미디어/언론',
};

const TYPE_ICON: Record<SocialProofType, string> = {
  publication: '📄',
  conference_talk: '🎤',
  patent: '📋',
  award: '🏆',
  open_source: '⭐',
  teaching: '🎓',
  media: '📺',
};

const LEVEL_LABEL: Record<string, string> = {
  high: '풍부',
  medium: '보통',
  low: '부족',
  none: '없음',
};

export default function ResumeSocialProofPanel({ text }: Props) {
  const report = useMemo(() => analyzeResumeSocialProof(text), [text]);

  if (text.trim().length < 80) return null;
  // Don't show if social proof is already strong
  if (report.level === 'high') return null;

  const isWarning = report.level === 'none';

  return (
    <aside
      className={`social-proof-card${isWarning ? ' social-proof-card--warning' : ''}`}
      aria-label="소셜 프루프 분석"
    >
      <header className="social-proof-card__head">
        <span className="social-proof-card__eyebrow">외부 검증</span>
        <span
          className={`social-proof-card__badge social-proof-card__badge--${report.level}`}
        >
          {LEVEL_LABEL[report.level]}
        </span>
      </header>

      <p className="social-proof-card__hint">{report.suggestion}</p>

      {report.signals.length > 0 && (
        <ul className="social-proof-card__signals" aria-label="감지된 외부 검증 신호">
          {Array.from(report.types).map((t) => (
            <li key={t} className="social-proof-card__signal-item">
              <span className="social-proof-card__signal-icon">{TYPE_ICON[t]}</span>
              <span className="social-proof-card__signal-label">{TYPE_LABEL[t]}</span>
            </li>
          ))}
        </ul>
      )}

      {report.missingTips.length > 0 && (
        <ul className="social-proof-card__tips" aria-label="추가 제안">
          {report.missingTips.map((tip, i) => (
            <li key={i} className="social-proof-card__tip">
              {tip}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
