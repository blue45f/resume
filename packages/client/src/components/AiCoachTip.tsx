import { useState } from 'react';
import FeatureGate from '@/components/FeatureGate';
import { toast } from '@/components/Toast';
import { API_URL } from '@/lib/config';

interface Props {
  resumeId: string;
  section: string;
  currentText: string;
  onApply?: (improved: string) => void;
}

export default function AiCoachTip({ resumeId, section, currentText, onApply }: Props) {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const getSuggestion = async () => {
    if (!currentText || currentText.replace(/<[^>]*>/g, '').trim().length < 10) {
      toast('텍스트가 너무 짧습니다 (10자 이상)', 'warning');
      return;
    }
    setLoading(true);
    setExpanded(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/transform`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          templateType: 'custom',
          jobDescription: `다음 ${section} 내용을 더 전문적이고 임팩트 있게 개선해주세요. 성과를 수치로 표현하고, 동사로 시작하는 문장을 사용하세요. 원본보다 20% 정도 더 상세하게 작성하되, 과장하지 마세요.\n\n원본:\n${currentText.replace(/<[^>]*>/g, '')}`,
        }),
      });
      if (!res.ok) throw new Error('AI 코칭 실패');
      const data = await res.json();
      setSuggestion(data.text || '');
    } catch {
      toast('AI 코칭을 불러올 수 없습니다. LLM 프로바이더를 확인해주세요.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureGate feature="aiCoaching" fallback={null}>
      <div className="mt-1">
        <button
          onClick={expanded ? () => setExpanded(false) : getSuggestion}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors disabled:opacity-50"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          {loading ? 'AI 분석 중...' : expanded ? '닫기' : 'AI 개선 제안'}
        </button>

        {expanded && suggestion && (
          <div className="mt-2 p-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg animate-fade-in">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-sky-700 dark:text-sky-400">AI 개선안</span>
              {onApply && (
                <button
                  onClick={() => {
                    onApply(suggestion);
                    toast('개선안이 적용되었습니다', 'success');
                  }}
                  className="text-xs px-2 py-0.5 bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors"
                >
                  적용
                </button>
              )}
            </div>
            <p className="text-xs text-purple-800 dark:text-sky-300 whitespace-pre-wrap leading-relaxed">
              {suggestion}
            </p>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
