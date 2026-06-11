import { describe, expect, it } from 'vitest';
import { TERMSDESK_URLS } from '@/lib/routes';
import { policyApiUrl, policyDocumentSchema, policyPublicUrl } from './policyApi';

describe('policy URLs', () => {
  it('builds the TermsDesk public API URL per slug', () => {
    expect(policyApiUrl('terms-of-service')).toBe(
      'https://termsdesk.vercel.app/api/public/resume/policies/terms-of-service',
    );
    expect(policyApiUrl('privacy-policy')).toBe(
      'https://termsdesk.vercel.app/api/public/resume/policies/privacy-policy',
    );
  });

  it('maps slugs to the canonical TermsDesk source pages', () => {
    expect(policyPublicUrl('terms-of-service')).toBe(TERMSDESK_URLS.terms);
    expect(policyPublicUrl('privacy-policy')).toBe(TERMSDESK_URLS.privacy);
  });
});

describe('policyDocumentSchema', () => {
  const payload = {
    orgName: 'Resume Gongbang',
    policySlug: 'terms-of-service',
    name: '이용약관',
    type: 'terms',
    locale: 'ko',
    versionId: 'resume:terms-of-service:v1',
    versionLabel: 'v1',
    contentHash: '82839b2db01670e84632f616b9d29330f001cc192bad7f14e19dca0f65ff3b5d',
    body: '제1조 (목적)\n본문',
    effectiveAt: '2026-06-08T00:00:00.000Z',
    publishedAt: '2026-06-08T00:00:00.000Z',
    changeSummary: 'TermsDesk 중앙 게시본으로 이전',
    availableVersions: ['v1'],
    unresolvedVars: [],
  };

  it('accepts a live-shaped payload and keeps the trust surface fields', () => {
    const parsed = policyDocumentSchema.parse(payload);
    expect(parsed.name).toBe('이용약관');
    expect(parsed.versionLabel).toBe('v1');
    expect(parsed.contentHash.slice(0, 12)).toBe('82839b2db016');
    expect(parsed.effectiveAt).toBe('2026-06-08T00:00:00.000Z');
  });

  it('tolerates missing optional meta but rejects a payload without the trust surface', () => {
    const { effectiveAt: _e, publishedAt: _p, changeSummary: _c, ...minimal } = payload;
    expect(policyDocumentSchema.safeParse(minimal).success).toBe(true);

    const { contentHash: _h, ...withoutHash } = payload;
    expect(policyDocumentSchema.safeParse(withoutHash).success).toBe(false);
    expect(policyDocumentSchema.safeParse({}).success).toBe(false);
  });
});
