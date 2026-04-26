import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSocialLoginUrl } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from '@/shared/lib/schemas/auth';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true" role="img">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" role="img">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" role="img">
      <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.839 1.89 5.33 4.729 6.727-.162.592-.586 2.146-.672 2.48-.107.416.152.41.32.298.132-.088 2.1-1.43 2.945-2.012.87.132 1.77.2 2.678.2 5.523 0 10-3.582 10-8S17.523 3 12 3z" />
    </svg>
  );
}

const PROVIDERS = [
  {
    id: 'google',
    name: 'Google',
    icon: GoogleIcon,
    className:
      'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 hover:shadow-sm',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: GitHubIcon,
    className:
      'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-sm',
  },
  {
    id: 'kakao',
    name: 'Kakao',
    icon: KakaoIcon,
    className: 'bg-[#FEE500] text-[#191919] hover:bg-[#FDD835] hover:shadow-sm',
  },
];

export default function LoginPage() {
  const [params] = useSearchParams();
  const error = params.get('error');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    document.title = '로그인 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();

  const isRegister = activeTab === 'register';

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      userType: 'personal',
      companyName: '',
    },
  });

  const password = isRegister
    ? (registerForm.watch('password') ?? '')
    : (loginForm.watch('password') ?? '');
  const userType = registerForm.watch('userType');

  const getPasswordStrength = (v: string): { level: number; label: string; color: string } => {
    if (!v) return { level: 0, label: '', color: '' };
    let score = 0;
    if (v.length >= 8) score++;
    if (v.length >= 12) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    if (score <= 1) return { level: 1, label: '약함', color: 'bg-red-500' };
    if (score <= 2) return { level: 2, label: '보통', color: 'bg-amber-500' };
    if (score <= 3) return { level: 3, label: '양호', color: 'bg-indigo-500' };
    return { level: 4, label: '강함', color: 'bg-emerald-500' };
  };

  const pwStrength = getPasswordStrength(password);

  const performAuth = async (endpoint: string, body: unknown) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || '인증에 실패했습니다');
    localStorage.setItem('token', data.token);
    const meRes = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    if (meRes.ok) {
      const user = await meRes.json();
      localStorage.setItem('user', JSON.stringify(user));
    }
    navigate(ROUTES.home);
    window.location.reload();
  };

  const onLogin = async (data: LoginFormValues) => {
    setAuthError('');
    try {
      await performAuth('/api/auth/login', data);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '인증에 실패했습니다');
    }
  };

  const onRegister = async (data: RegisterFormValues) => {
    setAuthError('');
    try {
      await performAuth('/api/auth/register', {
        email: data.email,
        password: data.password,
        name: data.name,
        userType: data.userType,
        companyName: data.companyName || undefined,
      });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '인증에 실패했습니다');
    }
  };

  const loading = isRegister
    ? registerForm.formState.isSubmitting
    : loginForm.formState.isSubmitting;
  const emailError = isRegister
    ? registerForm.formState.errors.email?.message
    : loginForm.formState.errors.email?.message;
  const passwordError = isRegister
    ? registerForm.formState.errors.password?.message
    : loginForm.formState.errors.password?.message;
  const nameError = registerForm.formState.errors.name?.message;
  const companyNameError = registerForm.formState.errors.companyName?.message;

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel - hidden on mobile.
          Solid sapphire surface + subtle dot grid. mesh blob/floating squares 제거. */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-sky-900">
        {/* refined dot grid — purposeful texture, not glassmorphic */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(255 255 255 / 0.5) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* single accent — vertical sapphire band along right edge for editorial anchor */}
        <div aria-hidden="true" className="absolute right-0 inset-y-0 w-px bg-white/15" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-16">
          {/* Eyebrow */}
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200 mb-8">
            이력서공방 · AI Career Workshop
          </div>

          <h2
            className="font-black text-white mb-6 leading-[0.95] tracking-[-0.035em]"
            style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)' }}
          >
            서류 합격률,
            <br />
            <span className="text-sky-300">데이터로</span> 올립니다.
          </h2>
          <p className="text-sky-100 text-base leading-relaxed mb-12 max-w-md">
            5종 AI 분석, 26개 직종 템플릿, 실시간 미리보기.
            <br />
            합격으로 가는 거리를 가장 짧게.
          </p>

          {/* Stats — borderless typographic, no glass cards */}
          <div className="grid grid-cols-3 gap-8 mb-12 max-w-md">
            {[
              { num: '26', unit: '개', label: '직종 템플릿' },
              { num: '5', unit: '종', label: 'AI 분석' },
              { num: 'Live', unit: '●', label: '실시간 미리보기' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl xl:text-4xl font-black text-white tabular-nums leading-none tracking-tight">
                  {stat.num}
                  <span className="text-sky-300 text-sm font-bold align-top ml-0.5">
                    {stat.unit}
                  </span>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sky-200 mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[
              {
                icon: (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
                text: 'ATS 최적화 검사로 합격률 UP',
              },
              {
                icon: (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                ),
                text: 'JD 매칭 분석으로 맞춤 이력서 작성',
              },
              {
                icon: (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                ),
                text: '안전한 데이터 보호, 완전 무료 시작',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <span className="shrink-0 w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                  {item.icon}
                </span>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to={ROUTES.home} className="inline-block group">
              <div className="w-14 h-14 bg-neutral-900 dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-shadow duration-200 lg:hidden">
                <span className="text-white text-2xl font-bold">&#xC774;</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                &#xC774;&#xB825;&#xC11C;&#xACF5;&#xBC29;
              </h1>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              AI &#xAE30;&#xBC18; &#xC774;&#xB825;&#xC11C; &#xAD00;&#xB9AC; &#xD50C;&#xB7AB;&#xD3FC;
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
            {/* Login / Register tab toggle */}
            <div className="flex mb-6 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setAuthError('');
                }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'login' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                &#xB85C;&#xADF8;&#xC778;
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setAuthError('');
                }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'register' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                &#xD68C;&#xC6D0;&#xAC00;&#xC785;
              </button>
            </div>

            <div aria-live="assertive" aria-atomic="true">
              {(error || authError) && (
                <div
                  role="alert"
                  id="auth-error"
                  className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 text-center animate-fade-in"
                >
                  {authError || '로그인에 실패했습니다. 다시 시도해주세요.'}
                </div>
              )}
            </div>

            {/* Social login buttons */}
            <div className="space-y-2.5 mb-6">
              {PROVIDERS.map((p) => {
                const Icon = p.icon;
                return (
                  <a
                    key={p.id}
                    href={getSocialLoginUrl(p.id)}
                    className={`flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${p.className}`}
                  >
                    <Icon />
                    {p.name}&#xC73C;&#xB85C; {isRegister ? '가입하기' : '계속하기'}
                  </a>
                );
              })}
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-slate-800 px-3 text-xs text-slate-400 dark:text-slate-500">
                  &#xB610;&#xB294; &#xC774;&#xBA54;&#xC77C;&#xB85C;
                </span>
              </div>
            </div>

            {/* Email form */}
            <form
              onSubmit={
                isRegister ? registerForm.handleSubmit(onRegister) : loginForm.handleSubmit(onLogin)
              }
              className="space-y-3"
              noValidate
            >
              {isRegister && (
                <>
                  <div>
                    <label htmlFor="register-name" className="sr-only">
                      이름
                    </label>
                    <input
                      id="register-name"
                      type="text"
                      {...registerForm.register('name')}
                      placeholder="이름"
                      aria-required="true"
                      aria-invalid={!!nameError}
                      aria-describedby={nameError ? 'name-error' : undefined}
                      className={`w-full px-4 py-3 border rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${nameError ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-600'}`}
                    />
                    {nameError && (
                      <p id="name-error" className="mt-1 text-xs text-red-500" role="alert">
                        {nameError}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        {
                          value: 'personal',
                          label: '개인',
                          icon: (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          ),
                          desc: '구직자',
                          features: ['이력서 작성/관리', 'AI 분석 & ATS', '채용정보 열람'],
                        },
                        {
                          value: 'recruiter',
                          label: '리크루터',
                          icon: (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          ),
                          desc: '채용 담당',
                          features: ['인재 탐색/스카우트', '채용공고 등록', '지원자 관리'],
                        },
                        {
                          value: 'company',
                          label: '기업',
                          icon: (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                          ),
                          desc: '기업 회원',
                          features: ['채용 대시보드', '팀 스카우트 관리', '기업 브랜딩'],
                        },
                      ] as const
                    ).map((tp) => (
                      <button
                        key={tp.value}
                        type="button"
                        onClick={() =>
                          registerForm.setValue('userType', tp.value, { shouldValidate: true })
                        }
                        className={`p-2.5 rounded-xl border text-center transition-all duration-200 ${
                          userType === tp.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`flex justify-center mb-1 ${userType === tp.value ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
                        >
                          {tp.icon}
                        </span>
                        <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                          {tp.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{tp.desc}</span>
                      </button>
                    ))}
                  </div>
                  {/* 회원 유형별 기능 안내 */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5 uppercase tracking-wider">
                      {userType === 'personal'
                        ? '구직자'
                        : userType === 'recruiter'
                          ? '리크루터'
                          : '기업'}{' '}
                      주요 기능
                    </p>
                    <ul className="space-y-1">
                      {(userType === 'personal'
                        ? [
                            '이력서 작성 및 AI 분석',
                            'ATS 점수 확인 & JD 매칭',
                            '채용정보 열람 및 지원 관리',
                            '커뮤니티 참여 & 면접 준비',
                          ]
                        : userType === 'recruiter'
                          ? [
                              '인재 탐색 및 이력서 검색',
                              '스카우트 메시지 발송',
                              '채용공고 등록 및 관리',
                              '지원자 파이프라인 관리',
                            ]
                          : [
                              '채용 대시보드 & 분석',
                              '팀 단위 스카우트 관리',
                              '기업 브랜딩 페이지',
                              '채용공고 대량 등록',
                            ]
                      ).map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
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
                  </div>
                  {userType !== 'personal' && (
                    <div>
                      <input
                        type="text"
                        {...registerForm.register('companyName')}
                        placeholder={userType === 'company' ? '회사명 *' : '소속 회사'}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {companyNameError && (
                        <p className="mt-1 text-xs text-red-500" role="alert">
                          {companyNameError}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
              <div>
                <label htmlFor="login-email" className="sr-only">
                  이메일
                </label>
                <input
                  id="login-email"
                  type="email"
                  {...(isRegister ? registerForm.register('email') : loginForm.register('email'))}
                  placeholder="이메일"
                  aria-required="true"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  className={`w-full px-4 py-3 border rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${emailError ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-600'}`}
                />
                {emailError && (
                  <p id="email-error" className="mt-1 text-xs text-red-500" role="alert">
                    {emailError}
                  </p>
                )}
              </div>
              <div>
                <div className="relative">
                  <label htmlFor="login-password" className="sr-only">
                    비밀번호
                  </label>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    {...(isRegister
                      ? registerForm.register('password')
                      : loginForm.register('password'))}
                    placeholder="비밀번호 (8자 이상)"
                    aria-required="true"
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                    className={`w-full px-4 py-3 pr-11 border rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${passwordError ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-600'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5"
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg
                        className="w-4.5 h-4.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4.5 h-4.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p id="password-error" className="mt-1 text-xs text-red-500" role="alert">
                    {passwordError}
                  </p>
                )}
                {isRegister &&
                  password.length > 0 &&
                  (() => {
                    const hasLen = password.length >= 8;
                    const hasUpper = /[A-Z]/.test(password);
                    const hasNumber = /\d/.test(password);
                    const hasSpecial = /[!@#$%^&*]/.test(password);
                    const score = [hasLen, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
                    const labels = ['매우 약함', '약함', '보통', '강함', '매우 강함'];
                    const colors = [
                      'bg-red-500',
                      'bg-orange-500',
                      'bg-yellow-500',
                      'bg-emerald-500',
                      'bg-emerald-600',
                    ];
                    return (
                      <div className="mt-1.5">
                        <div className="flex gap-1 mb-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full ${i < score ? colors[score] : 'bg-slate-200 dark:bg-slate-700'}`}
                            />
                          ))}
                        </div>
                        <p
                          className={`text-[10px] ${score <= 1 ? 'text-red-500' : score <= 2 ? 'text-yellow-500' : 'text-emerald-500'}`}
                        >
                          {labels[score]} —{' '}
                          {!hasLen
                            ? '8자 이상'
                            : !hasUpper
                              ? '대문자 포함'
                              : !hasNumber
                                ? '숫자 포함'
                                : !hasSpecial
                                  ? '특수문자 포함'
                                  : '안전한 비밀번호'}
                        </p>
                      </div>
                    );
                  })()}
                {isRegister && password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors duration-200 ${i <= pwStrength.level ? pwStrength.color : 'bg-slate-200 dark:bg-slate-700'}`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-xs ${pwStrength.level <= 1 ? 'text-red-500' : pwStrength.level <= 2 ? 'text-amber-500' : pwStrength.level <= 3 ? 'text-indigo-500' : 'text-emerald-500'}`}
                    >
                      {pwStrength.label}
                      {pwStrength.level <= 2 && ' - 대문자, 숫자, 특수문자를 포함하세요'}
                    </p>
                  </div>
                )}
              </div>

              {!isRegister && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      로그인 상태 유지
                    </span>
                  </label>
                  <Link
                    to={ROUTES.forgotPassword}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  >
                    비밀번호 찾기
                  </Link>
                </div>
              )}

              {isRegister && (
                <div className="space-y-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    개인정보 동의
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...registerForm.register('agreeTerms')}
                      className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                      <span className="text-red-500 font-medium">[필수]</span>{' '}
                      <Link
                        to={ROUTES.terms}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        이용약관
                      </Link>
                      에 동의합니다
                    </span>
                  </label>
                  {registerForm.formState.errors.agreeTerms && (
                    <p className="text-[11px] text-red-500 ml-6" role="alert">
                      {registerForm.formState.errors.agreeTerms.message}
                    </p>
                  )}

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...registerForm.register('agreePrivacy')}
                      className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                      <span className="text-red-500 font-medium">[필수]</span>{' '}
                      <Link
                        to={ROUTES.privacy}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        개인정보 수집·이용
                      </Link>
                      에 동의합니다
                    </span>
                  </label>
                  {registerForm.formState.errors.agreePrivacy && (
                    <p className="text-[11px] text-red-500 ml-6" role="alert">
                      {registerForm.formState.errors.agreePrivacy.message}
                    </p>
                  )}

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...registerForm.register('llmOptIn')}
                      className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                      <span className="text-slate-400 font-medium">[선택]</span> AI 변환/분석 기능
                      사용을 위한 개인정보 국외 이전(미국 소재 LLM 제공사)에 동의합니다
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...registerForm.register('marketingOptIn')}
                      className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                      <span className="text-slate-400 font-medium">[선택]</span> 마케팅 정보
                      수신(이메일·푸시)에 동의합니다
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="imp-btn w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {loading ? '처리 중...' : isRegister ? '회원가입' : '로그인'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                {isRegister ? '가입' : '로그인'}하면{' '}
                <Link
                  to={ROUTES.terms}
                  className="text-slate-500 dark:text-slate-400 underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200"
                >
                  이용약관
                </Link>{' '}
                및{' '}
                <Link
                  to={ROUTES.privacy}
                  className="text-slate-500 dark:text-slate-400 underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200"
                >
                  개인정보처리방침
                </Link>
                에 동의하는 것으로 간주합니다.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-6">
            <Link
              to={ROUTES.home}
              className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
            >
              비로그인으로 사용하기 &rarr;
            </Link>
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              무료 사용
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              데이터 안전
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              오픈소스
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
