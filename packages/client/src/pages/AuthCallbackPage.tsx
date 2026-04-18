import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleAuthCallback } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { API_URL } from '@/lib/config';

type UserType = 'personal' | 'recruiter' | 'company';

const USER_TYPES: {
  value: UserType;
  label: string;
  desc: string;
  icon: string;
  features: string[];
}[] = [
  {
    value: 'personal',
    label: '구직자',
    desc: '이력서 작성 & 취업 준비',
    icon: '👤',
    features: [
      '이력서 작성 및 AI 분석',
      'ATS 점수 확인 & JD 매칭',
      '채용정보 열람 및 지원',
      '커뮤니티 & 면접 준비',
    ],
  },
  {
    value: 'recruiter',
    label: '채용 담당자',
    desc: '인재 탐색 & 스카우트',
    icon: '🔍',
    features: [
      '인재 탐색 및 이력서 검색',
      '스카우트 메시지 발송',
      '채용공고 등록/관리',
      '지원자 파이프라인',
    ],
  },
  {
    value: 'company',
    label: '기업 회원',
    desc: '채용 관리 & 브랜딩',
    icon: '🏢',
    features: [
      '채용 대시보드 & 분석',
      '팀 단위 스카우트 관리',
      '기업 브랜딩 페이지',
      '채용공고 대량 등록',
    ],
  },
];

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [selectedType, setSelectedType] = useState<UserType>('personal');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('인증 토큰이 없습니다');
      return;
    }

    handleAuthCallback(token)
      .then((user) => {
        const created = new Date(user.createdAt || 0);
        const isNew = Date.now() - created.getTime() < 60_000;
        if (isNew && user.userType === 'personal') {
          setShowTypeSelect(true);
        } else {
          navigate(ROUTES.home);
        }
      })
      .catch(() => {
        setError('인증에 실패했습니다');
        setTimeout(() => navigate(ROUTES.login), 2000);
      });
  }, [params, navigate]);

  const handleSelectType = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (token && selectedType !== 'personal') {
        await fetch(`${API_URL}/api/auth/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userType: selectedType }),
        });
        const me = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (me.ok) {
          const user = await me.json();
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
    } catch {}
    navigate(ROUTES.home);
  };

  if (showTypeSelect) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-8">
        <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 animate-fade-in-up">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-neutral-900 dark:bg-white rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg">
              🎉
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">환영합니다!</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              어떤 목적으로 이력서공방을 사용하시나요?
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {USER_TYPES.map((tp) => (
              <button
                key={tp.value}
                onClick={() => setSelectedType(tp.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedType === tp.value
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{tp.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {tp.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{tp.desc}</p>
                  </div>
                  {selectedType === tp.value && (
                    <svg
                      className="w-5 h-5 text-indigo-600 dark:text-indigo-400 ml-auto shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                {selectedType === tp.value && (
                  <ul className="ml-10 space-y-1 animate-fade-in">
                    {tp.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"
                      >
                        <svg
                          className="w-3 h-3 text-emerald-500 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleSelectType}
            disabled={saving}
            className="w-full py-3 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {saving ? '설정 중...' : '시작하기'}
          </button>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
            나중에 설정에서 언제든 변경할 수 있습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      {error ? (
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <p className="text-xs text-slate-400">로그인 페이지로 이동합니다...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-800 rounded-full" />
            <div className="absolute inset-0 w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">로그인 처리 중...</p>
        </div>
      )}
    </div>
  );
}
