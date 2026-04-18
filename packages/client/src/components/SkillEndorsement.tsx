import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/config';
import { getUser } from '@/lib/auth';

interface EndorsementData {
  [skill: string]: {
    count: number;
    endorsed: boolean;
  };
}

interface Props {
  resumeId: string;
  skills: { id: string; category: string; items: string }[];
}

export default function SkillEndorsement({ resumeId, skills }: Props) {
  const [endorsements, setEndorsements] = useState<EndorsementData>({});
  const [loading, setLoading] = useState<string | null>(null);
  const user = getUser();

  const allSkillNames = skills.flatMap((s) =>
    s.items
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${API_URL}/api/resumes/${resumeId}/endorsements`, { headers })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: EndorsementData) => setEndorsements(data))
      .catch(() => {});
  }, [resumeId]);

  const toggleEndorse = useCallback(
    async (skill: string) => {
      if (!user) return;
      setLoading(skill);
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${API_URL}/api/resumes/${resumeId}/endorse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ skill }),
        });
        if (res.ok) {
          const result = await res.json();
          setEndorsements((prev) => ({
            ...prev,
            [skill]: {
              count:
                result.count ??
                (prev[skill]?.endorsed
                  ? (prev[skill]?.count || 1) - 1
                  : (prev[skill]?.count || 0) + 1),
              endorsed: result.endorsed ?? !prev[skill]?.endorsed,
            },
          }));
        }
      } catch {
        // silent fail
      } finally {
        setLoading(null);
      }
    },
    [resumeId, user],
  );

  if (allSkillNames.length === 0) return null;

  return (
    <div className="mt-4 no-print">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-4 h-4 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">스킬 추천</h4>
        {!user && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            로그인하면 추천할 수 있습니다
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {allSkillNames.map((skill) => {
          const data = endorsements[skill];
          const count = data?.count || 0;
          const endorsed = data?.endorsed || false;
          const isLoading = loading === skill;

          return (
            <button
              key={skill}
              onClick={() => toggleEndorse(skill)}
              disabled={!user || isLoading}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200
                ${
                  endorsed
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:text-blue-600'
                }
                ${!user ? 'opacity-60 cursor-default' : 'cursor-pointer hover:shadow-sm'}
                ${isLoading ? 'opacity-50' : ''}
              `}
              title={endorsed ? `${skill} 추천 취소` : `${skill} 추천하기`}
            >
              <svg
                className={`w-3.5 h-3.5 transition-colors ${endorsed ? 'text-blue-500' : 'text-slate-400'}`}
                fill={endorsed ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              <span>{skill}</span>
              {count > 0 && (
                <span
                  className={`
                  px-1.5 py-0.5 text-[10px] font-bold rounded-full
                  ${
                    endorsed
                      ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-300'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }
                `}
                >
                  {count}명 추천
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
