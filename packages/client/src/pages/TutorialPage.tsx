import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ROUTES } from '@/lib/routes';
import { tx } from '@/lib/i18n';

const steps = [
  {
    id: 'create',
    title: '1. 이력서 만들기',
    icon: '1',
    content: (
      <div className="space-y-3">
        <p>새 이력서를 만드는 두 가지 방법이 있습니다:</p>
        <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-800 mb-1">직접 작성</h4>
            <p className="text-sm text-blue-700">
              상단 <strong>"+ 새 이력서"</strong> 버튼을 클릭하고, 템플릿을 선택한 후 각 섹션을
              채워나갑니다.
            </p>
          </div>
          <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
            <h4 className="font-semibold text-sky-800 mb-1">AI 자동 생성</h4>
            <p className="text-sm text-sky-700">
              <strong>"AI 생성"</strong> 버튼을 클릭하고, 기존 이력서나 경력 메모를 붙여넣으면 AI가
              구조화된 이력서를 자동으로 만들어줍니다.
            </p>
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
          {['인적사항', '경력', '학력', '기술', '프로젝트', '자격증', '어학', '수상', '활동'].map(
            (s) => (
              <span
                key={s}
                className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full"
              >
                {s}
              </span>
            ),
          )}
        </div>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-800">
          <strong>Tip:</strong>{' '}
          <kbd className="px-1.5 py-0.5 bg-white rounded border text-xs">Ctrl</kbd> +{' '}
          <kbd className="px-1.5 py-0.5 bg-white rounded border text-xs">S</kbd>로 빠르게 저장할 수
          있습니다. 좌우 화살표 키로 탭을 이동할 수 있습니다.
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          경력/프로젝트에는 <strong>부서, 주요 성과, 기술 스택</strong> 필드도 있어 상세한 이력서를
          작성할 수 있습니다.
        </p>
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
        <div className="stagger-children grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            '표준 이력서',
            '경력기술서',
            '자기소개서',
            'LinkedIn',
            '영문 이력서',
            '개발자용',
            '디자이너용',
            '커스텀',
          ].map((t) => (
            <div
              key={t}
              className="p-2 text-center text-xs bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700"
            >
              {t}
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          미리보기 페이지에서 <strong>"AI 변환"</strong> 패널을 열어 양식을 선택하세요. 스트리밍
          모드로 실시간으로 결과를 볼 수 있습니다. 무료 LLM(Gemini, Groq)을 우선 사용하여 비용이
          발생하지 않습니다.
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                고유 URL 생성, 비밀번호 보호 및 만료 시간 설정 가능
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <span className="text-lg">🌐</span>
            <div>
              <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200">공개 설정</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                이력서를 "공개"로 설정하면 탐색 페이지에서 누구나 볼 수 있습니다
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <span className="text-lg">🖨️</span>
            <div>
              <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200">PDF/인쇄</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                미리보기 페이지에서 브라우저 인쇄 기능으로 PDF 저장
              </p>
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
          <li>
            미리보기 페이지에서 <strong>"버전 이력"</strong> 패널로 확인
          </li>
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
        <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">🏷️ 태그</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              이력서를 분류하고 필터링할 수 있습니다. 여러 태그를 조합하여 관리하세요.
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">
              📄 템플릿
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              커스텀 템플릿을 만들어 섹션 순서와 스타일을 지정할 수 있습니다. LLM 없이 무료로 변환
              가능합니다.
            </p>
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
          <li>
            미리보기 페이지 하단의 <strong>"ATS 호환성 점수"</strong> 패널을 확인하세요
          </li>
          <li>0-100점 스코어와 A-F 등급을 제공합니다</li>
          <li>이름, 이메일, 경력, 기술 등 필수 항목 누락 여부를 체크합니다</li>
          <li>각 문제점에 대한 구체적인 개선 팁을 제공합니다</li>
        </ul>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800 text-sm text-emerald-800 dark:text-emerald-300">
          <strong>Tip:</strong> ATS 점수 80점 이상이면 대부분의 기업 채용 시스템을 통과할 수
          있습니다.
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
          <li>
            상단 메뉴의 <strong>"자소서"</strong>를 클릭하세요
          </li>
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
          {['지원완료', '서류심사', '면접', '합격', '불합격', '취소'].map((s) => (
            <span
              key={s}
              className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>
            상단 메뉴의 <strong>"지원관리"</strong>에서 지원 내역을 추가/수정/삭제할 수 있습니다
          </li>
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
        <div className="stagger-children grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            '클래식',
            '모던',
            '미니멀',
            '프로페셔널',
            '크리에이티브',
            '임원급',
            '스타트업',
            '학술',
            '테크',
            '엘레강트',
          ].map((t) => (
            <div
              key={t}
              className="p-2 text-center text-xs bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700"
            >
              {t}
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          미리보기 페이지 상단의 테마 셀렉터에서 실시간으로 전환할 수 있습니다. PDF 인쇄 시에도
          선택한 테마가 적용됩니다.
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
          <li>
            이력서 편집 → 인적사항 탭에서 자기소개 옆의 <strong>"음성"</strong> 버튼을 클릭하세요
          </li>
          <li>한국어로 말하면 자동으로 텍스트로 변환됩니다</li>
          <li>녹음 중에는 버튼이 빨간색으로 표시됩니다</li>
        </ul>
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
          <strong>참고:</strong> 브라우저의 마이크 권한을 허용해야 합니다. Safari에서는 지원되지
          않을 수 있습니다.
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
          <li>
            <strong className="text-red-600">계정 삭제</strong>는 모든 데이터가 영구 삭제되므로
            주의하세요
          </li>
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
        <p>
          회원가입 시 <strong>"리크루터"</strong> 또는 <strong>"기업"</strong>을 선택하세요.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          채용 담당자 계정은 스카우트, 채용 공고 등 채용 전용 기능을 사용할 수 있습니다.
        </p>
      </div>
    ),
  },
  {
    id: 'post-job',
    title: '2. 채용 공고 등록',
    icon: '2',
    content: (
      <div className="space-y-3">
        <p>
          상단 메뉴의 <strong>"채용"</strong> → <strong>"+ 공고 등록"</strong>에서 채용 공고를
          작성하세요.
        </p>
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
        <p>
          <strong>"탐색"</strong> 페이지에서 공개 이력서를 검색하세요.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          기술 키워드, 이름, 직종으로 검색할 수 있습니다. 관심 있는 이력서를 북마크하세요.
        </p>
      </div>
    ),
  },
  {
    id: 'scout',
    title: '4. 스카우트 제안',
    icon: '4',
    content: (
      <div className="space-y-3">
        <p>
          이력서 상세 페이지에서 <strong>"스카우트"</strong> 버튼을 클릭하여 제안 메시지를 보내세요.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          구직자는 스카우트 제안을 확인하고 답장할 수 있습니다.
        </p>
      </div>
    ),
  },
  {
    id: 'dashboard',
    title: '5. 대시보드 관리',
    icon: '5',
    content: (
      <div className="space-y-3">
        <p>
          <strong>"대시보드"</strong>에서 등록한 공고, 보낸 스카우트, 인재 검색을 한눈에 관리하세요.
        </p>
      </div>
    ),
  },
];

// ── 추가 가이드: 면접 코칭 ─────────────────────────────────────────
const coachingSteps = [
  {
    id: 'browse-coaches',
    title: '1. 코치 둘러보기',
    icon: '1',
    content: (
      <div className="space-y-3">
        <p>
          <strong>"코칭"</strong> 메뉴에서 활동 중인 코치 목록을 확인하세요. 직무·경력·시간당 요금
          으로 필터링할 수 있습니다.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          각 코치의 프로필에는 경력, 전문 분야, 평균 평점, 후기가 노출됩니다.
        </p>
      </div>
    ),
  },
  {
    id: 'book-session',
    title: '2. 세션 신청',
    icon: '2',
    content: (
      <div className="space-y-3">
        <p>
          코치 프로필 페이지에서 <strong>"세션 신청"</strong>을 눌러 원하는 일정·주제를 적고
          요청하세요. 코치가 수락하면 세션이 확정됩니다.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          모의 면접·이력서 리뷰·커리어 상담 중 선택할 수 있습니다.
        </p>
      </div>
    ),
  },
  {
    id: 'session',
    title: '3. 세션 진행',
    icon: '3',
    content: (
      <div className="space-y-3">
        <p>
          확정된 세션은 <strong>"내 코칭 세션"</strong>에서 관리됩니다. 약속한 시간에 화상 미팅
          링크로 입장하거나 메시지로 진행할 수 있습니다.
        </p>
      </div>
    ),
  },
  {
    id: 'review',
    title: '4. 후기 작성',
    icon: '4',
    content: (
      <div className="space-y-3">
        <p>세션이 끝나면 별점·후기를 남겨 다른 사용자가 코치를 선택할 때 참고하도록 도와주세요.</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          플랫폼 수수료 15%가 자동 정산되며 코치는 시간당 요금을 즉시 받습니다.
        </p>
      </div>
    ),
  },
];

// ── 추가 가이드: 스터디 그룹 ───────────────────────────────────────
const studySteps = [
  {
    id: 'browse-studies',
    title: '1. 스터디 둘러보기',
    icon: '1',
    content: (
      <div className="space-y-3">
        <p>
          <strong>"스터디"</strong> 메뉴에서 직무·관심사별 스터디를 검색하세요. 모집 중·진행 중
          상태와 멤버 수를 확인할 수 있습니다.
        </p>
      </div>
    ),
  },
  {
    id: 'join-or-create',
    title: '2. 참여 또는 새 스터디 만들기',
    icon: '2',
    content: (
      <div className="space-y-3">
        <p>
          관심 가는 스터디는 <strong>"참여"</strong>를 누르면 즉시 가입됩니다. 본인이 만들고 싶다면
          <strong>"+ 새 스터디"</strong>로 직무·일정·운영 방식을 명시해 모집하세요.
        </p>
      </div>
    ),
  },
  {
    id: 'study-content',
    title: '3. 게시글·이벤트',
    icon: '3',
    content: (
      <div className="space-y-3">
        <p>
          스터디 안에서 면접 질문 공유, 자료 업로드, 댓글·반응을 통해 협업합니다. 정기 모임은
          <strong>"이벤트"</strong>로 등록해 RSVP를 받으세요.
        </p>
      </div>
    ),
  },
  {
    id: 'practice-together',
    title: '4. 함께 면접 연습',
    icon: '4',
    content: (
      <div className="space-y-3">
        <p>
          멤버끼리 직무별 면접 질문을 돌아가며 출제하고, 모의 면접 결과를 공유하면서 서로 피드백을
          주고받습니다.
        </p>
      </div>
    ),
  },
];

// ── 추가 가이드: 자기소개서 ─────────────────────────────────────────
const coverLetterSteps = [
  {
    id: 'cl-new',
    title: '1. 새 자기소개서',
    icon: '1',
    content: (
      <div className="space-y-3">
        <p>
          상단 <strong>"자소서"</strong> 메뉴 → <strong>"+ 새 자소서"</strong>로 시작하세요. 회사
          이름·지원 직무를 먼저 적으면 AI 첨삭이 더 정확해집니다.
        </p>
      </div>
    ),
  },
  {
    id: 'cl-write',
    title: '2. 항목별 작성',
    icon: '2',
    content: (
      <div className="space-y-3">
        <p>
          지원동기·강점·약점·입사 후 포부 등 항목별로 작성합니다. 각 항목은 글자 수 표시와 가이드
          질문이 함께 노출됩니다.
        </p>
      </div>
    ),
  },
  {
    id: 'cl-ai',
    title: '3. AI 첨삭·재작성',
    icon: '3',
    content: (
      <div className="space-y-3">
        <p>
          작성한 문단을 선택하고 <strong>"AI 첨삭"</strong>을 누르면 회사·직무 톤에 맞게 다듬어
          줍니다. 정량 표현 부족 / 추상적 표현은 자동으로 짚어줍니다.
        </p>
      </div>
    ),
  },
  {
    id: 'cl-share',
    title: '4. 공유·내보내기',
    icon: '4',
    content: (
      <div className="space-y-3">
        <p>완성된 자소서는 PDF로 내보내거나 공유 링크로 다른 사람에게 보낼 수 있습니다.</p>
      </div>
    ),
  },
];

// ── 추가 가이드: 모의 면접·면접 준비 ─────────────────────────────────
const interviewSteps = [
  {
    id: 'iv-prep',
    title: '1. 면접 준비 시작',
    icon: '1',
    content: (
      <div className="space-y-3">
        <p>
          <strong>"면접"</strong> 메뉴에서 직무·경력 단계를 선택하면 그에 맞는 예상 질문이
          노출됩니다.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          질문은 인성·기술·상황·발표(PT) 카테고리로 분류되어 있습니다.
        </p>
      </div>
    ),
  },
  {
    id: 'iv-camera',
    title: '2. 카메라 모의 면접',
    icon: '2',
    content: (
      <div className="space-y-3">
        <p>
          질문을 고르면 카메라·마이크 권한 후 <strong>"녹화 시작"</strong>으로 답변을 기록합니다.
          답변 후 본인 영상을 다시 보며 표정·억양·구조를 점검할 수 있습니다.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          🎙️ 차분한 톤 / ☕ 따뜻한 톤 / ✨ 또렷한 톤 / 🪶 부드러운 톤 — 면접관 음성을 4가지 중
          선택해 실제 면접 분위기를 체험할 수 있습니다.
        </p>
      </div>
    ),
  },
  {
    id: 'iv-analysis',
    title: '3. 답변 자동 분석',
    icon: '3',
    content: (
      <div className="space-y-3">
        <p>녹화된 답변은 음성 인식을 거쳐 키워드 누락·반복 표현·말 빠르기를 자동 분석합니다.</p>
      </div>
    ),
  },
  {
    id: 'iv-followup',
    title: '4. 약점 보완 사이클',
    icon: '4',
    content: (
      <div className="space-y-3">
        <p>
          반복된 답변 약점은 자동으로 다음 세션의 질문 추천에 반영됩니다. 스터디 그룹·코치와도 답변
          영상을 공유해 피드백을 받을 수 있습니다.
        </p>
      </div>
    ),
  },
];

const newFeatureSteps = [
  {
    id: 'auto-generate',
    title: '1. 사진/PDF 만으로 이력서 자동 생성',
    icon: '1',
    content: (
      <div className="space-y-3">
        <p>
          기존 종이 이력서를 사진 찍거나 PDF 가 있다면 <strong>"AI 자동 생성"</strong> 페이지에서
          업로드만 하면 끝.
        </p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>
            <strong>이미지(JPG/PNG/HEIC)</strong> — Gemini Vision 으로 텍스트 추출
          </li>
          <li>
            <strong>스캔 PDF</strong> — pdf-parse 로 임베드 텍스트, 실패 시 자동 OCR 폴백
          </li>
          <li>
            <strong>DOCX/TXT/RTF</strong> — 모두 지원
          </li>
          <li>iPhone 사진(HEIC)은 자동으로 JPEG 변환, 큰 이미지는 자동 압축</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'job-url-paste',
    title: '2. 채용공고 URL 붙여넣기 → 폼 자동 채움',
    icon: '2',
    content: (
      <div className="space-y-3">
        <p>
          원티드 / 잡코리아 / 사람인 / 점핏 등 공고 URL 만 붙여넣으면 회사명·포지션·요구사항이
          자동으로 채워집니다.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">사용 가능 화면:</p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>
            <strong>자기소개서 작성</strong> — 회사·포지션·요구사항 자동
          </li>
          <li>
            <strong>지원 추가</strong> — 회사·포지션·근무지·연봉·메모
          </li>
          <li>
            <strong>채용 공고 등록</strong> — 다른 사이트 공고 옮겨오기
          </li>
          <li>
            <strong>AI 이력서 자동 생성</strong> — 공고에 맞춘 강조 포인트 작성
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'selective-share',
    title: '3. 선택 사용자만 공개 (whitelist)',
    icon: '3',
    content: (
      <div className="space-y-3">
        <p>
          이력서 공개 설정에서 <strong>"선택 사용자만 공개"</strong> 선택 → 특정 코치·헤드헌터·동료
          만 볼 수 있도록 화이트리스트 관리.
        </p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>username 또는 이메일로 추가 (가입자 한정)</li>
          <li>
            <strong>만료일 설정</strong> 가능 — 7일/30일/90일/직접 (지원 1주일, 면접 30일 등)
          </li>
          <li>추가 즉시 알림 발송 + 즉시 열람 가능</li>
          <li>
            코치 상세 페이지의 <strong>"내 이력서 공유"</strong> 버튼으로 1-click 공유
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'coffee-chat',
    title: '4. 커피챗 + WebRTC P2P 통화',
    icon: '4',
    content: (
      <div className="space-y-3">
        <p>
          코치/시니어와 가벼운 1:1 만남. <strong>음성·화상 통화는 P2P 직접 연결</strong>(서버 거치지
          않음)이라 비용 없음.
        </p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>
            코치 상세 → <strong>"☕ 커피챗 신청"</strong> 버튼
          </li>
          <li>음성 / 화상 / 텍스트 모드 선택 + 시간 (15/30/60분)</li>
          <li>호스트 수락 시 통화 방 자동 생성 → 입장</li>
          <li>STUN 만 사용해 일부 NAT 환경에서 실패할 수 있음</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'ai-interview',
    title: '5. AI 면접 답변 분석',
    icon: '5',
    content: (
      <div className="space-y-3">
        <p>
          모의 면접 후 답변 텍스트를 <strong>AI 가 STAR 구조 / 정량 / 필러 / 1인칭 주체성</strong>
          기준으로 자동 채점.
        </p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>즉시 점수 + 항목별 개선 tip (휴리스틱, 비용 0)</li>
          <li>
            심층 분석: LLM 으로 강점/약점/구체 개선/<strong>리라이트 답변</strong> 생성
          </li>
          <li>STAR breakdown 으로 답변 구조 시각화</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'weekly-coaching',
    title: '6. 주간 AI 코칭 알림',
    icon: '6',
    content: (
      <div className="space-y-3">
        <p>
          매주 일요일 오후, 활성 사용자에게 이력서 분석 → 가장 영향 큰 개선 1개를 알림으로 발송.
        </p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>휴리스틱 우선순위 — 자기소개 → 경력 → 기술 스택 → 60일 미수정 → 다양화</li>
          <li>알림 클릭 시 해당 섹션으로 deeplink</li>
          <li>Pro 플랜은 LLM 기반 개인화 nudge (이력서 컨텍스트 반영)</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'version-diff',
    title: '7. 버전 비교 (word-level diff)',
    icon: '7',
    content: (
      <div className="space-y-3">
        <p>
          이력서 수정마다 자동 스냅샷 → 두 버전 간 차이를 <strong>단어 단위로 inline 강조</strong>.
        </p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>제거된 단어는 빨강 / 추가된 단어는 초록 mark</li>
          <li>LCS 알고리즘으로 정확한 add/remove 인식 (단순 set diff X)</li>
          <li>긴 텍스트는 expand/collapse 토글</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'avatar',
    title: '8. 프로필 아바타 + Dicebear preset',
    icon: '8',
    content: (
      <div className="space-y-3">
        <p>설정 페이지에서 프로필 사진 변경. 직접 업로드 또는 12개 preset 아바타 선택.</p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>
            <strong>업로드</strong> — Cloudinary 자동 face crop 256x256, HEIC 자동 변환
          </li>
          <li>
            <strong>기본 아바타</strong> — Notionists / Avataaars / Lorelei / Bottts / Fun-emoji
            12종
          </li>
          <li>언제든 삭제하고 이니셜 fallback 으로 복귀 가능</li>
        </ul>
      </div>
    ),
  },
];

const GUIDE_REGISTRY = {
  personal: { steps, label: '구직자', icon: '👤' },
  'new-features': { steps: newFeatureSteps, label: '✨ 신규 기능', icon: '🚀' },
  recruiter: { steps: recruiterSteps, label: '채용 담당자', icon: '🏢' },
  coaching: { steps: coachingSteps, label: '면접 코칭', icon: '🎯' },
  study: { steps: studySteps, label: '스터디 그룹', icon: '🤝' },
  'cover-letter': { steps: coverLetterSteps, label: '자기소개서', icon: '✍️' },
  interview: { steps: interviewSteps, label: '모의 면접', icon: '🎥' },
} as const;
type GuideType = keyof typeof GUIDE_REGISTRY;

/** 가이드 유형별 메인 CTA — 각 유형의 가장 자주 쓰이는 진입점 1-3개 */
function GuideCallToAction({ guideType }: { guideType: GuideType }) {
  const ctas: Record<GuideType, Array<{ to: string; label: string; primary?: boolean }>> = {
    personal: [
      { to: ROUTES.resume.new, label: '이력서 만들기', primary: true },
      { to: ROUTES.resume.autoGenerate, label: 'AI 자동 생성' },
      { to: ROUTES.resume.explore, label: '이력서 둘러보기' },
    ],
    recruiter: [
      { to: ROUTES.jobs.new, label: '채용 공고 등록', primary: true },
      { to: ROUTES.resume.explore, label: '인재 검색' },
    ],
    coaching: [
      { to: ROUTES.coaching.coaches, label: '코치 둘러보기', primary: true },
      { to: ROUTES.coaching.sessions, label: '내 코칭 세션' },
    ],
    study: [
      { to: ROUTES.interview.studyGroups, label: '스터디 둘러보기', primary: true },
      { to: ROUTES.interview.newStudyGroup, label: '+ 새 스터디' },
    ],
    'cover-letter': [
      { to: ROUTES.coverLetter.new(), label: '새 자기소개서', primary: true },
      { to: ROUTES.coverLetter.list, label: '내 자기소개서' },
    ],
    interview: [{ to: ROUTES.interview.prep, label: '면접 준비 시작', primary: true }],
    'new-features': [
      { to: ROUTES.resume.autoGenerate, label: '🚀 AI 자동 생성 시작', primary: true },
      { to: ROUTES.coaching.coaches, label: '☕ 커피챗 코치 둘러보기' },
    ],
  };
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      {ctas[guideType].map((cta) => (
        <Link
          key={cta.to}
          to={cta.to}
          className={
            cta.primary
              ? 'btn-shine inline-flex items-center px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-white shadow-sm transition-colors duration-200'
              : 'inline-flex items-center px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200'
          }
        >
          {cta.label}
        </Link>
      ))}
    </div>
  );
}

export default function TutorialPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // ?guide= 쿼리로 직접 가이드 진입 (announcement deeplink). 유효하지 않으면 personal.
  const initialGuide = (() => {
    const q = searchParams.get('guide');
    if (q && q in GUIDE_REGISTRY) return q as GuideType;
    return 'personal' as GuideType;
  })();
  const [openStep, setOpenStep] = useState<string | null>(() => {
    const firstStep = GUIDE_REGISTRY[initialGuide].steps[0]?.id;
    return firstStep || 'create';
  });
  const [guideType, setGuideTypeState] = useState<GuideType>(initialGuide);

  // guideType 변경 시 URL 동기화 (북마크/공유 가능)
  const setGuideType = (next: GuideType) => {
    setGuideTypeState(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'personal') params.delete('guide');
    else params.set('guide', next);
    setSearchParams(params, { replace: true });
    // 새 가이드의 첫 step 으로 reset
    setOpenStep(GUIDE_REGISTRY[next].steps[0]?.id || null);
  };

  useEffect(() => {
    document.title = '사용 가이드 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8"
        role="main"
      >
        <div className="text-center mb-8">
          <h1 className="heading-accent text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {tx('tutorial.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            이력서공방를 처음 사용하시나요? 아래 가이드를 따라해보세요.
          </p>
        </div>

        {/* 6개 가이드 segmented toggle — overflow-x-auto 로 모바일도 수용 */}
        <div
          role="tablist"
          aria-label="가이드 유형 선택"
          className="mb-6 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto"
        >
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto whitespace-nowrap min-w-full sm:min-w-0 sm:w-fit">
            {(Object.keys(GUIDE_REGISTRY) as GuideType[]).map((key) => {
              const g = GUIDE_REGISTRY[key];
              const active = guideType === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setGuideType(key)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span className="mr-1.5" aria-hidden="true">
                    {g.icon}
                  </span>
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          {GUIDE_REGISTRY[guideType].steps.map((step) => (
            <div
              key={step.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => setOpenStep(openStep === step.id ? null : step.id)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-[-2px] rounded-xl"
                aria-expanded={openStep === step.id}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                    {step.icon}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {step.title}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-slate-400 transition-transform ${openStep === step.id ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
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

        <GuideCallToAction guideType={guideType} />

        {/* 친절 안내 — 어디서 막혔을 때 어떻게 도움 받을지 */}
        <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
            도움이 더 필요하신가요?
          </p>
          <p>
            우측 상단 <strong>도움말(?)</strong> 메뉴 또는{' '}
            <Link
              to={ROUTES.feedback}
              className="text-sky-700 dark:text-sky-400 link-underline-reveal"
            >
              피드백 보내기
            </Link>
            로 언제든 문의주세요. 궁금한 기능이 가이드에 없다면 같이 만들어 가겠습니다.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
