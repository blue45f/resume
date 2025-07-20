import Header from '@/components/Header';

export default function TermsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8" role="main">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">이용약관</h1>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">제1조 (목적)</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              본 약관은 이력서공방(이하 "서비스")가 제공하는 이력서 관리 플랫폼 서비스의 이용 조건 및
              절차, 이용자와 서비스 제공자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">제2조 (서비스 내용)</h2>
            <ul className="text-sm text-slate-600 mt-3 space-y-1 list-disc list-inside">
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
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">제3조 (회원가입 및 계정)</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              서비스는 소셜 로그인(Google, GitHub, Kakao)을 통해 가입할 수 있으며,
              비로그인 상태에서도 기본 기능을 이용할 수 있습니다.
              로그인 시 이력서가 계정에 연결되어 다른 기기에서도 접근 가능합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">제4조 (개인정보 처리)</h2>
            <ul className="text-sm text-slate-600 mt-3 space-y-1 list-disc list-inside">
              <li><strong>수집 항목:</strong> 소셜 로그인 시 이메일, 이름, 프로필 사진</li>
              <li><strong>이력서 데이터:</strong> 사용자가 직접 입력한 이력서 정보 (인적사항, 경력, 학력 등)</li>
              <li><strong>저장 위치:</strong> PostgreSQL 데이터베이스 (Neon, AWS 싱가포르 리전)</li>
              <li><strong>AI 처리:</strong> LLM 변환 시 이력서 데이터가 외부 AI 서비스(Gemini, Groq, Anthropic)에 전송됩니다</li>
              <li><strong>삭제:</strong> 이력서 삭제 시 관련 데이터가 즉시 삭제됩니다 (cascade)</li>
              <li><strong>제3자 제공:</strong> 사용자 동의 없이 개인정보를 제3자에게 제공하지 않습니다</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">제5조 (이력서 공개 설정)</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              이력서는 기본적으로 <strong>비공개</strong>로 설정됩니다. 사용자는 이력서를 다음과 같이 설정할 수 있습니다:
            </p>
            <ul className="text-sm text-slate-600 mt-2 space-y-1 list-disc list-inside">
              <li><strong>비공개:</strong> 본인만 접근 가능</li>
              <li><strong>공개:</strong> 탐색 페이지에서 누구나 열람 가능</li>
              <li><strong>링크만 공개:</strong> 공유 링크를 통해서만 접근 가능</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">제6조 (AI 서비스 이용)</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              AI 이력서 변환 기능은 외부 LLM 서비스를 활용하며, 변환 결과의 정확성을 보장하지 않습니다.
              사용자는 AI 생성 결과를 검토하고 필요시 수정해야 합니다.
              AI 변환 시 이력서 데이터가 LLM 프로바이더 서버로 전송되며,
              각 프로바이더의 데이터 처리 정책이 적용됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">제7조 (서비스 제한)</h2>
            <ul className="text-sm text-slate-600 mt-3 space-y-1 list-disc list-inside">
              <li>첨부파일: 파일당 최대 10MB, 이력서당 최대 100MB (20개)</li>
              <li>AI 변환: 분당 5회 제한 (Rate Limiting)</li>
              <li>API 요청: 초당 10회, 분당 100회 제한</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">제8조 (면책사항)</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              본 서비스는 무료로 제공되며, 서비스의 지속적인 운영을 보장하지 않습니다.
              천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.
              사용자는 중요한 이력서 데이터를 별도로 백업할 것을 권장합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">제9조 (약관 변경)</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              본 약관은 서비스 개선에 따라 변경될 수 있으며, 변경 시 서비스 내 공지합니다.
            </p>
          </section>

          <div className="text-xs text-slate-400 pt-4 border-t border-slate-100">
            시행일: 2026년 3월 30일
          </div>
        </div>
      </main>
    </>
  );
}
