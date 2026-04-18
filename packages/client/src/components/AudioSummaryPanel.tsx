import { useEffect, useMemo, useState } from 'react';
import type { Resume } from '@/types/resume';
import { generatePitch } from '@/lib/pitchGenerator';

interface Props {
  resume: Resume;
}

/**
 * AudioSummaryPanel — 브라우저 SpeechSynthesis API 로 이력서 요약 오디오 낭독.
 *
 * 사용처:
 * - 접근성: 시각 장애·저시력 사용자 요약 제공
 * - 면접 연습: 자기 이력서 요약을 귀로 들으며 개선점 파악
 * - 멀티태스킹: 걸어가며 / 식사하며 자기 이력서 검토
 *
 * 외부 API 불필요. OS 네이티브 한국어 음성 사용.
 */
export default function AudioSummaryPanel({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>('');
  const [rate, setRate] = useState(1.0);

  // 상세 요약 스크립트 — PitchPanel 보다 길고 구조적
  const script = useMemo(() => buildAudioScript(resume), [resume]);

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!supported) return;

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      const korean = list.filter((v) => v.lang.toLowerCase().startsWith('ko'));
      setVoices(korean.length > 0 ? korean : list);
      if (!voiceURI && korean.length > 0) {
        setVoiceURI(korean[0].voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [supported, voiceURI]);

  const play = () => {
    if (!supported) return;
    const utter = new SpeechSynthesisUtterance(script);
    const voice = voices.find((v) => v.voiceURI === voiceURI);
    if (voice) utter.voice = voice;
    utter.lang = voice?.lang || 'ko-KR';
    utter.rate = rate;
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    setPlaying(true);
  };

  const stop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setPlaying(false);
  };

  if (!supported) return null;

  return (
    <div className="imp-card bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-[var(--radius-sm)]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true" className="text-base">
            🔊
          </span>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 shrink-0">
            이력서 오디오 요약
          </h3>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            브라우저 TTS · 접근성 · 면접 연습
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 animate-in fade-in-0 duration-200">
          {/* 컨트롤 */}
          <div className="flex flex-wrap items-center gap-2">
            {playing ? (
              <button
                onClick={stop}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <span aria-hidden="true">⏹️</span> 중지
              </button>
            ) : (
              <button
                onClick={play}
                disabled={!script.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <span aria-hidden="true">▶️</span> 재생
              </button>
            )}

            {voices.length > 1 && (
              <select
                value={voiceURI}
                onChange={(e) => setVoiceURI(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            )}

            <label className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              속도
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-24"
              />
              <span className="font-mono tabular-nums w-8">{rate.toFixed(1)}x</span>
            </label>
          </div>

          {/* 읽어주는 스크립트 미리보기 */}
          <details className="text-xs">
            <summary className="cursor-pointer text-slate-600 dark:text-slate-400 font-medium">
              낭독 스크립트 보기 ({script.length}자)
            </summary>
            <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
              {script}
            </p>
          </details>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
            💡 브라우저 내장 음성 합성(SpeechSynthesis API) 사용 — 외부 서버 전송 없음. 접근성
            목적으로 화면을 못 보는 사용자에게 이력서 요약을 오디오로 제공할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

/** 낭독용 스크립트 생성 — 구조적·자연스러운 한국어 */
function buildAudioScript(resume: Resume): string {
  const p = resume.personalInfo;
  const sentences: string[] = [];

  // 1. 1줄 pitch (공식 톤 재활용)
  const pitch = generatePitch(resume, { tone: 'professional', maxSentences: 2 });
  if (pitch) sentences.push(pitch);

  // 2. 주요 경력 (최근 2건)
  if (resume.experiences.length > 0) {
    const recent = resume.experiences.slice(0, 2);
    const exps = recent
      .map((e) => {
        const range = e.current
          ? `${e.startDate}부터 현재까지`
          : `${e.startDate}부터 ${e.endDate}까지`;
        const name = `${e.company || ''} ${e.position || ''}`.trim();
        return `${range} ${name}`;
      })
      .filter(Boolean)
      .join(', ');
    if (exps) sentences.push(`주요 경력은 ${exps}입니다.`);
  }

  // 3. 대표 기술 스택
  const topSkills = resume.skills
    .flatMap((s) => s.items.split(',').map((x) => x.trim()))
    .filter(Boolean)
    .slice(0, 5);
  if (topSkills.length > 0) {
    sentences.push(`주로 다루는 기술은 ${topSkills.join(', ')} 입니다.`);
  }

  // 4. 프로젝트 수
  if (resume.projects.length > 0) {
    sentences.push(
      `${resume.projects.length}개의 주요 프로젝트를 진행했으며, 대표 프로젝트는 ${resume.projects[0].name}입니다.`,
    );
  }

  // 5. 학력
  const edu = resume.educations[0];
  if (edu?.school) {
    const major = edu.field ? ` ${edu.field}` : '';
    sentences.push(`학력은 ${edu.school}${major}${edu.degree ? ` ${edu.degree}` : ''} 입니다.`);
  }

  // 6. 연락처
  if (p.email) sentences.push(`연락처는 ${spellEmail(p.email)} 입니다.`);

  return sentences.join(' ');
}

/** 이메일을 TTS 가 잘 읽도록 철자 풀어서 */
function spellEmail(email: string): string {
  return email.replace('@', ' 골뱅이 ').replace(/\./g, ' 점 ');
}
