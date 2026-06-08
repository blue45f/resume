import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  formatCommunityDemoTime,
  readCommunityDemoLog,
  summarizeCommunityDemoLog,
} from '@/lib/communityDemoLog';

const TERMS_DEMO_CHECKLIST_STORAGE_KEY = 'resume-terms-demo-checklist-v1';
const TERMS_DEMO_CHECKS = [
  {
    id: 'resume-privacy',
    title: '이력서 개인정보 처리 확인',
    detail: '인적사항, 경력, 학력 등 민감한 자기소개 데이터의 수집·보관 범위',
  },
  {
    id: 'ai-provider',
    title: 'AI 처리 고지 확인',
    detail: 'LLM 변환 시 외부 AI 서비스로 데이터가 전송될 수 있다는 고지',
  },
  {
    id: 'community-rule',
    title: '커뮤니티 이용 제한 확인',
    detail: '비방, 권리 침해, 운영 방해 글쓰기 제한 기준',
  },
  {
    id: 'sharing',
    title: '공개·공유 설정 확인',
    detail: '공개, 링크만 공개, 비공개 설정의 접근 범위',
  },
] as const;

type TermsDemoCheckId = (typeof TERMS_DEMO_CHECKS)[number]['id'];

const readTermsChecklist = (): TermsDemoCheckId[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(TERMS_DEMO_CHECKLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is TermsDemoCheckId =>
      TERMS_DEMO_CHECKS.some((check) => check.id === id),
    );
  } catch {
    return [];
  }
};

const writeTermsChecklist = (items: TermsDemoCheckId[]) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(TERMS_DEMO_CHECKLIST_STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

export default function TermsPage() {
  const [checkedTerms, setCheckedTerms] = useState<TermsDemoCheckId[]>(readTermsChecklist);
  const [communityLogs] = useState(() => readCommunityDemoLog());
  const communityDemoSummary = useMemo(
    () => summarizeCommunityDemoLog(communityLogs),
    [communityLogs],
  );
  const recentBlockedLogs = useMemo(
    () =>
      communityLogs
        .filter((log) => log.action === 'blocked')
        .slice(-3)
        .reverse(),
    [communityLogs],
  );
  const termsReadinessRate = Math.round((checkedTerms.length / TERMS_DEMO_CHECKS.length) * 100);
  const toggleTermsCheck = (id: TermsDemoCheckId, checked: boolean) => {
    setCheckedTerms((current) => {
      const next = checked
        ? Array.from(new Set([...current, id]))
        : current.filter((item) => item !== id);
      writeTermsChecklist(next);
      return next;
    });
  };

  useEffect(() => {
    document.title = '이용약관 — 이력서공방';
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
        <h1 className="heading-accent text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          이용약관
        </h1>

        <section
          className="mb-8 rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/70"
          aria-label="약관 데모 체크리스트"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-400">
                Terms readiness
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                커뮤니티 이용 전 확인
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                커뮤니티에서 남긴 검색·열람·작성 제한 로그를 약관 확인 항목과 연결합니다.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-[11px] text-slate-500">완료율</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {termsReadinessRate}%
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <span
              className="block h-full rounded-full bg-sky-700"
              style={{ width: `${termsReadinessRate}%` }}
            />
          </div>
          <div className="mt-4 grid gap-2">
            {TERMS_DEMO_CHECKS.map((check) => (
              <label
                key={check.id}
                className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/40"
              >
                <input
                  type="checkbox"
                  checked={checkedTerms.includes(check.id)}
                  onChange={(event) => toggleTermsCheck(check.id, event.target.checked)}
                  className="mt-1 h-4 w-4 accent-sky-700"
                />
                <span>
                  <strong className="block text-slate-800 dark:text-slate-100">
                    {check.title}
                  </strong>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{check.detail}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-4 grid gap-2 text-xs sm:grid-cols-4">
            <span className="rounded-lg bg-slate-100 px-2 py-1.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              검색 {communityDemoSummary.searchCount}
            </span>
            <span className="rounded-lg bg-slate-100 px-2 py-1.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              열람 {communityDemoSummary.readCount}
            </span>
            <span className="rounded-lg bg-slate-100 px-2 py-1.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              작성 {communityDemoSummary.writeCount}
            </span>
            <span className="rounded-lg bg-amber-100 px-2 py-1.5 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              차단 {communityDemoSummary.blockedCount}
            </span>
          </div>
          {recentBlockedLogs.length > 0 ? (
            <div className="mt-4 space-y-2">
              {recentBlockedLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200"
                >
                  <strong>{log.label}</strong>
                  {log.detail ? <span> · {log.detail}</span> : null}
                  <span className="ml-2 opacity-70">{formatCommunityDemoTime(log.at)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              제1조 (목적)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              본 약관은 이력서공방(이하 "서비스")가 제공하는 이력서 관리 플랫폼 서비스의 이용 조건
              및 절차, 이용자와 서비스 제공자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              제2조 (서비스 내용)
            </h2>
            <ul className="text-sm text-slate-600 dark:text-slate-400 mt-3 space-y-1 list-disc list-inside">
              <li>이력서 작성, 수정, 삭제 및 관리</li>
              <li>AI 기반 이력서 양식 변환 (LLM 활용)</li>
              <li>이력서 공유 링크 생성 (비밀번호 보호, 만료 설정)</li>
              <li>이력서 버전 관리 및 복원</li>
              <li>이력서 템플릿 및 태그 관리</li>
              <li>소셜 로그인 (Google, GitHub, Kakao)</li>
              <li>PDF/인쇄 내보내기</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              제3조 (회원가입 및 계정)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              서비스는 소셜 로그인(Google, GitHub, Kakao)을 통해 가입할 수 있으며, 비로그인
              상태에서도 기본 기능을 이용할 수 있습니다. 로그인 시 이력서가 계정에 연결되어 다른
              기기에서도 접근 가능합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              제4조 (개인정보 처리)
            </h2>
            <ul className="text-sm text-slate-600 dark:text-slate-400 mt-3 space-y-1 list-disc list-inside">
              <li>
                <strong>수집 항목:</strong> 소셜 로그인 시 이메일, 이름, 프로필 사진
              </li>
              <li>
                <strong>이력서 데이터:</strong> 사용자가 직접 입력한 이력서 정보 (인적사항, 경력,
                학력 등)
              </li>
              <li>
                <strong>저장 위치:</strong> PostgreSQL 데이터베이스 (Neon, AWS 싱가포르 리전)
              </li>
              <li>
                <strong>AI 처리:</strong> LLM 변환 시 이력서 데이터가 외부 AI 서비스(Gemini, Groq,
                Anthropic)에 전송됩니다
              </li>
              <li>
                <strong>삭제:</strong> 이력서 삭제 시 관련 데이터가 즉시 삭제됩니다 (cascade)
              </li>
              <li>
                <strong>제3자 제공:</strong> 사용자 동의 없이 개인정보를 제3자에게 제공하지 않습니다
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              제5조 (이력서 공개 설정)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              이력서는 기본적으로 <strong>비공개</strong>로 설정됩니다. 사용자는 이력서를 다음과
              같이 설정할 수 있습니다:
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 mt-2 space-y-1 list-disc list-inside">
              <li>
                <strong>비공개:</strong> 본인만 접근 가능
              </li>
              <li>
                <strong>공개:</strong> 탐색 페이지에서 누구나 열람 가능
              </li>
              <li>
                <strong>링크만 공개:</strong> 공유 링크를 통해서만 접근 가능
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              제6조 (AI 서비스 이용)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              AI 이력서 변환 기능은 외부 LLM 서비스를 활용하며, 변환 결과의 정확성을 보장하지
              않습니다. 사용자는 AI 생성 결과를 검토하고 필요시 수정해야 합니다. AI 변환 시 이력서
              데이터가 LLM 프로바이더 서버로 전송되며, 각 프로바이더의 데이터 처리 정책이
              적용됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              제7조 (서비스 제한)
            </h2>
            <ul className="text-sm text-slate-600 dark:text-slate-400 mt-3 space-y-1 list-disc list-inside">
              <li>첨부파일: 파일당 최대 10MB, 이력서당 최대 100MB (20개)</li>
              <li>AI 변환: 분당 5회 제한 (Rate Limiting)</li>
              <li>API 요청: 초당 10회, 분당 100회 제한</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              제8조 (면책사항)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              본 서비스는 무료로 제공되며, 서비스의 지속적인 운영을 보장하지 않습니다. 천재지변,
              시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.
              사용자는 중요한 이력서 데이터를 별도로 백업할 것을 권장합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              제9조 (약관 변경)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              본 약관은 서비스 개선에 따라 변경될 수 있으며, 변경 시 서비스 내 공지합니다.
            </p>
          </section>

          <div className="text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-700">
            시행일: 2026년 3월 30일
          </div>
        </div>

        <h1
          id="privacy"
          className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8 mt-16 scroll-mt-24"
        >
          개인정보 처리방침
        </h1>

        <section
          className="mb-8 rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/70"
          aria-label="약관 데모 체크리스트"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-400">
                Terms readiness
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                커뮤니티 이용 전 확인
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                커뮤니티에서 남긴 검색·열람·작성 제한 로그를 약관 확인 항목과 연결합니다.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-[11px] text-slate-500">완료율</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {termsReadinessRate}%
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <span
              className="block h-full rounded-full bg-sky-700"
              style={{ width: `${termsReadinessRate}%` }}
            />
          </div>
          <div className="mt-4 grid gap-2">
            {TERMS_DEMO_CHECKS.map((check) => (
              <label
                key={check.id}
                className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/40"
              >
                <input
                  type="checkbox"
                  checked={checkedTerms.includes(check.id)}
                  onChange={(event) => toggleTermsCheck(check.id, event.target.checked)}
                  className="mt-1 h-4 w-4 accent-sky-700"
                />
                <span>
                  <strong className="block text-slate-800 dark:text-slate-100">
                    {check.title}
                  </strong>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{check.detail}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-4 grid gap-2 text-xs sm:grid-cols-4">
            <span className="rounded-lg bg-slate-100 px-2 py-1.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              검색 {communityDemoSummary.searchCount}
            </span>
            <span className="rounded-lg bg-slate-100 px-2 py-1.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              열람 {communityDemoSummary.readCount}
            </span>
            <span className="rounded-lg bg-slate-100 px-2 py-1.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              작성 {communityDemoSummary.writeCount}
            </span>
            <span className="rounded-lg bg-amber-100 px-2 py-1.5 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              차단 {communityDemoSummary.blockedCount}
            </span>
          </div>
          {recentBlockedLogs.length > 0 ? (
            <div className="mt-4 space-y-2">
              {recentBlockedLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200"
                >
                  <strong>{log.label}</strong>
                  {log.detail ? <span> · {log.detail}</span> : null}
                  <span className="ml-2 opacity-70">{formatCommunityDemoTime(log.at)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              1. 수집하는 개인정보
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              이력서공방은 서비스 제공을 위해 다음과 같은 최소한의 개인정보를 수집합니다.
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 mt-2 space-y-1 list-disc list-inside">
              <li>
                <strong>소셜 로그인 정보:</strong> 이메일 주소, 이름, 프로필 사진 (Google, GitHub,
                Kakao OAuth를 통해 제공)
              </li>
              <li>
                <strong>이력서 데이터:</strong> 사용자가 직접 입력한 인적사항, 경력, 학력, 자격증 등
              </li>
              <li>
                <strong>서비스 이용 기록:</strong> 접속 로그, 이력서 조회수, 기능 사용 이력
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              2. 개인정보 이용 목적
            </h2>
            <ul className="text-sm text-slate-600 dark:text-slate-400 mt-3 space-y-1 list-disc list-inside">
              <li>회원 식별 및 로그인 인증</li>
              <li>이력서 저장, 관리, 공유 기능 제공</li>
              <li>AI 기반 이력서 변환 및 분석 서비스 제공</li>
              <li>서비스 개선 및 통계 분석 (비식별 처리)</li>
              <li>고객 문의 대응</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              3. 보관 기간
            </h2>
            <ul className="text-sm text-slate-600 dark:text-slate-400 mt-3 space-y-1 list-disc list-inside">
              <li>
                <strong>회원 정보:</strong> 회원 탈퇴 시까지 보관하며, 탈퇴 즉시 삭제
              </li>
              <li>
                <strong>이력서 데이터:</strong> 사용자가 삭제할 때까지 보관하며, 삭제 시 관련 데이터
                즉시 삭제 (cascade)
              </li>
              <li>
                <strong>서비스 이용 기록:</strong> 최대 1년간 보관 후 자동 삭제
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              4. 제3자 제공
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              이력서공방은 사용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, AI
              이력서 변환 기능 이용 시 이력서 데이터가 LLM 프로바이더(Google Gemini, Groq,
              Anthropic)에 전송되며, 이는 서비스 제공에 필수적인 처리로서 각 프로바이더의 데이터
              처리 정책이 적용됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              5. 사용자 권리
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              사용자는 언제든지 다음의 권리를 행사할 수 있습니다.
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 mt-2 space-y-1 list-disc list-inside">
              <li>
                <strong>열람:</strong> 수집된 개인정보의 내용을 확인할 수 있습니다 (설정 페이지)
              </li>
              <li>
                <strong>수정:</strong> 개인정보 및 이력서 데이터를 자유롭게 수정할 수 있습니다
              </li>
              <li>
                <strong>삭제:</strong> 이력서 삭제 및 회원 탈퇴를 통해 모든 데이터를 삭제할 수
                있습니다
              </li>
              <li>
                <strong>동의 철회:</strong> 서비스 이용 동의를 언제든지 철회할 수 있으며, 이 경우
                회원 탈퇴로 처리됩니다
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
              6. 쿠키 사용
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              이력서공방은 로그인 세션 유지 및 사용자 환경 설정 저장을 위해 쿠키와 로컬 스토리지를
              사용합니다. 사용자는 브라우저 설정에서 쿠키를 비활성화할 수 있으나, 이 경우 일부
              기능(로그인 등)이 제한될 수 있습니다.
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 mt-2 space-y-1 list-disc list-inside">
              <li>
                <strong>필수 쿠키:</strong> 로그인 인증 토큰, 세션 관리
              </li>
              <li>
                <strong>기능 쿠키:</strong> 다크 모드 설정, 쿠키 동의 여부, 사용자 환경 설정
              </li>
            </ul>
          </section>

          <div className="text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-700">
            시행일: 2026년 4월 2일
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
