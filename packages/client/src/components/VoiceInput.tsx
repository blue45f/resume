import { useState, useRef, useCallback } from 'react';

interface Props {
  onResult: (text: string) => void;
  lang?: string;
  className?: string;
}

export default function VoiceInput({ onResult, lang = 'ko-KR', className = '' }: Props) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const toggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        onResult(last[0].transcript);
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }, [listening, onResult, lang]);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        listening
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
      } ${className}`}
      title={listening ? '음성 입력 중지' : '음성으로 입력'}
      aria-label={listening ? '음성 입력 중지' : '음성으로 입력'}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-14 0m14 0a7 7 0 00-14 0m14 0v1a7 7 0 01-14 0v-1m7 8v4m-4 0h8"
        />
      </svg>
      {listening ? '녹음 중...' : '음성'}
    </button>
  );
}
