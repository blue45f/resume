import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const steps = [
  {
    id: 'create',
    title: '1. 이력서 만들기',
    icon: '1',
    content: (
      <div className="space-y-3">
        <p>새 이력서를 만드는 두 가지 방법이 있습니다:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-800 mb-1">직접 작성</h4>
            <p className="text-sm text-blue-700">상단 <strong>"+ 새 이력서"</strong> 버튼을 클릭하고, 템플릿을 선택한 후 각 섹션을 채워나갑니다.</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h4 className="font-semibold text-purple-800 mb-1">AI 자동 생성</h4>
            <p className="text-sm text-purple-700"><strong>"AI 생성"</strong> 버튼을 클릭하고, 기존 이력서나 경력 메모를 붙여넣으면 AI가 구조화된 이력서를 자동으로 만들어줍니다.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'edit',
    title: '2. 이력서 편집',
    icon: '2',
    content: (
      <div className="space-y-3">
        <p>이력서 편집 페이지에서 9개 섹션을 탭으로 전환하며 작성할 수 있습니다:</p>
        <div className="flex flex-wrap gap-2">
          {['인적사항', '경력', '학력', '기술', '프로젝트', '자격증', '어학', '수상', '활동'].map(s => (
            <span key={s} className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">{s}</span>
          ))}
        </div>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-800">
          <strong>Tip:</strong> <kbd className="px-1.5 py-0.5 bg-white rounded border text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white rounded border text-xs">S</kbd>로 빠르게 저장할 수 있습니다.
          좌우 화살표 키로 탭을 이동할 수 있습니다.
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">경력/프로젝트에는 <strong>부서, 주요 성과, 기술 스택</strong> 필드도 있어 상세한 이력서를 작성할 수 있습니다.</p>
      </div>
    ),
  },
  {
    id: 'ai',
    title: '3. AI 양식 변환',
    icon: '3',
    content: (
      <div className="space-y-3">
        <p>작성된 이력서를 AI가 다양한 양식으로 변환해줍니다:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {['표준 이력서', '경력기술서', '자기소개서', 'LinkedIn', '영문 이력서', '개발자용', '디자이너용', '커스텀'].map(t => (
            <div key={t} className="p-2 text-center text-xs bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700">{t}</div>
          ))}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          미리보기 페이지에서 <strong>"AI 변환"</strong> 패널을 열어 양식을 선택하세요.
          스트리밍 모드로 실시간으로 결과를 볼 수 있습니다.
          무료 LLM(Gemini, Groq)을 우선 사용하여 비용이 발생하지 않습니다.
        </p>
      </div>
    ),
  },
  {
    id: 'share',
    title: '4. 공유 & 공개',
    icon: '4',
    content: (
      <div className="space-y-3">
        <p>이력서를 공유하는 방법:</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <span className="text-lg">🔗</span>
            <div>
              <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200">공유 링크</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">고유 URL 생성, 비밀번호 보호 및 만료 시간 설정 가능</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <span className="text-lg">🌐</span>
            <div>
              <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200">공개 설정</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">이력서를 "공개"로 설정하면 탐색 페이지에서 누구나 볼 수 있습니다</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <span className="text-lg">🖨️</span>
            <div>
              <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200">PDF/인쇄</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">미리보기 페이지에서 브라우저 인쇄 기능으로 PDF 저장</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'version',
    title: '5. 버전 관리',
    icon: '5',
    content: (
      <div className="space-y-3">
        <p>이력서를 수정할 때마다 자동으로 이전 버전이 저장됩니다.</p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>미리보기 페이지에서 <strong>"버전 이력"</strong> 패널로 확인</li>
          <li>이전 버전으로 언제든 복원 가능</li>
          <li>실수로 내용을 삭제해도 복구할 수 있습니다</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'tags',
    title: '6. 태그 & 템플릿',
    icon: '6',
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">🏷️ 태그</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">이력서를 분류하고 필터링할 수 있습니다. 여러 태그를 조합하여 관리하세요.</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">📄 템플릿</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">커스텀 템플릿을 만들어 섹션 순서와 스타일을 지정할 수 있습니다. LLM 없이 무료로 변환 가능합니다.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'ats',
    title: '7. ATS 호환성 검사',
    icon: '7',
    content: (
      <div className="space-y-3">
        <p>이력서가 ATS(지원자 추적 시스템)를 통과할 수 있는지 자동으로 분석합니다.</p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>미리보기 페이지 하단의 <strong>"ATS 호환성 점수"</strong> 패널을 확인하세요</li>
          <li>0-100점 스코어와 A-F 등급을 제공합니다</li>
          <li>이름, 이메일, 경력, 기술 등 필수 항목 누락 여부를 체크합니다</li>
          <li>각 문제점에 대한 구체적인 개선 팁을 제공합니다</li>
        </ul>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800 text-sm text-emerald-800 dark:text-emerald-300">
          <strong>Tip:</strong> ATS 점수 80점 이상이면 대부분의 기업 채용 시스템을 통과할 수 있습니다.
        </div>
      </div>
    ),
  },
  {
    id: 'coverletter',
    title: '8. AI 자기소개서 생성',
    icon: '8',
    content: (
      <div className="space-y-3">
        <p>이력서와 채용 공고를 기반으로 AI가 맞춤 자기소개서를 작성합니다.</p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>상단 메뉴의 <strong>"자소서"</strong>를 클릭하세요</li>
          <li>이력서를 선택하고, 채용 공고를 붙여넣으세요</li>
          <li>회사명, 포지션, 어조(격식/친근/열정)를 선택할 수 있습니다</li>
          <li>생성된 결과는 클립보드에 복사하여 바로 사용 가능합니다</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'applications',
    title: '9. 지원 관리',
    icon: '9',
    content: (
      <div className="space-y-3">
        <p>지원한 회사를 체계적으로 추적하고 관리할 수 있습니다.</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {['지원완료', '서류심사', '면접', '합격', '불합격', '취소'].map(s => (
            <span key={s} className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">{s}</span>
          ))}
        </div>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>상단 메뉴의 <strong>"지원관리"</strong>에서 지원 내역을 추가/수정/삭제할 수 있습니다</li>
          <li>상태별 필터링과 회사/포지션 검색이 가능합니다</li>
          <li>연봉, 근무지, 메모 등 상세 정보를 기록할 수 있습니다</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'themes',
    title: '10. 이력서 테마',
    icon: '10',
    content: (
      <div className="space-y-3">
        <p>10가지 프리뷰 테마로 이력서의 시각적 스타일을 변경할 수 있습니다.</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {['클래식', '모던', '미니멀', '프로페셔널', '크리에이티브', '임원급', '스타트업', '학술', '테크', '엘레강트'].map(t => (
            <div key={t} className="p-2 text-center text-xs bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700">{t}</div>
          ))}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          미리보기 페이지 상단의 테마 셀렉터에서 실시간으로 전환할 수 있습니다. PDF 인쇄 시에도 선택한 테마가 적용됩니다.
        </p>
      </div>
    ),
  },
  {
    id: 'voice',
    title: '11. 음성 입력',
    icon: '11',
    content: (
      <div className="space-y-3">
        <p>자기소개를 음성으로 입력할 수 있습니다 (Chrome, Edge 브라우저 지원).</p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>이력서 편집 → 인적사항 탭에서 자기소개 옆의 <strong>"음성"</strong> 버튼을 클릭하세요</li>
          <li>한국어로 말하면 자동으로 텍스트로 변환됩니다</li>
          <li>녹음 중에는 버튼이 빨간색으로 표시됩니다</li>
        </ul>
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
          <strong>참고:</strong> 브라우저의 마이크 권한을 허용해야 합니다. Safari에서는 지원되지 않을 수 있습니다.
        </div>
      </div>
    ),
  },
  {
    id: 'settings',
    title: '12. 계정 설정',
    icon: '12',
    content: (
      <div className="space-y-3">
        <p>프로필, 비밀번호, 소셜 계정 연동을 관리할 수 있습니다.</p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>상단의 사용자 이름을 클릭하면 설정 페이지로 이동합니다</li>
          <li>이메일 계정은 비밀번호 변경이 가능합니다</li>
          <li>Google, GitHub, Kakao 소셜 계정을 연동/해제할 수 있습니다</li>
          <li><strong className="text-red-600">계정 삭제</strong>는 모든 데이터가 영구 삭제되므로 주의하세요</li>
        </ul>
      </div>
    ),
  },
];

const recruiterSteps = [
  {
    id: 'signup',
    title: '1. 채용 담당자로 가입',
    icon: '1',
    content: (
      <div className="space-y-3">
        <p>회원가입 시 <strong>"리크루터"</strong> 또는 <strong>"기업"</strong>을 선택하세요.</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">채용 담당자 계정은 스카우트, 채용 공고 등 채용 전용 기능을 사용할 수 있습니다.</p>
      </div>
    ),
  },
  {
    id: 'post-job',
    title: '2. 채용 공고 등록',
    icon: '2',
    content: (
      <div className="space-y-3">
        <p>상단 메뉴의 <strong>"채용"</strong> → <strong>"+ 공고 등록"</strong>에서 채용 공고를 작성하세요.</p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>포지션, 회사, 기술 스택, 연봉 등을 입력합니다</li>
          <li>구직자들이 공고를 보고 자소서를 작성할 수 있습니다</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'talent-search',
    title: '3. 인재 검색',
    icon: '3',
    content: (
      <div className="space-y-3">
        <p><strong>"탐색"</strong> 페이지에서 공개 이력서를 검색하세요.</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">기술 키워드, 이름, 직종으로 검색할 수 있습니다. 관심 있는 이력서를 북마크하세요.</p>
      </div>
    ),
  },
  {
    id: 'scout',
    title: '4. 스카우트 제안',
    icon: '4',
    content: (
      <div className="space-y-3">
        <p>이력서 상세 페이지에서 <strong>"스카우트"</strong> 버튼을 클릭하여 제안 메시지를 보내세요.</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">구직자는 스카우트 제안을 확인하고 답장할 수 있습니다.</p>
      </div>
    ),
  },
  {
    id: 'dashboard',
    title: '5. 대시보드 관리',
    icon: '5',
    content: (
      <div className="space-y-3">
        <p><strong>"대시보드"</strong>에서 등록한 공고, 보낸 스카우트, 인재 검색을 한눈에 관리하세요.</p>
      </div>
    ),
  },
];

export default function TutorialPage() {
  const [openStep, setOpenStep] = useState<string | null>('create');
  const [guideType, setGuideType] = useState<'personal' | 'recruiter'>('personal');

  useEffect(() => {
    document.title = '사용 가이드 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8" role="main">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">사용 가이드</h1>
          <p className="text-slate-500 dark:text-slate-400">이력서공방를 처음 사용하시나요? 아래 가이드를 따라해보세요.</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setGuideType('personal')}
            className={`px-4 py-2 text-sm rounded-xl transition-colors ${guideType === 'personal' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
          >
            👤 구직자 가이드
          </button>
          <button
            onClick={() => setGuideType('recruiter')}
            className={`px-4 py-2 text-sm rounded-xl transition-colors ${guideType === 'recruiter' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
          >
            🏢 채용 담당자 가이드
          </button>
        </div>

        <div className="space-y-3">
          {(guideType === 'personal' ? steps : recruiterSteps).map(step => (
            <div key={step.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setOpenStep(openStep === step.id ? null : step.id)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                aria-expanded={openStep === step.id}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                    {step.icon}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{step.title}</span>
                </div>
                <svg
                  className={`w-5 h-5 text-slate-400 transition-transform ${openStep === step.id ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openStep === step.id && (
                <div className="px-4 sm:px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">
                  {step.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {guideType === 'recruiter' ? (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/jobs/new" className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-all">채용 공고 등록</Link>
            <Link to="/explore" className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 transition-all">인재 검색</Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/resumes/new" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm">
              이력서 만들기
            </Link>
            <Link to="/auto-generate" className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-sm">
              AI 자동 생성
            </Link>
            <Link to="/explore" className="inline-flex items-center px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200">
              이력서 둘러보기
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
