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
  detectContactInfo,
  validateDateRanges,
  scoreResumeCompleteness,
  detectMissingResumeSections,
  detectPersonalInfo,
  analyzeEnglishMix,
  analyzeSentiment,
  extractLinks,
  estimateJobLevel,
  scoreSpecificity,
  analyzeActivityChronology,
  detectSoftSkills,
  analyzeBulletMarkerConsistency,
  analyzePunctuationBalance,
  countAchievements,
  computeSectionHealth,
  analyzeStarPattern,
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
          <SectionHeader>📖 문체 · 가독성</SectionHeader>
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
          <SectionHeader>💼 이력서 신호</SectionHeader>
          <Row title="정량 지표" value={`${quantification.total}건`} hint={quantification.level} />
          <Row
            title="액션 동사"
            value={`${actionVerbs.strong}/${actionVerbs.weak}`}
            hint={`${Math.round(actionVerbs.ratio * 100)}% 강`}
          />
          <AchievementsRow text={text} />
          <Row title="상투구" value={`${cliches.count}건`} hint={cliches.level} />
          <SectionHealthRow text={text} />
          <StarPatternRow text={text} />
          <SectionHeader>✍️ 문장 구조</SectionHeader>
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
      <SectionHeader>📊 메타 정보</SectionHeader>
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
  const contact = detectContactInfo(text);
  const invalidRanges = validateDateRanges(text);
  const invalidContact =
    contact.emails.filter((e) => !e.valid).length + contact.phones.filter((p) => !p.valid).length;
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
      {(contact.emails.length > 0 || contact.phones.length > 0) && (
        <Row
          title="연락처"
          value={
            invalidContact > 0
              ? `잘못된 ${invalidContact}건`
              : `이메일 ${contact.emails.length} · 전화 ${contact.phones.length}`
          }
          hint={invalidContact > 0 ? '형식 확인' : '정상'}
        />
      )}
      {invalidRanges.length > 0 && (
        <Row
          title="날짜 오류"
          value={`${invalidRanges.length}건`}
          hint={invalidRanges[0]?.raw ?? '-'}
        />
      )}
      <CompletenessRow text={text} />
      <PiiAndEnglishRow text={text} />
    </>
  );
}

function PiiAndEnglishRow({ text }: { text: string }) {
  const pii = detectPersonalInfo(text);
  const eng = analyzeEnglishMix(text);
  return (
    <>
      {pii.severity !== 'none' && (
        <div
          className={`-mx-1 my-1 px-2 py-1.5 rounded-md text-[10.5px] font-medium ${
            pii.severity === 'critical'
              ? 'bg-red-50 dark:bg-red-900/25 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              : 'bg-amber-50 dark:bg-amber-900/25 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
          }`}
        >
          ⚠️ 개인정보 {pii.count}건 ({pii.severity}):{' '}
          {pii.hits
            .slice(0, 3)
            .map((h) => h.type)
            .join(', ')}
        </div>
      )}
      {eng.level === 'high' && (
        <Row title="영문 혼재" value={`${Math.round(eng.englishRatio * 100)}%`} hint={eng.level} />
      )}
      <SentimentRow text={text} />
    </>
  );
}

function SentimentRow({ text }: { text: string }) {
  const sent = analyzeSentiment(text);
  const links = extractLinks(text);
  const job = estimateJobLevel(text);
  return (
    <>
      {sent.tone !== 'none' && (
        <Row
          title="어조"
          value={sent.tone === 'positive' ? '긍정' : sent.tone === 'balanced' ? '균형' : '부정'}
          hint={`+${sent.positiveCount} / -${sent.negativeCount} (${Math.round(sent.ratio * 100)}%)`}
        />
      )}
      {links.count > 0 && (
        <Row
          title="외부 링크"
          value={`${links.count}개`}
          hint={
            links.missingScheme > 0
              ? `${links.missingScheme}개 스킴 누락`
              : links.platforms.slice(0, 3).join(', ')
          }
        />
      )}
      {job.years > 0 && (
        <Row
          title="경력 레벨"
          value={
            job.level === 'lead'
              ? '리드'
              : job.level === 'senior'
                ? '시니어'
                : job.level === 'mid'
                  ? '미드'
                  : '주니어'
          }
          hint={`${job.years}년${job.hasLeadKeyword ? ' · 리딩' : ''}`}
        />
      )}
      <SpecificityAndChronologyRows text={text} />
    </>
  );
}

function SpecificityAndChronologyRows({ text }: { text: string }) {
  const spec = scoreSpecificity(text);
  const chrono = analyzeActivityChronology(text);
  const soft = detectSoftSkills(text);
  const bullet = analyzeBulletMarkerConsistency(text);
  return (
    <>
      <Row
        title="구체성"
        value={`${spec.overall}점`}
        hint={`#${spec.numbers} · 고유 ${spec.properNouns} · 기술 ${spec.techTerms}`}
      />
      {chrono.order !== 'single-or-none' && (
        <Row
          title="시간 순"
          value={
            chrono.order === 'newest-first'
              ? '최신순'
              : chrono.order === 'oldest-first'
                ? '과거순'
                : '혼재'
          }
          hint={chrono.isConsistent ? '일관' : '순서 확인'}
        />
      )}
      {soft.distinctCount > 0 && (
        <Row
          title="소프트 스킬"
          value={`${soft.distinctCount}종`}
          hint={soft.hits
            .slice(0, 3)
            .map((h) => h.skill)
            .join(', ')}
        />
      )}
      {bullet.markers.length > 0 && !bullet.consistent && (
        <Row
          title="목록 기호"
          value={`${bullet.distinct}종 혼재`}
          hint={bullet.markers
            .slice(0, 4)
            .map((m) => m.marker)
            .join(' ')}
        />
      )}
      <PunctuationRow text={text} />
    </>
  );
}

function PunctuationRow({ text }: { text: string }) {
  const p = analyzePunctuationBalance(text);
  // 느낌표/물음표 과다, 쉼표 부족 케이스에서만 표시
  const sentences = p.periods + p.questions + p.exclamations;
  const hasIssue =
    sentences > 5 &&
    (p.exclamations > sentences * 0.3 ||
      p.questions > sentences * 0.2 ||
      p.commasPerSentence < 0.3);
  if (!hasIssue) return null;
  return (
    <Row
      title="문장부호"
      value={
        p.exclamations > sentences * 0.3
          ? '느낌표 과다'
          : p.questions > sentences * 0.2
            ? '물음표 과다'
            : '쉼표 부족'
      }
      hint={`. ${p.periods} · , ${p.commas} · ? ${p.questions} · ! ${p.exclamations}`}
    />
  );
}

function CompletenessRow({ text }: { text: string }) {
  const completeness = scoreResumeCompleteness(text);
  const sections = detectMissingResumeSections(text);
  // 이력서 본문으로 쓸 만큼 긴 텍스트(300자+) 에서만 표시
  if (text.length < 300) return null;
  return (
    <>
      <Row
        title="이력서 완성도"
        value={`${completeness.overall}점`}
        hint={`약한 축: ${[...completeness.breakdown].sort((a, b) => a.score - b.score)[0].axis}`}
      />
      {sections.missing.length > 0 && (
        <Row
          title="누락 섹션"
          value={`${sections.missing.length}/${sections.missing.length + sections.present.length}`}
          hint={sections.missing.join(', ')}
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

function AchievementsRow({ text }: { text: string }) {
  const a = countAchievements(text);
  return (
    <Row
      title="수상·성취"
      value={`${a.total}건`}
      hint={
        a.total === 0
          ? '없음'
          : a.byKeyword
              .slice(0, 3)
              .map((k) => k.keyword)
              .join(' · ')
      }
    />
  );
}

function StarPatternRow({ text }: { text: string }) {
  const star = analyzeStarPattern(text);
  if (star.analyzed < 2) return null;
  const tierLabel =
    star.tier === 'excellent'
      ? '우수'
      : star.tier === 'good'
        ? '양호'
        : star.tier === 'fair'
          ? '보통'
          : '취약';
  return (
    <Row
      title="STAR 커버리지"
      value={`${star.coverage}% · ${tierLabel}`}
      hint={`완전 ${star.fullStarCount}/${star.analyzed} · 평균 ${star.avgScore}점`}
    />
  );
}

function SectionHealthRow({ text }: { text: string }) {
  const health = computeSectionHealth(text);
  if (health.balanceScore === 0 && health.orderScore === 100 && health.densityScore === 0) {
    return null;
  }
  const tierLabel =
    health.tier === 'excellent'
      ? '우수'
      : health.tier === 'good'
        ? '양호'
        : health.tier === 'fair'
          ? '보통'
          : '취약';
  return (
    <Row
      title="섹션 구성"
      value={`${health.overall}점 · ${tierLabel}`}
      hint={`균형 ${health.balanceScore} · 순서 ${health.orderScore} · 밀도 ${health.densityScore}`}
    />
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1.5 mb-0.5 first:mt-0 text-[9.5px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-0.5">
      {children}
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
