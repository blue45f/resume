import { Link } from 'react-router-dom';
import Header from '@/components/Header';

const features = [
  { icon: '📝', title: '이력서 관리', desc: '9개 섹션(경력, 학력, 기술, 프로젝트 등)을 체계적으로 관리. 부서, 성과, 기술 스택까지 상세 기록.' },
  { icon: '🤖', title: 'AI 양식 변환', desc: '무료 AI(Gemini, Groq)로 표준 이력서, 경력기술서, 자기소개서, LinkedIn 등 8가지 양식으로 변환.' },
  { icon: '🔗', title: '공유 & 공개', desc: '비밀번호 보호 공유 링크, 만료 시간 설정. 공개 이력서는 탐색 페이지에서 검색 가능.' },
  { icon: '📋', title: '버전 관리', desc: '수정할 때마다 자동 스냅샷. 실수로 삭제해도 이전 버전으로 복원 가능.' },
  { icon: '🏷️', title: '태그 & 템플릿', desc: '태그로 이력서 분류, 커스텀 템플릿으로 LLM 없이 무료 양식 변환.' },
  { icon: '📎', title: '첨부파일', desc: 'PDF, 이미지, 문서 파일 첨부. 포트폴리오, 자격증 등을 함께 관리.' },
  { icon: '🔐', title: '소셜 로그인', desc: 'Google, GitHub, Kakao 계정으로 간편 로그인. 비로그인으로도 사용 가능.' },
  { icon: '🖨️', title: 'PDF/인쇄', desc: '미리보기 페이지에서 브라우저 인쇄 기능으로 깔끔한 PDF 저장.' },
];

const techStack = [
  { category: '프론트엔드', items: 'React 19, TypeScript, Vite 8, Tailwind CSS 4' },
  { category: '백엔드', items: 'NestJS 11, Prisma ORM, PostgreSQL (Neon)' },
  { category: 'AI', items: 'Gemini, Groq, Anthropic Claude, n8n Webhook' },
  { category: '인프라', items: 'Vercel (프론트), Render (백엔드), Neon (DB)' },
  { category: '보안', items: 'JWT, OAuth2, Helmet, Rate Limiting, bcrypt' },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1" role="main">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">이력서공방</h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-2">AI 기반 이력서 관리 플랫폼</p>
            <p className="text-blue-200 max-w-2xl mx-auto">
              이력서를 체계적으로 관리하고, AI로 다양한 양식으로 변환하세요.
              무료 LLM을 활용하여 비용 걱정 없이 전문적인 이력서를 만들 수 있습니다.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Link to="/resumes/new" className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                이력서 만들기
              </Link>
              <Link to="/tutorial" className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-colors">
                사용 가이드
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">주요 기능</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-slate-800 mb-1">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-slate-50 py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">기술 스택</h2>
            <div className="space-y-3">
              {techStack.map(t => (
                <div key={t.category} className="flex items-start gap-3 bg-white rounded-lg border border-slate-200 p-4">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded whitespace-nowrap">{t.category}</span>
                  <span className="text-sm text-slate-600">{t.items}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-8 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-4">
              <Link to="/about" className="hover:text-slate-700">서비스 소개</Link>
              <Link to="/tutorial" className="hover:text-slate-700">사용 가이드</Link>
              <Link to="/terms" className="hover:text-slate-700">이용약관</Link>
            </div>
            <p>이력서공방 - 오픈소스 이력서 관리 플랫폼</p>
          </div>
        </footer>
      </main>
    </>
  );
}
