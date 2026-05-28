import { describe, expect, it } from 'vitest';
import { extractJdRemoteWorkPolicy } from './jdRemoteWorkPolicyExtractor';

describe('extractJdRemoteWorkPolicy', () => {
  it('returns unclear for empty text', () => {
    const r = extractJdRemoteWorkPolicy('');
    expect(r.arrangement).toBe('unclear');
    expect(r.confidence).toBe('low');
  });

  it('detects fully remote', () => {
    const r = extractJdRemoteWorkPolicy('풀리모트 근무 가능합니다. 완전 재택으로 운영됩니다.');
    expect(r.arrangement).toBe('fully_remote');
    expect(r.confidence).not.toBe('low');
  });

  it('detects on-site', () => {
    const r = extractJdRemoteWorkPolicy('사무실 출근 필수이며 재택 불가한 포지션입니다.');
    expect(r.arrangement).toBe('on_site');
  });

  it('detects hybrid with days', () => {
    const r = extractJdRemoteWorkPolicy('하이브리드 근무. 주 3일 재택, 나머지 출근합니다.');
    expect(r.arrangement).toBe('hybrid');
    expect(r.officeWeeklyDays).toBe(2);
  });

  it('detects flexible arrangement', () => {
    const r = extractJdRemoteWorkPolicy('자율 재택 운영 중이며 팀원과 협의해 근무지를 정합니다.');
    expect(r.arrangement).toBe('flexible');
  });

  it('returns signals list', () => {
    const r = extractJdRemoteWorkPolicy('원격 근무 가능');
    expect(r.signals.length).toBeGreaterThan(0);
    expect(r.signals.some((s) => s.type === 'explicit_remote')).toBe(true);
  });

  it('summary is non-empty', () => {
    const r = extractJdRemoteWorkPolicy('판교 소재 사무실 근무');
    expect(r.summary.length).toBeGreaterThan(3);
  });

  it('tips are provided', () => {
    const r = extractJdRemoteWorkPolicy('공고 내용');
    expect(r.tips.length).toBeGreaterThan(0);
  });
});
