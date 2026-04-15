import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getSocialLoginUrl } from '@/lib/auth';
import { t } from '@/lib/i18n';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true" role="img">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" role="img">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" role="img">
      <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.839 1.89 5.33 4.729 6.727-.162.592-.586 2.146-.672 2.48-.107.416.152.41.32.298.132-.088 2.1-1.43 2.945-2.012.87.132 1.77.2 2.678.2 5.523 0 10-3.582 10-8S17.523 3 12 3z"/>
    </svg>
  );
}

const PROVIDERS = [
  { id: 'google', name: 'Google', icon: GoogleIcon, className: 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 hover:shadow-sm' },
  { id: 'github', name: 'GitHub', icon: GitHubIcon, className: 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-sm' },
  { id: 'kakao', name: 'Kakao', icon: KakaoIcon, className: 'bg-[#FEE500] text-[#191919] hover:bg-[#FDD835] hover:shadow-sm' },
];

export default function LoginPage() {
  const [params] = useSearchParams();
  const error = params.get('error');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    document.title = '로그인 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState('personal');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();

  const isRegister = activeTab === 'register';

  const validateEmail = (v: string) => {
    if (!v) return '이메일을 입력해주세요';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return '올바른 이메일 형식을 입력해주세요';
    return '';
  };

  const validatePassword = (v: string) => {
    if (!v) return '비밀번호를 입력해주세요';
    if (v.length < 8) return '비밀번호는 8자 이상이어야 합니다';
    return '';
  };

  const validateName = (v: string) => {
    if (!v) return '이름을 입력해주세요';
    return '';
  };

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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const nErr = isRegister ? validateName(name) : '';
    setEmailError(eErr);
    setPasswordError(pErr);
    setNameError(nErr);
    if (eErr || pErr || nErr) return;

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? { email, password, name, userType, companyName: companyName || undefined }
        : { email, password };
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
      navigate('/');
      window.location.reload();
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-purple-400/15 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          {/* Logo badge */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
              <span className="text-white text-xl font-bold">이</span>
            </div>
            <span className="text-white/90 font-bold text-lg tracking-tight">이력서공방</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white mb-4 leading-tight">
            AI로 완성하는<br />
            <span className="text-white/80">나만의 이력서</span>
          </h2>
          <p className="text-indigo-100 text-base leading-relaxed mb-10 max-w-md">
            5종 AI 분석, 26개 직종 템플릿, 실시간 미리보기까지.<br />경력 관리의 새로운 기준을 경험하세요.
          </p>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { num: '26+', label: '직종 템플릿' },
              { num: '5종', label: 'AI 분석' },
              { num: '100%', label: '무료 시작' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-xl font-extrabold text-white">{stat.num}</div>
                <div className="text-xs text-indigo-200 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[
              { icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ), text: 'ATS 최적화 검사로 합격률 UP' },
              { icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              ), text: 'JD 매칭 분석으로 맞춤 이력서 작성' },
              { icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              ), text: '안전한 데이터 보호, 완전 무료 시작' },
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
            <Link to="/" className="inline-block group">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/20 group-hover:shadow-indigo-600/30 transition-shadow duration-200 lg:hidden">
                <span className="text-white text-2xl font-bold">&#xC774;</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">&#xC774;&#xB825;&#xC11C;&#xACF5;&#xBC29;</h1>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">AI &#xAE30;&#xBC18; &#xC774;&#xB825;&#xC11C; &#xAD00;&#xB9AC; &#xD50C;&#xB7AB;&#xD3FC;</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
            {/* Login / Register tab toggle */}
            <div className="flex mb-6 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
              <button
                onClick={() => { setActiveTab('login'); setAuthError(''); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'login' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                &#xB85C;&#xADF8;&#xC778;
              </button>
              <button
                onClick={() => { setActiveTab('register'); setAuthError(''); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'register' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                &#xD68C;&#xC6D0;&#xAC00;&#xC785;
              </button>
            </div>

            <div aria-live="assertive" aria-atomic="true">
              {(error || authError) && (
                <div role="alert" id="auth-error" className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 text-center animate-fade-in">
                  {authError || '로그인에 실패했습니다. 다시 시도해주세요.'}
                </div>
              )}
            </div>

            {/* Social login buttons */}
            <div className="space-y-2.5 mb-6">
              {PROVIDERS.map(p => {
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
                <span className="bg-white dark:bg-slate-800 px-3 text-xs text-slate-400 dark:text-slate-500">&#xB610;&#xB294; &#xC774;&#xBA54;&#xC77C;&#xB85C;</span>
              </div>
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="space-y-3" noValidate>
              {isRegister && (
                <>
                  <div>
                    <label htmlFor="register-name" className="sr-only">이름</label>
                    <input id="register-name" type="text" value={name} onChange={e => { setName(e.target.value); setNameError(''); }} placeholder="이름" required
                      aria-required="true"
                      aria-invalid={!!nameError}
                      aria-describedby={nameError ? 'name-error' : undefined}
                      className={`w-full px-4 py-3 border rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${nameError ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-600'}`} />
                    {nameError && <p id="name-error" className="mt-1 text-xs text-red-500" role="alert">{nameError}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'personal', label: '개인', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      ), desc: '구직자' },
                      { value: 'recruiter', label: '리크루터', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      ), desc: '채용 담당' },
                      { value: 'company', label: '기업', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      ), desc: '기업 회원' },
                    ] as const).map(tp => (
                      <button
                        key={tp.value}
                        type="button"
                        onClick={() => setUserType(tp.value)}
                        className={`p-2.5 rounded-xl border text-center transition-all duration-200 ${
                          userType === tp.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className={`flex justify-center mb-1 ${userType === tp.value ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{tp.icon}</span>
                        <span className="text-xs font-medium text-slate-900 dark:text-slate-100">{tp.label}</span>
                        <span className="text-xs text-slate-400 block">{tp.desc}</span>
                      </button>
                    ))}
                  </div>
                  {userType !== 'personal' && (
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                      placeholder={userType === 'company' ? '회사명 *' : '소속 회사'}
                      required={userType === 'company'}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  )}
                </>
              )}
              <div>
                <label htmlFor="login-email" className="sr-only">이메일</label>
                <input id="login-email" type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailError(''); }} placeholder="이메일" required
                  aria-required="true"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  className={`w-full px-4 py-3 border rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${emailError ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-600'}`} />
                {emailError && <p id="email-error" className="mt-1 text-xs text-red-500" role="alert">{emailError}</p>}
              </div>
              <div>
                <div className="relative">
                  <label htmlFor="login-password" className="sr-only">비밀번호</label>
                  <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setPasswordError(''); }} placeholder="비밀번호 (8자 이상)" required minLength={8}
                    aria-required="true"
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                    className={`w-full px-4 py-3 pr-11 border rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${passwordError ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-600'}`} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5"
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                    ) : (
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {passwordError && <p id="password-error" className="mt-1 text-xs text-red-500" role="alert">{passwordError}</p>}
                {isRegister && password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-200 ${i <= pwStrength.level ? pwStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${pwStrength.level <= 1 ? 'text-red-500' : pwStrength.level <= 2 ? 'text-amber-500' : pwStrength.level <= 3 ? 'text-indigo-500' : 'text-emerald-500'}`}>
                      {pwStrength.label}
                      {pwStrength.level <= 2 && ' - 대문자, 숫자, 특수문자를 포함하세요'}
                    </p>
                  </div>
                )}
              </div>

              {!isRegister && (
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
                    비밀번호 찾기
                  </Link>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                {loading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {loading ? '처리 중...' : isRegister ? '회원가입' : '로그인'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                {isRegister ? '가입' : '로그인'}하면 <Link to="/terms" className="text-slate-500 dark:text-slate-400 underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200">이용약관</Link> 및 <Link to="/privacy" className="text-slate-500 dark:text-slate-400 underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200">개인정보처리방침</Link>에 동의하는 것으로 간주합니다.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-6">
            <Link to="/" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200">비로그인으로 사용하기 &rarr;</Link>
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              무료 사용
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              데이터 안전
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              오픈소스
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
