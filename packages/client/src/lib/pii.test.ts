import { describe, expect, it } from 'vitest';
import { detectContactInfo, detectPersonalInfo } from './pii';

describe('detectContactInfo', () => {
  it('finds email and reports valid', () => {
    const r = detectContactInfo('연락처: dev@example.com');
    expect(r.emails).toHaveLength(1);
    expect(r.emails[0].valid).toBe(true);
  });

  it('extracts Korean mobile phone with dashes', () => {
    const r = detectContactInfo('연락: 010-1234-5678 입니다.');
    expect(r.phones).toHaveLength(1);
    expect(r.phones[0].valid).toBe(true);
    expect(r.phones[0].normalized).toMatch(/^0\d{8,10}$/);
  });

  it('summarizes none when text is empty', () => {
    const r = detectContactInfo('');
    expect(r.emails).toHaveLength(0);
    expect(r.phones).toHaveLength(0);
    expect(r.summary).toContain('감지되지 않');
  });

  it('handles +82 country code in phone', () => {
    const r = detectContactInfo('Phone: +82-10-1234-5678');
    expect(r.phones.length).toBeGreaterThanOrEqual(1);
    expect(r.phones[0].normalized.startsWith('0')).toBe(true);
  });
});

describe('detectPersonalInfo', () => {
  it('flags RRN as critical', () => {
    const r = detectPersonalInfo('주민: 901231-1234567');
    expect(r.severity).toBe('critical');
    expect(r.hits.some((h) => h.type === 'rrn')).toBe(true);
    // sample 은 마스킹되어야 함
    expect(r.hits.find((h) => h.type === 'rrn')?.sample).toMatch(/\*{7}/);
  });

  it('flags credit card as critical', () => {
    const r = detectPersonalInfo('카드: 1234-5678-9012-3456');
    expect(r.severity).toBe('critical');
    expect(r.hits.some((h) => h.type === 'card')).toBe(true);
  });

  it('flags YYYYMMDD birth as warning', () => {
    const r = detectPersonalInfo('생년월일: 19900315');
    expect(r.severity).toBe('warning');
    expect(r.hits.some((h) => h.type === 'birthYmd')).toBe(true);
  });

  it('flags detailed Korean address (동/읍/면 + 번지)', () => {
    const r = detectPersonalInfo('주소: 역삼동 123-45');
    expect(r.hits.some((h) => h.type === 'address')).toBe(true);
  });

  it('returns none severity for clean text', () => {
    const r = detectPersonalInfo('백엔드 개발자 5년차 입니다.');
    expect(r.severity).toBe('none');
    expect(r.hits).toHaveLength(0);
  });
});
