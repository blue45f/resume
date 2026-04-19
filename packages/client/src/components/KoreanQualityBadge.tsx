import { useMemo } from 'react';
import { checkText } from '@/lib/koreanChecker';

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
 * - 점수 ≥90 녹색 / ≥70 파랑 / ≥50 앰버 / <50 적색
 * - 심각도별 카운트(❌ 오류 / ⚠️ 경고 / 💡 제안) inline
 * - minLength 미만이면 null 반환 (짧은 입력에서 noise 방지)
 */
export default function KoreanQualityBadge({
  text,
  label = '본문',
  minLength = 50,
  className = '',
}: Props) {
  const result = useMemo(() => {
    if (!text || text.length < minLength) return null;
    return checkText(text, label);
  }, [text, label, minLength]);
  if (!result) return null;
  const { score, summary } = result;
  const tone =
    score >= 90
      ? 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      : score >= 70
        ? 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
        : score >= 50
          ? 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
          : 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-medium rounded-full border ${tone} ${className}`}
      title={`error ${summary.error} · warning ${summary.warning} · info ${summary.info}`}
    >
      <span>🔤 한국어 품질</span>
      <span className="font-bold">{score}점</span>
      {summary.error > 0 && <span className="text-red-600">❌{summary.error}</span>}
      {summary.warning > 0 && <span className="text-amber-600">⚠️{summary.warning}</span>}
      {summary.info > 0 && <span className="text-slate-500">💡{summary.info}</span>}
    </div>
  );
}
