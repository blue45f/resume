import { describe, expect, it } from 'vitest'

import {
  VOICE_PERSONAS,
  DEFAULT_PERSONA_ID,
  isNaturalKoreanVoice,
  naturalnessScore,
  matchPersonaVoice,
  filterNaturalKoreanVoices,
} from './voicePersona'

function makeVoice(partial: Partial<SpeechSynthesisVoice>): SpeechSynthesisVoice {
  return {
    name: '',
    lang: 'ko-KR',
    voiceURI: '',
    localService: false,
    default: false,
    ...partial,
  } as SpeechSynthesisVoice
}

describe('VOICE_PERSONAS catalog', () => {
  it('exposes 8 distinct personas', () => {
    expect(VOICE_PERSONAS).toHaveLength(8)
    const ids = new Set(VOICE_PERSONAS.map((p) => p.id))
    expect(ids.size).toBe(8)
  })

  it('every persona has rate within 0.88~1.05 and pitch within 0.85~1.1', () => {
    for (const p of VOICE_PERSONAS) {
      expect(p.rate).toBeGreaterThanOrEqual(0.88)
      expect(p.rate).toBeLessThanOrEqual(1.05)
      expect(p.pitch).toBeGreaterThanOrEqual(0.85)
      expect(p.pitch).toBeLessThanOrEqual(1.1)
      expect(p.lang).toBe('ko-KR')
    }
  })

  it('DEFAULT_PERSONA_ID resolves to a real persona', () => {
    expect(VOICE_PERSONAS.find((p) => p.id === DEFAULT_PERSONA_ID)).toBeDefined()
  })
})

describe('isNaturalKoreanVoice', () => {
  it('passes Yuna premium', () => {
    expect(isNaturalKoreanVoice(makeVoice({ name: 'Yuna Premium', lang: 'ko-KR' }))).toBe(true)
  })

  it('rejects non-ko lang', () => {
    expect(isNaturalKoreanVoice(makeVoice({ name: 'Samantha', lang: 'en-US' }))).toBe(false)
  })

  it('rejects novelty voices (Fred / Cellos / Whisper)', () => {
    expect(isNaturalKoreanVoice(makeVoice({ name: 'Fred', lang: 'ko-KR' }))).toBe(false)
    expect(isNaturalKoreanVoice(makeVoice({ name: 'Cellos', lang: 'ko-KR' }))).toBe(false)
    expect(isNaturalKoreanVoice(makeVoice({ name: 'Whisper', lang: 'ko-KR' }))).toBe(false)
  })
})

describe('naturalnessScore', () => {
  it('boosts neural / wavenet / premium hints by +30', () => {
    const a = naturalnessScore(makeVoice({ name: 'ko-KR Wavenet A' }))
    const b = naturalnessScore(makeVoice({ name: 'PlainVoice' }))
    expect(a - b).toBeGreaterThanOrEqual(30)
  })

  it('adds +10 for vendor preferred names', () => {
    const score = naturalnessScore(makeVoice({ name: 'Google ko' }))
    expect(score).toBeGreaterThanOrEqual(10)
  })

  it('adds +5 for localService and +2 for default', () => {
    const s1 = naturalnessScore(makeVoice({ name: 'X', localService: true, default: true }))
    const s2 = naturalnessScore(makeVoice({ name: 'X' }))
    expect(s1 - s2).toBe(7)
  })
})

describe('matchPersonaVoice', () => {
  it('returns undefined when no natural Korean voice exists', () => {
    const en = [makeVoice({ name: 'Samantha', lang: 'en-US' })]
    expect(matchPersonaVoice(VOICE_PERSONAS[0], en)).toBeUndefined()
  })

  it('returns one of the natural voices', () => {
    const voices = [
      makeVoice({ name: 'Yuna Premium', lang: 'ko-KR' }),
      makeVoice({ name: 'Google ko-KR Wavenet', lang: 'ko-KR' }),
      makeVoice({ name: 'Fred', lang: 'ko-KR' }), // 제외 대상
    ]
    const v = matchPersonaVoice(VOICE_PERSONAS[0], voices)
    expect(v).toBeDefined()
    expect(v!.name).not.toBe('Fred')
  })
})

describe('filterNaturalKoreanVoices', () => {
  it('drops non-Korean + novelty voices and sorts by naturalness', () => {
    const voices = [
      makeVoice({ name: 'Fred', lang: 'ko-KR' }),
      makeVoice({ name: 'Samantha', lang: 'en-US' }),
      makeVoice({ name: 'Plain ko', lang: 'ko-KR' }),
      makeVoice({ name: 'Yuna Premium', lang: 'ko-KR' }),
    ]
    const result = filterNaturalKoreanVoices(voices)
    expect(result.map((v) => v.name)).not.toContain('Fred')
    expect(result.map((v) => v.name)).not.toContain('Samantha')
    // Yuna Premium 이 상위
    expect(result[0].name).toBe('Yuna Premium')
  })
})
