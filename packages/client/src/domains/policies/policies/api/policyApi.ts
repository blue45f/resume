import { z } from 'zod'

import { TERMSDESK_BASE, TERMSDESK_URLS } from '@/lib/routes'

/**
 * 약관/개인정보처리방침 정본은 TermsDesk(중앙 정책 게시 서비스)의 무인증
 * 공개 API에서 가져온다. 자체 백엔드(API_URL)와 무관한 외부 절대 URL이라
 * `useApiQuery` 대신 표준 fetch를 직접 사용한다.
 */
export const POLICY_SLUGS = ['terms-of-service', 'privacy-policy'] as const
export type PolicySlug = (typeof POLICY_SLUGS)[number]

export function policyApiUrl(slug: PolicySlug): string {
  return `${TERMSDESK_BASE}/api/public/resume/policies/${slug}`
}

/** 장애 시 폴백 및 정본 확인용 TermsDesk 원문(렌더된 공개 페이지) URL. */
export function policyPublicUrl(slug: PolicySlug): string {
  return slug === 'privacy-policy' ? TERMSDESK_URLS.privacy : TERMSDESK_URLS.terms
}

/**
 * TermsDesk 공개 정책 API 응답 (GET /api/public/resume/policies/<slug>).
 * 신뢰 표면(이름·본문·버전·해시)만 필수로 강제하고, 나머지 메타는 게시
 * 상태에 따라 비어 있을 수 있어 관대하게 받는다.
 */
export const policyDocumentSchema = z.object({
  policySlug: z.string(),
  name: z.string(),
  versionLabel: z.string(),
  contentHash: z.string(),
  body: z.string(),
  effectiveAt: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  changeSummary: z.string().nullable().optional(),
})
export type PolicyDocument = z.infer<typeof policyDocumentSchema>

export async function fetchPolicy(
  slug: PolicySlug,
  { signal }: { signal?: AbortSignal } = {}
): Promise<PolicyDocument> {
  const response = await fetch(policyApiUrl(slug), {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`TermsDesk policy fetch failed: ${response.status}`)
  }

  const parsed = policyDocumentSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new Error('TermsDesk policy payload failed validation')
  }

  return parsed.data
}
