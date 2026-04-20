/**
 * 경력 기간·범위 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * 제공:
 * - estimateExperienceYears: 2020.03 ~ 현재 / 2019 ~ 2022 같은 기간 표기 → 총 년수·개월수
 * - validateDateRanges: 시작>종료 인 잘못된 기간(오타) 감지
 *
 * 관련 타입: ExperienceRange, ExperienceEstimate, InvalidDateRange.
 */

export interface ExperienceRange {
  start: { year: number; month: number };
  end: { year: number; month: number };
  months: number;
  raw: string;
}

export interface ExperienceEstimate {
  ranges: ExperienceRange[];
  totalMonths: number;
  totalYears: number; // 소수 1자리
  summary: string;
}

/**
 * 경력 기간 추정 — "2020.03 ~ 현재", "2019 ~ 2022", "2020년 3월 ~ 2024년 12월"
 * 같은 기간 표기를 찾아 총 경력 개월 수·년수로 환산.
 */
export function estimateExperienceYears(text: string, currentYear?: number): ExperienceEstimate {
  const t = text ?? '';
  const nowYear = currentYear ?? new Date().getFullYear();
  const nowMonth = new Date().getMonth() + 1;
  const ranges: ExperienceRange[] = [];
  const patterns = [
    /(\d{4})[.\-/년\s]+(\d{1,2})[월\s]*(?:\s*[~\-–—]\s*)(현재|재직\s*중|\d{4}[.\-/년\s]+\d{1,2})/g,
    /(\d{4})\s*[~\-–—]\s*(현재|재직\s*중|\d{4})/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, 'g');
    while ((m = r.exec(t))) {
      const startYear = parseInt(m[1], 10);
      const startMonth =
        re.source.includes('\\d{1,2}') && m[2] && /^\d+$/.test(m[2]) ? parseInt(m[2], 10) : 1;
      let endYear = nowYear;
      let endMonth = nowMonth;
      const endRaw = (m[3] ?? m[2] ?? '').trim();
      if (endRaw && endRaw !== '현재' && !endRaw.includes('재직')) {
        const endMatch = endRaw.match(/(\d{4})(?:[.\-/년\s]+(\d{1,2}))?/);
        if (endMatch) {
          endYear = parseInt(endMatch[1], 10);
          endMonth = endMatch[2] ? parseInt(endMatch[2], 10) : 12;
        }
      }
      if (startYear < 1900 || startYear > 2100 || endYear < startYear) continue;
      const months = Math.max(0, (endYear - startYear) * 12 + (endMonth - startMonth) + 1);
      if (months > 0 && months < 720) {
        ranges.push({
          start: { year: startYear, month: startMonth },
          end: { year: endYear, month: endMonth },
          months,
          raw: m[0],
        });
      }
    }
  }
  // 중복 제거 (raw 문자열 기반)
  const seen = new Set<string>();
  const unique = ranges.filter((r) => {
    if (seen.has(r.raw)) return false;
    seen.add(r.raw);
    return true;
  });
  const totalMonths = unique.reduce((a, b) => a + b.months, 0);
  const totalYears = Math.round((totalMonths / 12) * 10) / 10;
  const summary =
    unique.length === 0
      ? '경력 기간 표기가 감지되지 않았습니다.'
      : `${unique.length}개 기간 · 총 ${totalYears}년 (${totalMonths}개월)`;
  return { ranges: unique, totalMonths, totalYears, summary };
}

export interface InvalidDateRange {
  raw: string;
  start: { year: number; month: number };
  end: { year: number; month: number };
  reason: string;
}

/**
 * 날짜 범위 논리 검증 — 시작 > 종료인 잘못된 기간(예: 2023.05~2021.01) 포착.
 * estimateExperienceYears 와 동일 패턴을 재사용하되 여기서는 잘못된 범위만 리포트.
 */
export function validateDateRanges(text: string): InvalidDateRange[] {
  const exp = estimateExperienceYears(text);
  const invalid: InvalidDateRange[] = [];
  for (const r of exp.ranges) {
    const s = r.start.year * 12 + r.start.month;
    const e = r.end.year * 12 + r.end.month;
    if (e < s) {
      invalid.push({
        raw: r.raw,
        start: r.start,
        end: r.end,
        reason: `시작(${r.start.year}.${r.start.month}) 이 종료(${r.end.year}.${r.end.month}) 보다 늦습니다.`,
      });
    } else if (r.months > 600) {
      invalid.push({
        raw: r.raw,
        start: r.start,
        end: r.end,
        reason: `기간이 ${Math.round(r.months / 12)}년으로 지나치게 깁니다 — 오타 의심.`,
      });
    }
  }
  return invalid;
}
