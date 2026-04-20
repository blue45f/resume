/**
 * 단일 엔트리 캐시 — 동일한 text 가 짧은 시간 내 여러 분석기 내부에서 재호출될 때 중복 계산 제거.
 * 텍스트가 바뀌면 즉시 교체. 과거 값 버림. 메모리 누수 위험 없음.
 */
export function memoizeByText<T>(fn: (text: string) => T): (text: string) => T {
  let lastInput: string | null = null;
  let lastOutput: T;
  return (text: string): T => {
    if (lastInput === text) return lastOutput;
    lastInput = text;
    lastOutput = fn(text);
    return lastOutput;
  };
}
