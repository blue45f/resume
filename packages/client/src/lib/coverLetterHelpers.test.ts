import { describe, expect, it } from 'vitest';
import {
  recommendCoverLetterOpeners,
  detectSelfDeprecation,
  analyzeCallToAction,
} from './coverLetterHelpers';

describe('recommendCoverLetterOpeners', () => {
  it('returns 3 distinct opener styles', () => {
    const out = recommendCoverLetterOpeners('Java Kotlin Spring 백엔드 개발자', '카카오', '백엔드');
    expect(out).toHaveLength(3);
    const styles = out.map((o) => o.style);
    expect(styles).toContain('achievement');
    expect(styles).toContain('passion');
    expect(styles).toContain('pragmatic');
  });

  it('uses fallback company/role when not provided', () => {
    const out = recommendCoverLetterOpeners('Kotlin Spring');
    expect(out.some((o) => o.text.includes('귀사'))).toBe(true);
  });
});

describe('detectSelfDeprecation', () => {
  it('returns none for confident text', () => {
    const r = detectSelfDeprecation('전문성을 갖춘 백엔드 개발자입니다.');
    expect(r.level).toBe('none');
    expect(r.count).toBe(0);
  });

  it('detects 부족하지만', () => {
    const r = detectSelfDeprecation('부족하지만 최선을 다하겠습니다.');
    expect(r.count).toBeGreaterThan(0);
    expect(r.hits[0].phrase).toBe('부족하지만');
  });

  it('detects multiple self-deprecation patterns', () => {
    const r = detectSelfDeprecation('부족하지만 미흡하지만 잘 모르지만 서투르지만');
    expect(r.count).toBeGreaterThanOrEqual(3);
    expect(r.level).toBe('many');
  });
});

describe('analyzeCallToAction', () => {
  it('reports no CTA for plain text', () => {
    const r = analyzeCallToAction('단순 본문입니다.');
    expect(r.hasCTA).toBe(false);
  });

  it('detects CTA in last paragraph', () => {
    const text = '경력 소개입니다.\n\n귀사에 기여하고 싶습니다. 감사합니다.';
    const r = analyzeCallToAction(text);
    expect(r.hasCTA).toBe(true);
    expect(r.matched.length).toBeGreaterThanOrEqual(1);
  });

  it('considers only the last paragraph', () => {
    const text = '기여하고 싶다고 했지만 이건 마지막이 아닙니다.\n\n그냥 평이한 마무리입니다.';
    const r = analyzeCallToAction(text);
    expect(r.hasCTA).toBe(false);
  });
});
