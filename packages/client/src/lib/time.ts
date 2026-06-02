// 시간 유틸 client 진입점.
// - `timeAgo` (한글 상대시간) 는 server 테스트도 공유하는 `@/shared/lib/time` 에서 re-export.
// - `formatDate` (로케일 연동 날짜 포맷) 는 date-fns + `@/lib/i18n` 의존이라 client 전용으로 여기 둔다.
import { format, parseISO } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import type { Locale } from 'date-fns';

import { getLocale } from '@/lib/i18n';

export * from '@/shared/lib/time';

/**
 * 활성 앱 로케일(ko/en/…)을 date-fns 로케일로 매핑한다.
 * 한국어 외 로케일은 영어(en-US)로 폴백한다.
 */
function dateFnsLocale(): Locale {
  return getLocale() === 'ko' ? ko : enUS;
}

/** 다양한 입력을 Date 로 정규화한다. ISO 문자열은 parseISO 로 처리. */
function toDate(value: string | number | Date): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  return parseISO(value);
}

/**
 * 날짜를 활성 로케일에 맞춰 짧은 형식으로 포맷한다.
 * 한국어 로케일에서 `yyyy. M. d.` 토큰은 `Date#toLocaleDateString('ko-KR')` 와
 * 동일한 출력(`2026. 6. 2.`)을 낸다. 잘못된 날짜는 빈 문자열을 반환한다.
 */
export function formatDate(value: string | number | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'yyyy. M. d.', { locale: dateFnsLocale() });
}
