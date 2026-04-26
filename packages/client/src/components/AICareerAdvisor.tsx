import { useState, useRef, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/config';
import type { Resume } from '@/types/resume';

interface Props {
  resume: Resume;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const QUICK_QUESTIONS = [
  {
    label: '연봉 올리려면?',
    question: '현재 이력서를 기반으로 연봉을 올리기 위해 무엇을 해야 할까요?',
  },
  {
    label: '이직 시기?',
    question: '지금 이직하기 좋은 시기인가요? 시장 상황을 고려해서 알려주세요.',
  },
  {
    label: '부족한 스킬?',
    question: '현재 이력서에서 부족한 기술 스택은 무엇이고, 어떤 것을 배워야 할까요?',
  },
  {
    label: '커리어 방향',
    question: '현재 경력을 기반으로 가장 유망한 커리어 방향을 추천해주세요.',
  },
];

function summarizeResume(resume: Resume): string {
  const skills = resume.skills.map((s) => `${s.category}: ${s.items}`).join('; ');
  const expYears = resume.experiences.length;
  const lastExp = resume.experiences[0];
  const education = resume.educations.map((e) => `${e.school} ${e.degree} ${e.field}`).join(', ');
  const certs = resume.certifications.map((c) => c.name).join(', ');

  return [
    `경력: ${expYears}년차`,
    lastExp ? `최근 직장: ${lastExp.company} / ${lastExp.position}` : null,
    skills ? `기술: ${skills}` : null,
    education ? `학력: ${education}` : null,
    certs ? `자격증: ${certs}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function generateLocalResponse(question: string, resume: Resume): string {
  const skills = resume.skills.flatMap((s) =>
    s.items.split(',').map((i) => i.trim().toLowerCase()),
  );
  const expYears = resume.experiences.length;
  const certCount = resume.certifications.length;
  const q = question.toLowerCase();

  if (q.includes('연봉') || q.includes('salary') || q.includes('돈')) {
    const tips: string[] = [];
    tips.push(`현재 ${expYears}년차 프로필을 기준으로 분석합니다.`);
    if (skills.length < 5) {
      tips.push(
        '기술 스택이 다소 부족합니다. 클라우드(AWS, GCP), 컨테이너(Docker, K8s) 등 시장 수요가 높은 기술을 추가하면 연봉 협상에 큰 도움이 됩니다.',
      );
    } else {
      tips.push(
        `${skills.length}개의 기술을 보유하고 있어 양호합니다. 이 중 시장 프리미엄이 높은 기술(AI/ML, 클라우드)에 집중하면 연봉 상승에 유리합니다.`,
      );
    }
    if (certCount === 0) {
      tips.push(
        '자격증이 없습니다. AWS SAA, CKA 등 업계 인정 자격증은 연봉 협상에서 5-10% 프리미엄을 기대할 수 있습니다.',
      );
    }
    tips.push(
      '이직 시에는 현재 연봉의 15-20% 인상을 목표로 하되, 시장 데이터를 기반으로 논리적 근거를 제시하세요.',
    );
    return tips.join('\n\n');
  }

  if (q.includes('이직') || q.includes('시기') || q.includes('이동')) {
    const tips: string[] = [];
    tips.push(
      '일반적으로 IT 업계에서는 상반기(3-4월)와 하반기(9-10월)가 가장 채용이 활발한 시기입니다.',
    );
    if (expYears >= 3) {
      tips.push(
        `${expYears}년차 경력이면 시니어 포지션으로의 이직을 고려할 수 있습니다. 현재 포지션에서의 성과를 정량화하여 이력서에 추가하세요.`,
      );
    } else {
      tips.push(
        '아직 경력이 짧은 편이므로, 현재 회사에서 핵심 프로젝트 경험을 쌓은 후 이직하는 것이 유리합니다. 최소 2년 이상의 경력을 권장합니다.',
      );
    }
    tips.push(
      '이직 전 LinkedIn 프로필과 이력서를 업데이트하고, 포트폴리오를 정리하세요. 기술 면접 준비도 최소 1-2개월 전부터 시작하는 것이 좋습니다.',
    );
    return tips.join('\n\n');
  }

  if (q.includes('스킬') || q.includes('기술') || q.includes('배우')) {
    const tips: string[] = [];
    const highDemand = [
      'typescript',
      'kubernetes',
      'aws',
      'docker',
      'python',
      'terraform',
      'react',
      'go',
    ];
    const missing = highDemand.filter((s) => !skills.includes(s));

    if (missing.length > 0) {
      tips.push(`현재 보유하지 않은 수요 높은 기술: ${missing.slice(0, 4).join(', ')}`);
      tips.push(
        `특히 ${missing[0]}은(는) 현재 시장에서 가장 수요가 높은 기술 중 하나입니다. 우선적으로 학습을 추천합니다.`,
      );
    } else {
      tips.push(
        '주요 수요 기술을 대부분 보유하고 있습니다! 심화 학습이나 관련 자격증 취득을 고려해보세요.',
      );
    }
    tips.push(
      '2026년 기준으로 AI/ML 관련 기술(LLM, RAG, MLOps)과 클라우드 네이티브 기술이 가장 빠르게 성장하는 분야입니다.',
    );
    return tips.join('\n\n');
  }

  if (q.includes('커리어') || q.includes('방향') || q.includes('진로') || q.includes('추천')) {
    const tips: string[] = [];
    if (skills.some((s) => ['react', 'typescript', 'javascript', 'vue'].includes(s))) {
      tips.push(
        '프론트엔드 기술을 보유하고 있으므로, 시니어 프론트엔드 -> 프론트엔드 리드 -> Engineering Manager 경로를 추천합니다.',
      );
      tips.push(
        '풀스택으로의 전환도 좋은 선택입니다. Node.js/NestJS 백엔드와 인프라 경험을 쌓으면 기회가 넓어집니다.',
      );
    } else if (skills.some((s) => ['python', 'java', 'node.js', 'spring'].includes(s))) {
      tips.push('백엔드 기술을 기반으로 시니어 백엔드 -> 테크 리드 -> 아키텍트 경로가 적합합니다.');
      tips.push(
        '데이터 엔지니어링이나 DevOps/SRE 방향으로의 확장도 고려해보세요. 시장 수요와 연봉이 모두 높은 분야입니다.',
      );
    } else {
      tips.push(
        `${expYears}년차 경력을 기반으로, 본인의 강점 분야에 집중하면서 시니어 레벨로의 성장을 목표로 하세요.`,
      );
    }
    tips.push(
      '어떤 경로를 선택하든 리더십 경험(팀 리딩, 멘토링, 코드 리뷰)이 다음 단계로의 핵심 역량이 됩니다.',
    );
    return tips.join('\n\n');
  }

  // Generic response
  return `${expYears}년차 프로필을 분석한 결과, ${skills.length}개의 기술 스택${certCount > 0 ? `과 ${certCount}개의 자격증` : ''}을 보유하고 있습니다.\n\n구체적인 질문을 해주시면 더 정확한 조언을 드릴 수 있습니다. 예를 들어 연봉 협상, 이직 시기, 학습 추천, 커리어 방향 등을 물어보세요.`;
}

export default function AICareerAdvisor({ resume }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        role: 'user',
        content: question.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        // Try server-side AI first
        const resumeSummary = summarizeResume(resume);
        const res = await fetch(`${API_URL}/api/resumes/${resume.id}/transform/inline-assist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            text: `[이력서 요약]\n${resumeSummary}\n\n[질문]\n${question}`,
            type: 'career-advice',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: data.improved || data.text || generateLocalResponse(question, resume),
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          // Fallback to local response
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: generateLocalResponse(question, resume),
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch {
        // Fallback to local response on network error
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: generateLocalResponse(question, resume),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [resume, isLoading],
  );

  return (
    <>
      {/* Chat bubble trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="no-print fixed bottom-6 right-6 z-50 w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-600 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center group"
        title="AI 커리어 상담"
      >
        {isOpen ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
        {/* Notification dot */}
        {messages.length === 0 && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="no-print fixed bottom-20 right-6 z-50 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-fade-in"
          style={{ maxHeight: 'min(70vh, 500px)' }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-sky-600 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold">AI 커리어 어드바이저</p>
                <p className="text-[10px] text-white/70">이력서 기반 맞춤 상담</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center py-4">
                <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="w-5 h-5 text-sky-700 dark:text-sky-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  커리어에 관한 질문을 해보세요.
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  이력서 데이터를 기반으로 맞춤 답변을 드립니다.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-sky-500 text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-bl-sm'
                  }`}
                >
                  {msg.content.split('\n\n').map((paragraph, pi) => (
                    <p key={pi} className={pi > 0 ? 'mt-2' : ''}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg rounded-bl-sm">
                  <div className="flex gap-1">
                    <div
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          {messages.length === 0 && (
            <div className="px-3 pb-2 shrink-0">
              <div className="flex flex-wrap gap-1">
                {QUICK_QUESTIONS.map((qq) => (
                  <button
                    key={qq.label}
                    onClick={() => sendMessage(qq.question)}
                    className="px-2 py-1 text-[10px] font-medium bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 rounded-full border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                  >
                    {qq.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="커리어 관련 질문을 입력하세요..."
                disabled={isLoading}
                className="flex-1 text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-700 dark:text-slate-300 placeholder-slate-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-2.5 py-1.5 bg-sky-500 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
