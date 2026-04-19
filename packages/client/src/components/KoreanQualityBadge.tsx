import { useMemo, useState } from 'react';
import { generateQualityReport, exportQualityReportMarkdown } from '@/lib/koreanChecker';
import { toast } from '@/components/Toast';

interface Props {
  /** 검사할 원문 */
  text: string;
  /** 섹션 라벨 (결과 보고용, 기본 '본문') */
  label?: string;
  /** 이 길이 미만이면 뱃지 숨김 (기본 50자) */
  minLength?: number;
  className?: string;
}

/**
 * 한국어 품질 점수 실시간 뱃지 — CoverLetter, CommunityWrite, StudyPost 등
 * Korean 텍스트 작성 UI 공용.
 *
 * - 맞춤법 점수 + 가독성/어휘/어미/반복어 가중 평균(overallScore) 기반.
 * - 점수 ≥90 녹색 / ≥70 파랑 / ≥50 앰버 / <50 적색
 * - 심각도별 카운트(❌ 오류 / ⚠️ 경고 / 💡 제안) + 확장 시 상세 지표 패널
 * - minLength 미만이면 null 반환 (짧은 입력에서 noise 방지)
 */
export default function KoreanQualityBadge({
  text,
  label = '본문',
  minLength = 50,
  className = '',
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const report = useMemo(() => {
    if (!text || text.length < minLength) return null;
    return generateQualityReport(text, label);
  }, [text, label, minLength]);
  if (!report) return null;
  const {
    overallScore,
    check,
    endings,
    lexical,
    redundancy,
    readability,
    quantification,
    actionVerbs,
  } = report;
  const { summary } = check;
  const tone =
    overallScore >= 90
      ? 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      : overallScore >= 70
        ? 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
        : overallScore >= 50
          ? 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
          : 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
  return (
    <div className={`inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${tone}`}
        title={`맞춤법 ${check.score} · 가독성 ${readability.readabilityScore} · 어휘 ${Math.round(lexical.ttr * 100)} · 어미변주 ${100 - endings.monotonyScore} · 반복어 ${Math.max(0, 100 - redundancy.hits.length * 10)}`}
        aria-expanded={expanded}
      >
        <span>🔤 한국어 품질</span>
        <span className="font-bold">{overallScore}점</span>
        {summary.error > 0 && <span className="text-red-600">❌{summary.error}</span>}
        {summary.warning > 0 && <span className="text-amber-600">⚠️{summary.warning}</span>}
        {summary.info > 0 && <span className="text-slate-500">💡{summary.info}</span>}
        <span className="text-slate-400 text-[10px]">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="mt-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] leading-relaxed max-w-xs shadow-sm">
          <Row
            title="맞춤법"
            value={`${check.score}점`}
            hint={`${summary.error + summary.warning + summary.info}건`}
          />
          <Row
            title="가독성"
            value={`${readability.readabilityScore}점`}
            hint={`평균 ${readability.avgSentenceLength}자/문장`}
          />
          <Row
            title="어휘 다양성"
            value={`${Math.round(lexical.ttr * 100)}%`}
            hint={`${lexical.uniqueCount}/${lexical.tokenCount} 단어`}
          />
          <Row
            title="어미 변주"
            value={`${100 - endings.monotonyScore}점`}
            hint={endings.dominantEndings[0]?.ending ?? '-'}
          />
          <Row
            title="반복어"
            value={`${redundancy.hits.length}건`}
            hint={redundancy.worst?.word ?? '없음'}
          />
          <Row title="정량 지표" value={`${quantification.total}건`} hint={quantification.level} />
          <Row
            title="액션 동사"
            value={`${actionVerbs.strong}/${actionVerbs.weak}`}
            hint={`${Math.round(actionVerbs.ratio * 100)}% 강`}
          />
          {(readability.suggestion || lexical.suggestion || endings.suggestion) && (
            <p className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              💡 {readability.suggestion}
            </p>
          )}
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              type="button"
              onClick={async () => {
                try {
                  const md = exportQualityReportMarkdown(text, label);
                  await navigator.clipboard.writeText(md);
                  toast('리포트를 클립보드에 복사했습니다', 'success');
                } catch {
                  toast('복사에 실패했습니다', 'error');
                }
              }}
              className="text-[10px] px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              📋 리포트 복사 (MD)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="text-slate-600 dark:text-slate-400">{title}</span>
      <span className="flex items-baseline gap-2">
        <span className="font-semibold text-slate-900 dark:text-slate-100">{value}</span>
        {hint && <span className="text-[10px] text-slate-400 dark:text-slate-500">{hint}</span>}
      </span>
    </div>
  );
}
