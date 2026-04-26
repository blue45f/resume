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
  id:
    | 'tone-calm'
    | 'tone-warm'
    | 'tone-bright'
    | 'tone-soft'
    | 'tone-trust'
    | 'tone-formal'
    | 'tone-friendly'
    | 'tone-confident';
  label: string;
  icon: string;
  rate: number;
  pitch: number;
  lang: 'ko-KR';
};

/**
 * 8 톤 — 자연스러운 한국어 면접/낭독 분위기를 위한 rate/pitch 미세조정.
 *
 * 자연스러움 원칙 (한국어 음성 합성 연구 기반):
 * - rate: 0.88 ~ 1.05 범위 (1.0 미만이 더 침착·신뢰감, 1.0 이상은 활기)
 *   1.1 이상은 부자연스러워짐 (특히 native 한국어 voice)
 * - pitch: 0.85 ~ 1.1 범위
 *   0.85 미만은 너무 굵어 robotic, 1.15 이상은 거슬리는 high-pitched
 *
 * 8개 톤 모두 위 범위 내에서 분포해 가장 자연스러운 결과 보장.
 */
export const VOICE_PERSONAS: VoicePersona[] = [
  { id: 'tone-calm', label: '차분한 톤', icon: '🎙️', rate: 0.9, pitch: 0.95, lang: 'ko-KR' },
  { id: 'tone-warm', label: '따뜻한 톤', icon: '☕', rate: 0.95, pitch: 1.0, lang: 'ko-KR' },
  { id: 'tone-bright', label: '또렷한 톤', icon: '✨', rate: 1.0, pitch: 1.05, lang: 'ko-KR' },
  { id: 'tone-soft', label: '부드러운 톤', icon: '🪶', rate: 0.92, pitch: 1.0, lang: 'ko-KR' },
  { id: 'tone-trust', label: '신뢰감 있는 톤', icon: '🔒', rate: 0.92, pitch: 0.9, lang: 'ko-KR' },
  { id: 'tone-formal', label: '정중한 톤', icon: '🎩', rate: 0.93, pitch: 0.95, lang: 'ko-KR' },
  { id: 'tone-friendly', label: '친근한 톤', icon: '😊', rate: 1.0, pitch: 1.05, lang: 'ko-KR' },
  {
    id: 'tone-confident',
    label: '자신감 있는 톤',
    icon: '🎤',
    rate: 0.97,
    pitch: 0.98,
    lang: 'ko-KR',
  },
];

export const DEFAULT_PERSONA_ID: VoicePersona['id'] = 'tone-warm';

/**
 * 시스템별 자연스러운 한국어 voice 화이트리스트 (이름 기반).
 * 우선순위: 클라우드 wavenet/neural > Apple Premium > MS neural > 일반 native > 기타.
 * 신경망 합성 voice 가 가장 자연스러움 — 우선 매칭.
 */
const PREFERRED_VOICE_NAMES_RE = [
  // Apple 한국어 enhanced (Yuna premium / Suri)
  /yuna.*\bpremium\b/i,
  /yuna.*\benhanced\b/i,
  /yuna/i,
  /\bsuri\b.*ko/i,
  // Google neural / wavenet (Chrome)
  /google.*ko/i,
  /\bko-KR\b.*wavenet/i,
  /\bko-KR\b.*neural/i,
  // Microsoft neural (Edge)
  /microsoft.*\bsunhi\b/i,
  /microsoft.*\bheami\b/i,
  /microsoft.*\binjoon\b/i,
  /microsoft.*\bbongjin\b/i,
  /microsoft.*\bgookmin\b/i,
  /microsoft.*\bjimin\b/i,
  /microsoft.*\bseoyeon\b/i,
  /microsoft.*\bsoonbok\b/i,
  /microsoft.*neural/i,
  // Samsung TTS (모바일)
  /samsung.*korean/i,
];

/** 신경망 합성 ('neural', 'wavenet', 'premium', 'enhanced')은 더 자연스러움. */
const NEURAL_HINT_RE = /neural|wavenet|premium|enhanced|natural|studio/i;

/**
 * 한국어 native 로 자연스럽게 들리는 voice 만 통과시키는 휴리스틱.
 * 제외:
 * - lang 이 ko-* 가 아닌 voice
 * - lang 은 ko 라도 name 이 영어 brand fallback / multilingual default / novelty
 * 통과:
 * - 명시 native voice (Apple/MS/Google/Samsung 한국어 voice 들)
 * - ko-KR 명시 voice (시스템 native 신호)
 */
export function isNaturalKoreanVoice(voice: SpeechSynthesisVoice): boolean {
  if (!voice.lang.toLowerCase().startsWith('ko')) return false;
  const n = voice.name.toLowerCase();
  const fallbackHints = [
    'default',
    'eloquence',
    'multilingual',
    'novelty',
    'fred',
    'organ',
    'whisper',
    'cellos',
    'good news',
    'bad news',
    'bubbles',
    'pipe',
    'bahh',
    'jester',
    'ralph',
    'kathy',
    'albert',
    'junior',
  ];
  if (fallbackHints.some((h) => n.includes(h))) return false;
  return true;
}

/**
 * voice 자연도 점수 — 높을수록 자연스러움. 정렬용.
 *
 * - 신경망 hint (neural/wavenet/premium/enhanced): +30
 * - PREFERRED_VOICE_NAMES_RE 매칭: +10 (특정 vendor 우선)
 * - localService=true: +5 (시스템 native, OS 통합 voice)
 * - default=true: +2 (시스템이 기본으로 선택한 voice)
 */
export function naturalnessScore(voice: SpeechSynthesisVoice): number {
  let score = 0;
  if (NEURAL_HINT_RE.test(voice.name)) score += 30;
  if (PREFERRED_VOICE_NAMES_RE.some((re) => re.test(voice.name))) score += 10;
  if (voice.localService) score += 5;
  if (voice.default) score += 2;
  return score;
}

/**
 * 페르소나에 가장 적합한 한국어 native voice 매칭.
 *
 * 동작:
 * 1. natural Korean 만 필터링
 * 2. naturalnessScore 내림차순 정렬 — 가장 자연스러운 voice 가 상위
 * 3. 페르소나 ID 별로 다른 voice 선택 (rotation) — 8개 페르소나 vs 적은 voice 환경에서도
 *    rate/pitch 조합으로 톤 차별 유지
 *
 * native voice 가 0개면 undefined → SpeechSynthesisUtterance 가 system default 사용.
 */
export function matchPersonaVoice(
  persona: VoicePersona,
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const natural = voices.filter(isNaturalKoreanVoice);
  if (natural.length === 0) return undefined;
  // 자연도 내림차순 정렬
  const sorted = [...natural].sort((a, b) => naturalnessScore(b) - naturalnessScore(a));
  const idx = VOICE_PERSONAS.findIndex((p) => p.id === persona.id);
  // 상위 N voice 만 선택 풀로 사용 — 자연도 낮은 voice 는 회피
  const topPool = sorted.slice(0, Math.max(2, Math.ceil(sorted.length / 2)));
  return topPool[idx % topPool.length];
}

/**
 * 자연스러운 한국어 voice 만 필터링 — naturalness 내림차순으로 정렬.
 * UI 에서 사용자가 직접 voice 를 고를 때 가장 좋은 옵션이 위에 노출.
 */
export function filterNaturalKoreanVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices
    .filter(isNaturalKoreanVoice)
    .sort((a, b) => naturalnessScore(b) - naturalnessScore(a));
}
