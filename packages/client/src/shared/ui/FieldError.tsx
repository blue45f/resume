/**
 * 폼 필드 검증 a11y 프리미티브 — 시각적 에러 메시지를 입력과 의미적으로 연결한다.
 * 핵심 폼(ResumeForm/LoginPage)이 손으로 적용하던 aria-invalid + aria-describedby +
 * role="alert" 패턴을 한곳으로 모아 2차 페이지에도 일관 적용한다.
 *
 * 사용:
 *   <input {...register('company')} {...fieldAria('jobpost-company', errors.company)} />
 *   <FieldError id="jobpost-company" message={errors.company?.message} />
 */

/** 입력에 스프레드할 aria 속성. 에러가 있을 때만 invalid/describedby 를 켠다. */
export function fieldAria(
  id: string,
  error: unknown,
): {
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
} {
  const hasError = Boolean(error);
  return {
    'aria-invalid': hasError || undefined,
    'aria-describedby': hasError ? `${id}-error` : undefined,
  };
}

/** 에러 메시지 영역. id 는 입력의 aria-describedby 와 짝을 이룬다(`${id}-error`). */
function renderFieldError({
  id,
  message,
  className = 'text-xs text-red-500 mt-1',
}: {
  id: string;
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} role="alert" className={className}>
      {message}
    </p>
  );
}

export const FieldError = renderFieldError;
