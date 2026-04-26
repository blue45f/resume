/**
 * 음성 페르소나 — 사이트 전반의 TTS(SpeechSynthesis) 사용처 단일 정의.
 *
 * 사용자 보고: '연령·성별 페르소나는 한국어 voice 매칭 정확도가 떨어져 어색한
 * voice 가 노출됨'. → 톤 4개 (차분·따뜻·또렷·부드러운) 로 단순화 + 한국어 native
 * 휴리스틱으로 어색한 voice 자동 제외.
 *
 * 사용처: features/interview-prep/CameraInterview, components/AudioSummaryPanel.
 * 새 TTS 컴포넌트 추가 시 반드시 여기 import 해 일관 페르소나 사용.
 */

export type VoicePersona = {
  id: 'tone-calm' | 'tone-warm' | 'tone-bright' | 'tone-soft';
  label: string;
  icon: string;
  rate: number;
  pitch: number;
  lang: 'ko-KR';
};

export const VOICE_PERSONAS: VoicePersona[] = [
  { id: 'tone-calm', label: '차분한 톤', icon: '🎙️', rate: 0.92, pitch: 0.9, lang: 'ko-KR' },
  { id: 'tone-warm', label: '따뜻한 톤', icon: '☕', rate: 0.98, pitch: 1.0, lang: 'ko-KR' },
  { id: 'tone-bright', label: '또렷한 톤', icon: '✨', rate: 1.05, pitch: 1.1, lang: 'ko-KR' },
  { id: 'tone-soft', label: '부드러운 톤', icon: '🪶', rate: 1.0, pitch: 0.95, lang: 'ko-KR' },
];

export const DEFAULT_PERSONA_ID: VoicePersona['id'] = 'tone-warm';

/**
 * 한국어 native 로 자연스럽게 들리는 voice 만 통과시키는 휴리스틱.
 * 제외:
 * - lang 이 ko-* 가 아닌 voice
 * - lang 은 ko 라도 name 이 영어 brand fallback / multilingual default
 * 통과:
 * - 명시 native voice (Apple/MS/Google/Samsung 한국어 voice 들)
 * - ko-KR 명시 voice (시스템 native 신호)
 */
export function isNaturalKoreanVoice(voice: SpeechSynthesisVoice): boolean {
  if (!voice.lang.toLowerCase().startsWith('ko')) return false;
  const n = voice.name.toLowerCase();
  const fallbackHints = ['default', 'eloquence', 'multilingual', 'novelty'];
  if (fallbackHints.some((h) => n.includes(h))) return false;
  return true;
}

/**
 * 페르소나에 가장 적합한 한국어 native voice 매칭.
 * native voice 가 0개면 undefined → SpeechSynthesisUtterance 가 system default 사용.
 * 톤별로 voice index 분산해 같은 시스템에 native 가 여럿이면 다른 voice 로 차별화.
 */
export function matchPersonaVoice(
  persona: VoicePersona,
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const natural = voices.filter(isNaturalKoreanVoice);
  if (natural.length === 0) return undefined;
  const idx = VOICE_PERSONAS.findIndex((p) => p.id === persona.id);
  return natural[idx % natural.length];
}

/**
 * 자연스러운 한국어 voice 만 필터링 (페르소나 매칭 외 직접 select 노출용).
 * UI 에서 사용자가 직접 voice 를 고르고 싶을 때.
 */
export function filterNaturalKoreanVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices.filter(isNaturalKoreanVoice);
}
