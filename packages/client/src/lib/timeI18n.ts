import { tx } from '@/lib/i18n';

/**
 * i18n 기반 상대 시간 포매터 — 로케일(ko/en/ja) 별 datetime.* JSON 사전 사용.
 * 기존 timeAgo 는 하드코딩 한국어로 유지(하위 호환), 신규 UI 는 이 함수 사용 권장.
 */
export function timeAgoI18n(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return tx('datetime.justNow');
  if (minutes < 60) return tx('datetime.minutesAgo', { n: minutes });
  if (hours < 24) return tx('datetime.hoursAgo', { n: hours });
  if (days < 7) return tx('datetime.daysAgo', { n: days });
  if (days < 30) return tx('datetime.weeksAgo', { n: Math.floor(days / 7) });
  if (days < 365) return tx('datetime.monthsAgo', { n: Math.floor(days / 30) });
  return tx('datetime.yearsAgo', { n: Math.floor(days / 365) });
}
