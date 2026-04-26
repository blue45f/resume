import { useState } from 'react';
import { parseJobUrl, type ParsedJob } from '@/lib/api';
import { toast } from '@/components/Toast';
import { tx } from '@/lib/i18n';

interface Props {
  /** 파싱 성공 시 호출 — 부모가 form 필드 prefill */
  onParsed: (parsed: ParsedJob) => void;
  /** 비활성화 (이미 fetch 중 등) */
  disabled?: boolean;
  /** 한 줄 짜리 안내 — 페이지 컨텍스트에 맞춰 변경 */
  hint?: string;
  className?: string;
}

const KNOWN_SITES = [
  { match: /wanted\.co\.kr/, label: '원티드' },
  { match: /jobkorea\.co\.kr/, label: '잡코리아' },
  { match: /saramin\.co\.kr/, label: '사람인' },
  { match: /jumpit\.saramin\.co\.kr/, label: '점핏' },
  { match: /programmers\.co\.kr/, label: '프로그래머스' },
  { match: /rocketpunch\.com/, label: '로켓펀치' },
  { match: /greetinghr\.com/, label: '그리팅' },
  { match: /linkedin\.com\/jobs/, label: 'LinkedIn' },
];

function detectSite(url: string): string | null {
  for (const s of KNOWN_SITES) if (s.match.test(url)) return s.label;
  return null;
}

/**
 * 채용공고 URL 입력 + '자동 채우기' 버튼.
 *
 * 사용처: CoverLetterPage / ApplicationsPage / JobPostPage 등 공고 정보 입력이 필요한 곳.
 * 동작: 서버 POST /jobs/parse-url 호출 → ParsedJob → onParsed 콜백.
 *
 * 한국 채용 사이트 (원티드/잡코리아/사람인 등) 우선 지원. 알려진 사이트면 배지로 표시.
 */
export default function JobUrlInput({ onParsed, disabled = false, hint, className = '' }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const detectedSite = detectSite(url);

  const handleParse = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const parsed = await parseJobUrl(trimmed);
      onParsed(parsed);
      const sourceLabel = tx(
        parsed.source === 'json-ld'
          ? 'jobUrl.sourceJsonLd'
          : parsed.source === 'llm'
            ? 'jobUrl.sourceLlm'
            : parsed.source === 'partial'
              ? 'jobUrl.sourcePartial'
              : 'jobUrl.sourceOg',
      );
      toast(tx('jobUrl.success', { source: sourceLabel }), 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : tx('jobUrl.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`imp-card p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/40 ${className}`}
    >
      <label className="block text-xs font-medium text-blue-800 dark:text-blue-300 mb-1.5">
        {tx('jobUrl.title')}
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && url.trim() && !loading && !disabled) {
              e.preventDefault();
              handleParse();
            }
          }}
          placeholder={tx('jobUrl.placeholder')}
          disabled={disabled || loading}
          className="flex-1 min-w-0 px-3 py-2.5 sm:py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleParse}
          disabled={!url.trim() || loading || disabled}
          className="shrink-0 px-3.5 py-2.5 sm:py-2 text-sm sm:text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0"
        >
          {loading ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {tx('jobUrl.parsing')}
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {tx('jobUrl.parse')}
            </>
          )}
        </button>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80 leading-relaxed">
          {hint || tx('jobUrl.hint')}
        </p>
        {detectedSite && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
            ✓ {detectedSite}
          </span>
        )}
      </div>
    </div>
  );
}
