import { useMemo, useState } from 'react';
import {
  generateQualityReport,
  exportQualityReportMarkdown,
  prioritizeImprovements,
  gradeFromScore,
  estimateReadingTime,
  analyzeDateConsistency,
  detectJargon,
  analyzeBracketBalance,
  detectWhitespaceAnomalies,
  analyzeNumericFormat,
  detectDuplicateSentences,
  analyzeFirstPersonUsage,
  suggestSynonymsForOveruse,
  estimateExperienceYears,
  detectExaggeration,
} from '@/lib/koreanChecker';
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
    cliches,
    sentenceStarts,
    passive,
    parallelism,
    informal,
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
        <span
          className="text-[10px] font-semibold px-1 py-0.5 rounded bg-white/50 dark:bg-black/20"
          title={`${gradeFromScore(overallScore).tier} · ${overallScore}/100`}
        >
          {gradeFromScore(overallScore).grade}
        </span>
        {summary.error > 0 && <span className="text-red-600">❌{summary.error}</span>}
        {summary.warning > 0 && <span className="text-amber-600">⚠️{summary.warning}</span>}
        {summary.info > 0 && <span className="text-slate-500">💡{summary.info}</span>}
        <span className="text-slate-400 text-[10px]">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="mt-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] leading-relaxed w-full max-w-xs sm:max-w-sm max-h-[70vh] overflow-y-auto shadow-sm">
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
          <Row title="상투구" value={`${cliches.count}건`} hint={cliches.level} />
          <Row
            title="시작 변주"
            value={`${Math.round((1 - sentenceStarts.repeatedStartRatio) * 100)}점`}
            hint={sentenceStarts.topStarts[0]?.word ?? '-'}
          />
          <Row
            title="수동태"
            value={`${Math.round(passive.ratio * 100)}%`}
            hint={`${passive.passiveCount}/${passive.activeCount} (${passive.level})`}
          />
          <Row
            title="평행구조"
            value={`${parallelism.consistency}%`}
            hint={parallelism.styles[0]?.style ?? '-'}
          />
          <Row
            title="비격식"
            value={`${informal.count}건`}
            hint={informal.hits[0]?.category ?? informal.level}
          />
          <ExtraRows text={text} />
          <PriorityActions report={report} />
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

function ExtraRows({ text }: { text: string }) {
  const reading = estimateReadingTime(text);
  const dates = analyzeDateConsistency(text);
  const jargon = detectJargon(text);
  const brackets = analyzeBracketBalance(text);
  return (
    <>
      <Row
        title="읽기 시간"
        value={reading.label}
        hint={`${reading.chars}자 · ${reading.words}단어`}
      />
      {dates.hits.length > 0 && (
        <Row
          title="날짜 포맷"
          value={dates.consistent ? '일관' : `${dates.distinctFormats}종 혼재`}
          hint={dates.dominantFormat ?? '-'}
        />
      )}
      {jargon.totalCount > 0 && (
        <Row
          title="자곤"
          value={`${jargon.totalCount}건`}
          hint={jargon.hits[0]?.word ?? jargon.level}
        />
      )}
      {brackets.unbalanced && (
        <Row
          title="괄호"
          value="불균형"
          hint={brackets.pairs
            .filter((p) => p.unbalanced > 0)
            .map((p) => `${p.open}${p.close}`)
            .join(' ')}
        />
      )}
      <WhitespaceAndNumericRows text={text} />
    </>
  );
}

function WhitespaceAndNumericRows({ text }: { text: string }) {
  const ws = detectWhitespaceAnomalies(text);
  const num = analyzeNumericFormat(text);
  const numTotal = num.comma + num.plain + num.korean;
  const dup = detectDuplicateSentences(text);
  const fp = analyzeFirstPersonUsage(text);
  const overuse = suggestSynonymsForOveruse(text);
  return (
    <>
      {!ws.clean && (
        <Row
          title="공백 이상"
          value={`${ws.anomalies.length}건`}
          hint={
            (Object.keys(ws.counts) as Array<keyof typeof ws.counts>)
              .filter((k) => ws.counts[k] > 0)
              .join(', ') || '-'
          }
        />
      )}
      {numTotal > 0 && !num.consistent && (
        <Row
          title="숫자 포맷"
          value={`${num.distinct}종 혼재`}
          hint={`주류: ${num.dominant ?? '-'}`}
        />
      )}
      {dup.length > 0 && (
        <Row title="중복 문장" value={`${dup.length}건`} hint={`${dup[0]?.count}회 반복`} />
      )}
      {fp.level === 'high' && (
        <Row title="1인칭 과다" value={`${fp.total}회`} hint={`100자당 ${fp.per100Chars}`} />
      )}
      {overuse.length > 0 && (
        <Row
          title="남용 단어"
          value={`${overuse.length}종`}
          hint={`${overuse[0]?.word}×${overuse[0]?.count}`}
        />
      )}
      <CareerAndExaggerationRows text={text} />
    </>
  );
}

function CareerAndExaggerationRows({ text }: { text: string }) {
  const exp = estimateExperienceYears(text);
  const exag = detectExaggeration(text);
  return (
    <>
      {exp.ranges.length > 0 && (
        <Row title="총 경력" value={`${exp.totalYears}년`} hint={`${exp.ranges.length}개 구간`} />
      )}
      {exag.count > 0 && (
        <Row
          title="과장 표현"
          value={`${exag.count}건`}
          hint={exag.hits[0]?.phrase ?? exag.level}
        />
      )}
    </>
  );
}

function PriorityActions({ report }: { report: ReturnType<typeof generateQualityReport> }) {
  const actions = prioritizeImprovements(report, 3);
  if (actions.length === 0) return null;
  return (
    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
      <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
        🚀 우선 개선 TOP {actions.length}
      </div>
      <ol className="space-y-1">
        {actions.map((a, i) => (
          <li
            key={a.dimension}
            className="flex items-start gap-1.5 text-[10px] text-slate-600 dark:text-slate-400"
          >
            <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold text-[9px]">
              {i + 1}
            </span>
            <span className="leading-snug">
              <span className="font-medium text-slate-700 dark:text-slate-300">{a.dimension}</span>
              <span className="text-slate-400 dark:text-slate-500"> · {a.currentScore}점</span>
              <span className="text-slate-400 dark:text-slate-500"> · -{a.impact}</span>
              <br />
              {a.targetSuggestion}
            </span>
          </li>
        ))}
      </ol>
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
