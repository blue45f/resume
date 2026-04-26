import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** 면접관 음성 페르소나 — 브라우저 TTS 보이스를 성별·연령대로 휴리스틱 그룹핑 */
export type InterviewerPersona = {
  id: string;
  label: string;
  icon: string;
  voiceURI?: string;
  rate: number;
  pitch: number;
  lang: string;
};

const PERSONA_PRESETS: Omit<InterviewerPersona, 'voiceURI'>[] = [
  {
    id: 'male-senior',
    label: '시니어 남성 면접관',
    icon: '👔',
    rate: 0.92,
    pitch: 0.88,
    lang: 'ko-KR',
  },
  { id: 'male-mid', label: '중년 남성 면접관', icon: '🧑‍💼', rate: 0.98, pitch: 0.95, lang: 'ko-KR' },
  {
    id: 'male-young',
    label: '젊은 남성 면접관',
    icon: '🙋‍♂️',
    rate: 1.05,
    pitch: 1.05,
    lang: 'ko-KR',
  },
  {
    id: 'female-senior',
    label: '시니어 여성 면접관',
    icon: '👩‍💼',
    rate: 0.95,
    pitch: 0.95,
    lang: 'ko-KR',
  },
  {
    id: 'female-mid',
    label: '중년 여성 면접관',
    icon: '🧑‍🏫',
    rate: 1.0,
    pitch: 1.05,
    lang: 'ko-KR',
  },
  {
    id: 'female-young',
    label: '젊은 여성 면접관',
    icon: '👩',
    rate: 1.08,
    pitch: 1.15,
    lang: 'ko-KR',
  },
];

/** 이름으로 여성/남성 추정 — iOS/macOS/Chrome 한국어 보이스 이름 기준 */
function guessGender(voice: SpeechSynthesisVoice): 'female' | 'male' | 'unknown' {
  const n = voice.name.toLowerCase();
  const femaleHints = [
    'female',
    'yuna',
    'sora',
    'minji',
    'heami',
    '유나',
    '소라',
    '민지',
    '해미',
    '여자',
  ];
  const maleHints = ['male', 'minsu', 'junho', 'jaehyun', '민수', '준호', '재현', '남자'];
  if (femaleHints.some((h) => n.includes(h))) return 'female';
  if (maleHints.some((h) => n.includes(h))) return 'male';
  return 'unknown';
}

/** 페르소나에 가장 적합한 보이스를 매칭 */
function matchVoice(
  persona: Omit<InterviewerPersona, 'voiceURI'>,
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const korean = voices.filter((v) => v.lang.toLowerCase().startsWith('ko'));
  if (korean.length === 0) return voices[0];
  const wantFemale = persona.id.startsWith('female');
  const pool = korean.filter((v) => {
    const g = guessGender(v);
    return wantFemale ? g === 'female' || g === 'unknown' : g === 'male' || g === 'unknown';
  });
  const source = pool.length > 0 ? pool : korean;
  const idx =
    source.length > 1
      ? persona.id.includes('young')
        ? 0
        : persona.id.includes('senior')
          ? source.length - 1
          : Math.floor(source.length / 2)
      : 0;
  return source[idx];
}

/**
 * CameraInterview
 * 브라우저 MediaRecorder API 기반 카메라 모의 면접 컴포넌트.
 * - 사용자 영상/음성을 녹화하여 미리보기 → 다시 재생 → 다운로드/재녹화
 * - 녹화 완료 시 부모에게 Blob + duration(초) 전달
 * - 언마운트 시 stream track 정리, Blob URL 해제
 */

export interface CameraInterviewProps {
  question: string;
  /** 선택: 녹화 최대 시간(초). 도달 시 자동 정지. */
  maxDurationSec?: number;
  onRecordingComplete?: (blob: Blob, duration: number) => void;
}

type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied';
type RecordingPhase = 'preview' | 'recording' | 'stopped';

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(totalSec % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

/** 브라우저가 지원하는 최선의 video MIME 선택 */
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  return candidates.find((c) => {
    try {
      return MediaRecorder.isTypeSupported(c);
    } catch {
      return false;
    }
  });
}

export default function CameraInterview({
  question,
  maxDurationSec,
  onRecordingComplete,
}: CameraInterviewProps) {
  const videoLiveRef = useRef<HTMLVideoElement | null>(null);
  const videoPlaybackRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const blobUrlRef = useRef<string | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<PermissionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<RecordingPhase>('preview');
  const [elapsed, setElapsed] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [announce, setAnnounce] = useState<string>('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [personaId, setPersonaId] = useState<string>('male-mid');
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [speaking, setSpeaking] = useState(false);
  const ttsSupported =
    typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';

  const mimeType = useMemo(() => pickMimeType(), []);

  // 브라우저 보이스 로드
  useEffect(() => {
    if (!ttsSupported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, [ttsSupported]);

  const activePersona = useMemo<InterviewerPersona>(() => {
    const preset = PERSONA_PRESETS.find((p) => p.id === personaId) ?? PERSONA_PRESETS[1];
    const matched = matchVoice(preset, voices);
    return { ...preset, voiceURI: matched?.voiceURI, lang: matched?.lang ?? preset.lang };
  }, [personaId, voices]);

  const speakQuestion = useCallback(() => {
    if (!ttsSupported || !question.trim()) return;
    const u = new SpeechSynthesisUtterance(question);
    const v = voices.find((x) => x.voiceURI === activePersona.voiceURI);
    if (v) u.voice = v;
    u.lang = activePersona.lang;
    u.rate = activePersona.rate * ttsRate;
    u.pitch = activePersona.pitch;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
    setAnnounce(`${activePersona.label} 음성으로 질문을 읽습니다.`);
  }, [activePersona, question, ttsRate, ttsSupported, voices]);

  const stopSpeaking = useCallback(() => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [ttsSupported]);

  /* ── Stream 관리 ───────────────────────────────────────────── */

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
  }, [stream]);

  const requestPermission = useCallback(async () => {
    setPermission('requesting');
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('이 브라우저는 카메라 녹화를 지원하지 않습니다.');
      }
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      setPermission('granted');
      setAnnounce('카메라와 마이크 권한이 허용되었습니다. 녹화를 시작할 수 있습니다.');
    } catch (e: unknown) {
      const err = e as DOMException & { message?: string };
      let msg = '카메라/마이크 권한이 거부되었습니다.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        msg = '카메라/마이크 권한이 거부되었습니다. 브라우저 주소창의 권한 설정을 확인해주세요.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        msg = '사용 가능한 카메라 또는 마이크를 찾을 수 없습니다.';
      } else if (err?.name === 'NotReadableError') {
        msg = '다른 앱이 카메라를 사용 중입니다. 종료 후 다시 시도해주세요.';
      } else if (err?.message) {
        msg = err.message;
      }
      setPermission('denied');
      setError(msg);
      setAnnounce(msg);
    }
  }, []);

  /* ── Stream을 <video>에 연결 ───────────────────────────────── */
  useEffect(() => {
    const v = videoLiveRef.current;
    if (v && stream) {
      v.srcObject = stream;
      void v.play().catch(() => {});
    }
    return () => {
      if (v) v.srcObject = null;
    };
  }, [stream]);

  /* ── 녹화 시작/정지 ────────────────────────────────────────── */

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.stop();
    }
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!stream) return;
    setError(null);
    if (typeof MediaRecorder === 'undefined') {
      setError('이 브라우저는 녹화를 지원하지 않습니다.');
      return;
    }
    try {
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mr.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        const duration = Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));
        setRecordedBlob(blob);
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setPlaybackUrl(url);
        setPhase('stopped');
        setAnnounce(`녹화가 종료되었습니다. 총 ${formatTime(duration)} 녹화되었습니다.`);
        onRecordingComplete?.(blob, duration);
      };
      mr.onerror = () => {
        setError('녹화 중 오류가 발생했습니다.');
      };
      mediaRecorderRef.current = mr;
      mr.start(1000);
      startedAtRef.current = Date.now();
      setElapsed(0);
      setPhase('recording');
      setAnnounce('녹화가 시작되었습니다.');

      timerRef.current = window.setInterval(() => {
        const sec = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsed(sec);
        if (maxDurationSec && sec >= maxDurationSec) {
          stopRecording();
        }
      }, 250);
    } catch (e) {
      setError('녹화를 시작하지 못했습니다.');
    }
  }, [stream, mimeType, onRecordingComplete, maxDurationSec, stopRecording]);

  /* ── 재녹화 ───────────────────────────────────────────────── */

  const resetRecording = useCallback(() => {
    setRecordedBlob(null);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPlaybackUrl(null);
    setElapsed(0);
    setPhase('preview');
    setAnnounce('다시 녹화할 수 있습니다.');
  }, []);

  /* ── 다운로드 ─────────────────────────────────────────────── */

  const downloadRecording = useCallback(() => {
    if (!recordedBlob) return;
    const ext = (mimeType || 'video/webm').includes('mp4') ? 'mp4' : 'webm';
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mock-interview-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [recordedBlob, mimeType]);

  /* ── 키보드 단축키 (Space: 시작/정지) ──────────────────────── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target?.isContentEditable) return;
      if (permission !== 'granted') return;
      e.preventDefault();
      if (phase === 'preview') startRecording();
      else if (phase === 'recording') stopRecording();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, permission, startRecording, stopRecording]);

  /* ── 언마운트 정리 ────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== 'inactive') {
        try {
          mr.stop();
        } catch {
          /* noop */
        }
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // stream 변경 시(컴포넌트 언마운트 포함) 이전 stream의 track 종료
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  /* ── UI ───────────────────────────────────────────────────── */

  const recording = phase === 'recording';
  const stopped = phase === 'stopped';

  return (
    <section className="imp-card p-5 sm:p-6" aria-label="카메라 모의 면접">
      {/* Screen reader announcements */}
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      {/* Question */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">면접 질문</p>
          {ttsSupported && (
            <button
              type="button"
              onClick={speaking ? stopSpeaking : speakQuestion}
              disabled={!question.trim()}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 transition-colors"
              aria-label={speaking ? '질문 읽기 중지' : '질문을 음성으로 듣기'}
            >
              <span aria-hidden>{speaking ? '⏹️' : '🔊'}</span>
              <span>{speaking ? '중지' : '듣기'}</span>
            </button>
          )}
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
          {question}
        </h3>
        {ttsSupported && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-400 mr-1">면접관:</span>
            {PERSONA_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPersonaId(p.id);
                  if (speaking) window.speechSynthesis.cancel();
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-full border transition-colors ${
                  personaId === p.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-300'
                }`}
                aria-pressed={personaId === p.id}
                title={p.label}
              >
                <span aria-hidden>{p.icon}</span>
                <span className="hidden sm:inline">{p.label.replace(' 면접관', '')}</span>
              </button>
            ))}
            <label className="ml-auto flex items-center gap-1 text-[11px] text-slate-500">
              속도
              <input
                type="range"
                min="0.6"
                max="1.4"
                step="0.1"
                value={ttsRate}
                onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                className="w-20"
                aria-label="TTS 속도"
              />
              <span className="font-mono tabular-nums w-8 text-slate-400">
                {ttsRate.toFixed(1)}x
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Permission denied or idle */}
      {permission !== 'granted' && (
        <div className="space-y-3">
          {permission === 'denied' && error && (
            <div className="rounded-lg border border-blue-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-3 text-sm text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}
          <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <svg
              className="w-10 h-10 text-slate-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-sm">
              카메라와 마이크 권한이 필요합니다. 아래 버튼을 눌러 권한을 허용해주세요.
            </p>
            <button
              type="button"
              onClick={requestPermission}
              disabled={permission === 'requesting'}
              className="imp-btn px-4 py-2 text-sm bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-60"
            >
              {permission === 'requesting' ? '요청 중...' : '카메라/마이크 허용'}
            </button>
          </div>
        </div>
      )}

      {/* Granted: preview / record / playback */}
      {permission === 'granted' && (
        <div className="space-y-4">
          {/* Video surface */}
          <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-video">
            {!stopped && (
              <video
                ref={videoLiveRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                aria-label="카메라 미리보기"
              />
            )}
            {stopped && playbackUrl && (
              <video
                ref={videoPlaybackRef}
                src={playbackUrl}
                controls
                playsInline
                className="w-full h-full object-contain bg-black"
                aria-label="녹화된 영상 재생"
              />
            )}

            {/* REC indicator */}
            {recording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60">
                <span
                  className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-white">REC</span>
              </div>
            )}

            {/* Timer */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/60 text-white text-xs font-mono tabular-nums">
              {formatTime(elapsed)}
              {maxDurationSec ? ` / ${formatTime(maxDurationSec)}` : ''}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-blue-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-3 text-sm text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {phase === 'preview' && (
              <button
                type="button"
                onClick={startRecording}
                className="imp-btn px-4 py-2 text-sm bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white"
                aria-label="녹화 시작 (스페이스 키)"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
                  녹화 시작
                </span>
              </button>
            )}

            {phase === 'recording' && (
              <button
                type="button"
                onClick={stopRecording}
                className="imp-btn px-4 py-2 text-sm bg-blue-700 hover:bg-rose-700 text-white"
                aria-label="녹화 정지 (스페이스 키)"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-white rounded-sm" aria-hidden="true" />
                  정지
                </span>
              </button>
            )}

            {phase === 'stopped' && (
              <>
                <button
                  type="button"
                  onClick={resetRecording}
                  className="imp-btn px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  다시 녹화
                </button>
                <button
                  type="button"
                  onClick={downloadRecording}
                  className="imp-btn px-4 py-2 text-sm bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white"
                >
                  다운로드
                </button>
              </>
            )}

            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
              단축키: Space로 시작/정지
            </span>
          </div>

          {/* End session button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={stopStream}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              카메라 세션 종료
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
