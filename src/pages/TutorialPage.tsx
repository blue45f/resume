import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';

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
            <span key={s} className="px-2.5 py-1 text-xs bg-slate-100 text-slate-600 rounded-full">{s}</span>
          ))}
        </div>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-800">
          <strong>Tip:</strong> <kbd className="px-1.5 py-0.5 bg-white rounded border text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white rounded border text-xs">S</kbd>로 빠르게 저장할 수 있습니다.
          좌우 화살표 키로 탭을 이동할 수 있습니다.
        </div>
        <p className="text-sm text-slate-500">경력/프로젝트에는 <strong>부서, 주요 성과, 기술 스택</strong> 필드도 있어 상세한 이력서를 작성할 수 있습니다.</p>
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
            <div key={t} className="p-2 text-center text-xs bg-slate-50 rounded-lg border">{t}</div>
          ))}
        </div>
        <p className="text-sm text-slate-500">
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
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <span className="text-lg">🔗</span>
            <div>
              <h4 className="font-medium text-sm text-slate-800">공유 링크</h4>
              <p className="text-xs text-slate-500">고유 URL 생성, 비밀번호 보호 및 만료 시간 설정 가능</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <span className="text-lg">🌐</span>
            <div>
              <h4 className="font-medium text-sm text-slate-800">공개 설정</h4>
              <p className="text-xs text-slate-500">이력서를 "공개"로 설정하면 탐색 페이지에서 누구나 볼 수 있습니다</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <span className="text-lg">🖨️</span>
            <div>
              <h4 className="font-medium text-sm text-slate-800">PDF/인쇄</h4>
              <p className="text-xs text-slate-500">미리보기 페이지에서 브라우저 인쇄 기능으로 PDF 저장</p>
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
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
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
          <div className="p-3 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-sm text-slate-800 mb-1">🏷️ 태그</h4>
            <p className="text-xs text-slate-500">이력서를 분류하고 필터링할 수 있습니다. 여러 태그를 조합하여 관리하세요.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-sm text-slate-800 mb-1">📄 템플릿</h4>
            <p className="text-xs text-slate-500">커스텀 템플릿을 만들어 섹션 순서와 스타일을 지정할 수 있습니다. LLM 없이 무료로 변환 가능합니다.</p>
          </div>
        </div>
      </div>
    ),
  },
];

export default function TutorialPage() {
  const [openStep, setOpenStep] = useState<string | null>('create');

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8" role="main">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">사용 가이드</h1>
          <p className="text-slate-500">이력서공방를 처음 사용하시나요? 아래 가이드를 따라해보세요.</p>
        </div>

        <div className="space-y-3">
          {steps.map(step => (
            <div key={step.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setOpenStep(openStep === step.id ? null : step.id)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                aria-expanded={openStep === step.id}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                    {step.icon}
                  </span>
                  <span className="font-semibold text-slate-800">{step.title}</span>
                </div>
                <svg
                  className={`w-5 h-5 text-slate-400 transition-transform ${openStep === step.id ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openStep === step.id && (
                <div className="px-4 sm:px-5 pb-5 text-sm text-slate-600">
                  {step.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/resumes/new"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            지금 이력서 만들기
          </Link>
        </div>
      </main>
    </>
  );
}
