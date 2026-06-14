import { describe, expect, it } from 'vitest'

import { buildWorkModalityReport } from './jdWorkModality'

describe('buildWorkModalityReport', () => {
  it('returns unknown for empty input', () => {
    const r = buildWorkModalityReport('')
    expect(r.modality).toBe('unknown')
    expect(r.signals).toHaveLength(0)
  })

  it('detects full remote (전면 재택)', () => {
    const r = buildWorkModalityReport('전면 재택 근무 가능한 포지션입니다.')
    expect(r.modality).toBe('remote')
  })

  it('detects English remote (full remote)', () => {
    const r = buildWorkModalityReport('This is a fully remote position. Work from anywhere.')
    expect(r.modality).toBe('remote')
  })

  it('detects hybrid (주 2일 재택)', () => {
    const r = buildWorkModalityReport('주 2일 재택, 3일 출근 방식으로 운영됩니다.')
    expect(r.modality).toBe('hybrid')
  })

  it('detects hybrid keyword', () => {
    const r = buildWorkModalityReport('하이브리드 근무 형태를 지원합니다.')
    expect(r.modality).toBe('hybrid')
  })

  it('detects onsite (필수 출근)', () => {
    const r = buildWorkModalityReport('사무실 근무 필수, 재택 불가 포지션입니다.')
    expect(r.modality).toBe('onsite')
  })

  it('detects onsite in English (on-site)', () => {
    const r = buildWorkModalityReport('This is an on-site role at our Seoul office.')
    expect(r.modality).toBe('onsite')
  })

  it('detects flexible (유연 근무)', () => {
    const r = buildWorkModalityReport('자율 출퇴근 및 유연 근무제를 시행합니다.')
    expect(r.modality).toBe('flexible')
  })

  it('detects relocation requirement', () => {
    const r = buildWorkModalityReport('지방 근무 가능한 분, 이사 지원 제공.')
    expect(r.relocationRequired).toBe(true)
  })

  it('classifies as hybrid when both remote and onsite signals exist', () => {
    const r = buildWorkModalityReport('재택 근무 가능하며 주 2회 사무실 출근이 필요합니다.')
    expect(r.modality).toBe('hybrid')
  })

  it('provides signals for detected patterns', () => {
    const r = buildWorkModalityReport('전면 재택 근무를 기본으로 합니다.')
    expect(r.signals.length).toBeGreaterThan(0)
  })

  it('returns unknown when no work modality signals exist', () => {
    const r = buildWorkModalityReport('뛰어난 Python 개발자를 모집합니다. React 경험 우대.')
    expect(r.modality).toBe('unknown')
  })
})
