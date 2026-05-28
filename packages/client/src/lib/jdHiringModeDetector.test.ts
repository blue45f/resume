import { describe, expect, it } from 'vitest';
import { detectHiringMode } from './jdHiringModeDetector';

describe('detectHiringMode', () => {
  it('returns unclear for empty text', () => {
    const r = detectHiringMode('');
    expect(r.mode).toBe('unclear');
    expect(r.batchScore).toBe(0);
    expect(r.rollingScore).toBe(0);
  });

  it('detects batch hiring from 공채 signal', () => {
    const text = '2026년 하반기 공채 모집. 서류 전형 → 인적성 검사 → 면접 순으로 진행됩니다.';
    const r = detectHiringMode(text);
    expect(r.mode).toBe('batch');
    expect(r.batchSignals.length).toBeGreaterThanOrEqual(2);
  });

  it('detects batch from 인적성 + 어학성적 signals', () => {
    const text = '인적성 검사 포함. TOEIC 800점 이상 필수.';
    const r = detectHiringMode(text);
    expect(r.batchScore).toBeGreaterThanOrEqual(2);
    expect(r.mode).toBe('batch');
  });

  it('detects rolling hiring from 즉시 출근 + 포트폴리오 signals', () => {
    const text = '즉시 출근 가능한 분. GitHub 포트폴리오 URL 필수 첨부. 수시 마감.';
    const r = detectHiringMode(text);
    expect(r.mode).toBe('rolling');
    expect(r.rollingSignals.length).toBeGreaterThanOrEqual(2);
  });

  it('detects mixed when batch and rolling signals are equal', () => {
    const text = '공채 인적성 검사 포함. 포트폴리오 제출 및 즉시 출근 가능한 분.';
    const r = detectHiringMode(text);
    expect(['mixed', 'batch', 'rolling']).toContain(r.mode);
    expect(r.batchScore).toBeGreaterThanOrEqual(1);
    expect(r.rollingScore).toBeGreaterThanOrEqual(1);
  });

  it('provides non-empty tips', () => {
    const text = '공개채용 진행 중. 인적성 검사 포함.';
    const r = detectHiringMode(text);
    expect(r.tips.length).toBeGreaterThan(0);
  });

  it('modeLabel is a Korean string', () => {
    const r = detectHiringMode('수시채용. 포트폴리오 URL 첨부. 즉시 출근 가능자 우대.');
    expect(r.modeLabel).toBe('수시채용');
  });

  it('returns unclear for text with no hiring signals', () => {
    const text = '백엔드 개발자 모집. Java Spring 경력자. REST API 설계 경험.';
    const r = detectHiringMode(text);
    expect(r.mode).toBe('unclear');
  });
});
