import { Link, useSearchParams } from 'react-router-dom';
import { getSocialLoginUrl } from '@/lib/auth';

const PROVIDERS = [
  { id: 'google', name: 'Google', color: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50', icon: '🔵' },
  { id: 'github', name: 'GitHub', color: 'bg-slate-900 text-white hover:bg-slate-800', icon: '⚫' },
  { id: 'kakao', name: 'Kakao', color: 'bg-yellow-300 text-yellow-900 hover:bg-yellow-400', icon: '💬' },
];

export default function LoginPage() {
  const [params] = useSearchParams();
  const error = params.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-slate-900">이력서공방</Link>
          <p className="text-sm text-slate-500 mt-1">이력서 관리 플랫폼</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 text-center mb-6">로그인</h2>

          {error && (
            <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
              로그인에 실패했습니다. 다시 시도해주세요.
            </div>
          )}

          <div className="space-y-3">
            {PROVIDERS.map(p => (
              <a
                key={p.id}
                href={getSocialLoginUrl(p.id)}
                className={`flex items-center justify-center gap-3 w-full py-3 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${p.color}`}
              >
                <span className="text-lg">{p.icon}</span>
                {p.name}로 계속하기
              </a>
            ))}
          </div>

          <p className="text-xs text-slate-400 text-center mt-6">
            로그인하면 <Link to="/terms" className="underline hover:text-slate-600">이용약관</Link>에 동의하는 것으로 간주합니다.
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          <Link to="/" className="hover:text-slate-600">비로그인으로 사용하기</Link>
        </p>
      </div>
    </div>
  );
}
