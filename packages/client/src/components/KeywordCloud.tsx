import { useMemo } from 'react';
import { extractKeywords, type ExtractedKeyword } from '@/lib/koreanChecker';

interface Props {
  text: string;
  topN?: number;
  minLength?: number;
  className?: string;
  /** 선택한 키워드 클릭 핸들러 (검색·필터 용) */
  onKeywordClick?: (keyword: string) => void;
}

/**
 * 한글 본문에서 핵심 키워드 상위 N 개를 tag cloud 로 렌더.
 * TF 가중치에 따라 크기·투명도를 시각화. 조사 heuristic + STOPWORDS 필터는 extractKeywords 참조.
 *
 * 사용 예:
 *   <KeywordCloud text={resumeSummary} topN={12} onKeywordClick={(k) => nav(`/search?q=${k}`)} />
 */
export default function KeywordCloud({
  text,
  topN = 15,
  minLength = 80,
  className = '',
  onKeywordClick,
}: Props) {
  const keywords = useMemo<ExtractedKeyword[]>(() => {
    if (!text || text.length < minLength) return [];
    return extractKeywords(text, topN);
  }, [text, topN, minLength]);

  if (keywords.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap gap-1.5 items-center ${className}`}
      role="group"
      aria-label="핵심 키워드"
    >
      {keywords.map((kw) => {
        const size = 0.75 + kw.weight * 0.6; // 0.75rem ~ 1.35rem
        const emphasis = 0.45 + kw.weight * 0.55; // 0.45 ~ 1.0 opacity
        const Tag = onKeywordClick ? 'button' : 'span';
        return (
          <Tag
            key={kw.word}
            {...(onKeywordClick
              ? {
                  type: 'button' as const,
                  onClick: () => onKeywordClick(kw.word),
                  className:
                    'inline-flex items-center px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                }
              : {
                  className:
                    'inline-flex items-center px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200',
                })}
            style={{ fontSize: `${size}rem`, opacity: emphasis }}
            title={`빈도 ${kw.count} · 가중치 ${Math.round(kw.weight * 100)}`}
          >
            {kw.word}
            <span
              className="ml-1 text-[9px] text-slate-400 dark:text-slate-500"
              style={{ fontSize: `${size * 0.6}rem` }}
            >
              ×{kw.count}
            </span>
          </Tag>
        );
      })}
    </div>
  );
}
