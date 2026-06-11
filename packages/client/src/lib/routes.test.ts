import { describe, expect, it } from 'vitest';
import { ROUTES, TERMSDESK_URLS, withQuery, isActive } from './routes';

describe('ROUTES', () => {
  it('exposes core static paths', () => {
    expect(ROUTES.home).toBe('/');
    expect(ROUTES.login).toBe('/login');
    expect(ROUTES.about).toBe('/about');
  });

  it('keeps legal routes internal while TermsDesk URLs stay for source docs and support', () => {
    expect(ROUTES.terms).toBe('/terms');
    expect(ROUTES.privacy).toBe('/privacy');
    expect(TERMSDESK_URLS).toEqual({
      terms: 'https://termsdesk.vercel.app/p/resume/terms-of-service',
      privacy: 'https://termsdesk.vercel.app/p/resume/privacy-policy',
      refund: 'https://termsdesk.vercel.app/p/resume/refund-policy',
      support: 'https://termsdesk.vercel.app/support/resume',
    });
  });

  it('builds dynamic resume paths', () => {
    expect(ROUTES.resume.edit('abc')).toBe('/resumes/abc/edit');
    expect(ROUTES.resume.preview('xyz')).toBe('/resumes/xyz/preview');
    expect(ROUTES.resume.profile('me')).toBe('/@me');
    expect(ROUTES.resume.profile('me', 'slug')).toBe('/@me/slug');
  });

  it('builds interview.mock with and without params', () => {
    expect(ROUTES.interview.mock()).toBe('/mock-interview');
    expect(ROUTES.interview.mock({ jobPostId: 'jp1' })).toBe('/mock-interview?jobPostId=jp1');
    expect(ROUTES.interview.mock({ question: 'q' })).toBe('/mock-interview?question=q');
  });
});

describe('withQuery', () => {
  it('returns base when no query', () => {
    expect(withQuery('/foo', {})).toBe('/foo');
    expect(withQuery('/foo', { x: undefined })).toBe('/foo');
  });

  it('appends ? for first param', () => {
    expect(withQuery('/foo', { a: 1 })).toBe('/foo?a=1');
  });

  it('appends & when base already has query', () => {
    expect(withQuery('/foo?b=2', { a: 1 })).toBe('/foo?b=2&a=1');
  });

  it('skips undefined/empty values', () => {
    const out = withQuery('/foo', { a: 1, b: '', c: undefined, d: 'x' });
    expect(out).toContain('a=1');
    expect(out).toContain('d=x');
    expect(out).not.toContain('b=');
    expect(out).not.toContain('c=');
  });
});

describe('isActive', () => {
  it('matches home only for exact "/"', () => {
    expect(isActive('/', '/')).toBe(true);
    expect(isActive('/foo', '/')).toBe(false);
  });

  it('matches sub-paths under route', () => {
    expect(isActive('/resumes/1/edit', '/resumes')).toBe(true);
    expect(isActive('/resumes', '/resumes')).toBe(true);
  });

  it('strips query string from route before matching', () => {
    expect(isActive('/community', '/community?category=notice')).toBe(true);
  });

  it('returns false for unrelated paths', () => {
    expect(isActive('/jobs', '/resumes')).toBe(false);
  });
});
