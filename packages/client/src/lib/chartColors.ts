/**
 * Impeccable chart palette — 사이트 전역 차트 색상의 단일 정의 위치.
 *
 * (.impeccable.md 정의 기반)
 * - sapphire (가장 진중한 1차 데이터)
 * - cyan-700 (2차 baseline)
 * - emerald (success 시맨틱)
 * - amber (warning 시맨틱)
 * - rose (danger 시맨틱)
 *
 * AdminPage / DashboardStats 등 여러 곳에서 같은 배열이 중복 정의되어 있던
 * 패턴을 이 모듈로 통일. 추가 차트 컴포넌트는 여기서 import 한다.
 */

export const CHART_COLORS = [
  '#0c4a6e', // sapphire (sky-900)
  '#0891b2', // cyan-700
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#f43f5e', // rose-500
] as const;

export type ChartColorIndex = 0 | 1 | 2 | 3 | 4;

/** Cycle through colors for arbitrary-length data sets */
export function pickChartColor(i: number): string {
  return CHART_COLORS[((i % CHART_COLORS.length) + CHART_COLORS.length) % CHART_COLORS.length];
}

/** Semantic accessors for status-based charts */
export const CHART_SEMANTIC = {
  primary: CHART_COLORS[0],
  secondary: CHART_COLORS[1],
  success: CHART_COLORS[2],
  warning: CHART_COLORS[3],
  danger: CHART_COLORS[4],
} as const;
