import { useMemo } from 'react';
import { analyzeParagraphs } from '@/lib/toneAnalyzers';

interface Props {
  text: string;
}

export default function CoverLetterParagraphPanel({ text }: Props) {
  const stats = useMemo(() => analyzeParagraphs(text), [text]);

  if (stats.count === 0) return null;
  if (stats.shortParagraphs === 0 && stats.longParagraphs === 0 && stats.idealRatio >= 0.7)
    return null;

  const hasIssue = stats.shortParagraphs > 0 || stats.longParagraphs > 0 || stats.idealRatio < 0.5;

  return (
    <aside
      className={`cl-para-card${hasIssue ? ' cl-para-card--warning' : ''}`}
      aria-label="문단 구조 분석"
    >
      <header className="cl-para-card__head">
        <span className="cl-para-card__eyebrow">paragraph structure</span>
        <span className="cl-para-card__title">문단 구조 분석</span>
        <span className="cl-para-card__count">{stats.count}문단</span>
      </header>

      <div className="cl-para-card__grid">
        <div className="cl-para-card__stat">
          <span className="cl-para-card__stat-label">평균 길이</span>
          <span className="cl-para-card__stat-val">{stats.avgLength}자</span>
        </div>
        <div className="cl-para-card__stat">
          <span className="cl-para-card__stat-label">이상적 문단</span>
          <span
            className={`cl-para-card__stat-val${stats.idealRatio >= 0.6 ? ' cl-para-card__stat-val--good' : ' cl-para-card__stat-val--warn'}`}
          >
            {Math.round(stats.idealRatio * 100)}%
          </span>
        </div>
        {stats.shortParagraphs > 0 && (
          <div className="cl-para-card__stat">
            <span className="cl-para-card__stat-label">짧은 문단</span>
            <span className="cl-para-card__stat-val cl-para-card__stat-val--warn">
              {stats.shortParagraphs}개
            </span>
          </div>
        )}
        {stats.longParagraphs > 0 && (
          <div className="cl-para-card__stat">
            <span className="cl-para-card__stat-label">너무 긴 문단</span>
            <span className="cl-para-card__stat-val cl-para-card__stat-val--warn">
              {stats.longParagraphs}개
            </span>
          </div>
        )}
      </div>

      <div
        className="cl-para-card__meter"
        style={{ '--para-fill': `${Math.round(stats.idealRatio * 100)}%` } as React.CSSProperties}
        role="progressbar"
        aria-valuenow={Math.round(stats.idealRatio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`이상적 문단 비율 ${Math.round(stats.idealRatio * 100)}%`}
      />

      <p className="cl-para-card__suggestion">{stats.suggestion}</p>
    </aside>
  );
}
