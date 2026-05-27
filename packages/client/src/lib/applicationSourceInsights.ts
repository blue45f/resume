import type { JobApplication } from './api';

export interface ApplicationSourceInsight {
  label: string;
  count: number;
  responseCount: number;
  offerCount: number;
  staleCount: number;
  conversionRate: number;
  offerRate: number;
}

export interface ApplicationSourceInsightSummary {
  sources: ApplicationSourceInsight[];
  bestSource: ApplicationSourceInsight | null;
  riskSource: ApplicationSourceInsight | null;
  summary: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RESPONSE_STATUSES = new Set([
  'interview',
  'interviewing',
  'technical',
  'onsite',
  'final',
  'offer',
]);
const ACTIVE_STATUSES = new Set([
  'applied',
  'screening',
  'interview',
  'interviewing',
  'technical',
  'onsite',
  'final',
]);

const SOURCE_LABELS: Array<[RegExp, string]> = [
  [/linkedin\.com$/i, 'LinkedIn'],
  [/wanted\.co\.kr$/i, 'Wanted'],
  [/saramin\.co\.kr$/i, 'Saramin'],
  [/jobkorea\.co\.kr$/i, 'JobKorea'],
  [/jumpit\.saramin\.co\.kr$/i, 'Jumpit'],
  [/programmers\.co\.kr$/i, 'Programmers'],
  [/indeed\.com$/i, 'Indeed'],
  [/greenhouse\.io$/i, 'Greenhouse'],
  [/lever\.co$/i, 'Lever'],
  [/workdayjobs\.com$/i, 'Workday'],
];

const normalizeStatus = (status: string) => status.trim().toLowerCase();

const getHost = (url?: string | null) => {
  if (!url?.trim()) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

const daysSince = (date?: string, now = new Date()) => {
  if (!date) return Number.POSITIVE_INFINITY;
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY;
  return Math.floor((now.getTime() - time) / DAY_MS);
};

export const getApplicationSourceLabel = (application: Pick<JobApplication, 'url'>) => {
  const host = getHost(application.url);
  if (!host) return '직접 입력';

  const known = SOURCE_LABELS.find(([pattern]) => pattern.test(host));
  if (known) return known[1];

  return host
    .split('.')
    .slice(-2, -1)[0]
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const buildApplicationSourceInsights = (
  applications: JobApplication[],
  now = new Date(),
): ApplicationSourceInsightSummary => {
  const sourceMap = new Map<string, ApplicationSourceInsight>();

  for (const application of applications) {
    const label = getApplicationSourceLabel(application);
    const existing =
      sourceMap.get(label) ??
      ({
        label,
        count: 0,
        responseCount: 0,
        offerCount: 0,
        staleCount: 0,
        conversionRate: 0,
        offerRate: 0,
      } satisfies ApplicationSourceInsight);
    const status = normalizeStatus(application.status);

    existing.count += 1;
    if (RESPONSE_STATUSES.has(status)) existing.responseCount += 1;
    if (status === 'offer') existing.offerCount += 1;
    if (ACTIVE_STATUSES.has(status) && daysSince(application.updatedAt, now) >= 14) {
      existing.staleCount += 1;
    }

    sourceMap.set(label, existing);
  }

  const sources = [...sourceMap.values()]
    .map((source) => ({
      ...source,
      conversionRate:
        source.count > 0 ? Math.round((source.responseCount / source.count) * 100) : 0,
      offerRate: source.count > 0 ? Math.round((source.offerCount / source.count) * 100) : 0,
    }))
    .sort(
      (a, b) =>
        b.count - a.count || b.conversionRate - a.conversionRate || a.label.localeCompare(b.label),
    );

  const bestSource =
    [...sources]
      .filter((source) => source.responseCount > 0)
      .sort((a, b) => b.conversionRate - a.conversionRate || b.count - a.count)[0] ?? null;
  const riskSource =
    [...sources]
      .filter((source) => source.staleCount > 0)
      .sort((a, b) => b.staleCount - a.staleCount || b.count - a.count)[0] ?? null;

  const summary = riskSource
    ? `${riskSource.label} 채널에 멈춘 지원 ${riskSource.staleCount}건이 있습니다.`
    : bestSource
      ? `${bestSource.label} 채널의 면접·오퍼 전환이 가장 좋습니다.`
      : '채널별 성과를 보려면 공고 URL을 함께 기록하세요.';

  return {
    sources,
    bestSource,
    riskSource,
    summary,
  };
};
