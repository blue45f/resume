import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ResumeForm from '@/components/ResumeForm';
import ThemePreviewCard from '@/components/ThemePreviewCard';
import ThemePreviewModal from '@/components/ThemePreviewModal';
import { toast } from '@/components/Toast';
import { createEmptyResumeData } from '@/types/resume';
import type { Resume, ResumeSummary, Template } from '@/types/resume';
import { createResume, fetchTemplates, fetchResumes, fetchResume, duplicateResume } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { getUser } from '@/lib/auth';
import { getPlan } from '@/lib/plans';
import { resumeThemes, THEME_CATEGORY_LABELS, type ResumeTheme } from '@/lib/resumeThemes';

const SECTION_LABELS: Record<string, string> = {
  personalInfo: '인적사항', summary: '자기소개', experiences: '경력',
  educations: '학력', skills: '기술', projects: '프로젝트',
  certifications: '자격증', languages: '어학', awards: '수상', activities: '활동',
};

const SAMPLE_DATA: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '샘플 이력서',
  personalInfo: {
    name: '홍길동',
    email: 'gildong@example.com',
    phone: '010-1234-5678',
    address: '서울특별시 강남구',
    website: '',
    github: 'https://github.com/gildong',
    summary: '5년차 프론트엔드 개발자로서 React, TypeScript 기반의 웹 애플리케이션 개발에 전문성을 갖추고 있습니다. 사용자 경험을 최우선으로 생각하며, 성능 최적화와 접근성 개선에 깊은 관심을 가지고 있습니다.',
    photo: '',
    birthYear: '',
    links: [],
    military: '',
  },
  experiences: [
    {
      id: 'sample-exp-1',
      company: '테크스타트업 주식회사',
      position: '시니어 프론트엔드 개발자',
      department: '프로덕트팀',
      startDate: '2022-03',
      endDate: '',
      current: true,
      description: 'React/Next.js 기반 SaaS 플랫폼 프론트엔드 개발 리드. 디자인 시스템 구축 및 성능 최적화를 통해 LCP 40% 개선.',
      achievements: 'Core Web Vitals 전 항목 Good 달성, 컴포넌트 라이브러리 오픈소스화',
      techStack: 'React, Next.js, TypeScript, Tailwind CSS',
    },
    {
      id: 'sample-exp-2',
      company: '디지털에이전시',
      position: '프론트엔드 개발자',
      department: '웹개발팀',
      startDate: '2019-07',
      endDate: '2022-02',
      current: false,
      description: '다수의 클라이언트 프로젝트에서 반응형 웹 및 SPA 개발. Vue.js에서 React로의 마이그레이션 주도.',
      achievements: '',
      techStack: 'React, Vue.js, JavaScript, SCSS',
    },
  ],
  educations: [
    {
      id: 'sample-edu-1',
      school: '한국대학교',
      degree: '학사',
      field: '컴퓨터공학',
      gpa: '3.8/4.5',
      startDate: '2015-03',
      endDate: '2019-02',
      description: '',
    },
  ],
  skills: [
    { id: 'sample-skill-1', category: 'Frontend', items: 'React, Next.js, TypeScript, Vue.js, HTML/CSS' },
    { id: 'sample-skill-2', category: 'Tools', items: 'Git, Figma, Storybook, Jest, Cypress' },
  ],
  projects: [
    {
      id: 'sample-proj-1',
      name: '사내 디자인 시스템',
      company: '테크스타트업',
      role: '리드 개발자',
      startDate: '2023-01',
      endDate: '2023-06',
      description: 'Headless UI 패턴 기반 30+ 컴포넌트 라이브러리 설계 및 구현. Storybook 문서화 및 npm 패키지 배포.',
      techStack: 'React, TypeScript, Storybook, Rollup',
      link: '',
    },
  ],
  certifications: [],
  languages: [
    { id: 'sample-lang-1', name: '영어', testName: 'TOEIC', score: '920', testDate: '2023-06' },
  ],
  awards: [],
  activities: [],
};

function parseLayout(layout: string) {
  try {
    return JSON.parse(layout);
  } catch {
    return {};
  }
}

export default function NewResumePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [step, setStep] = useState<'template' | 'form'>('template');
  const [resumeCount, setResumeCount] = useState(0);
  const [existingTitles, setExistingTitles] = useState<string[]>([]);
  const [existingResumes, setExistingResumes] = useState<ResumeSummary[]>([]);
  const [startMode, setStartMode] = useState<'empty' | 'sample' | 'copy' | 'ai-upload'>('empty');
  const [copySourceId, setCopySourceId] = useState('');
  const [initialData, setInitialData] = useState<any>(null);
  const [loadingCopy, setLoadingCopy] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadText, setUploadText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<ResumeTheme | null>(null);
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const user = getUser();
  const plan = getPlan(user?.plan || 'free');
  const isAdminUser = user?.role === 'admin' || user?.role === 'superadmin';
  const atLimit = !isAdminUser && plan.features.maxResumes > 0 && resumeCount >= plan.features.maxResumes;

  useEffect(() => {
    document.title = '새 이력서 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  useEffect(() => {
    fetchResumes().then(r => {
      setResumeCount(r.length);
      setExistingTitles(r.map(res => res.title.toLowerCase()));
      setExistingResumes(r);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchTemplates().then(t => { if (!cancelled) setTemplates(t); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) => {
    const isDuplicate = existingTitles.includes((data.title || '').toLowerCase());
    if (isDuplicate && !confirm('같은 제목의 이력서가 이미 있습니다. 계속 생성하시겠습니까?')) return;
    setSaving(true);
    try {
      const result = await createResume(data);
      toast('이력서가 생성되었습니다', 'success');
      navigate(`/resumes/${result.id}/edit`);
    } catch {
      toast('이력서 생성에 실패했습니다', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAiUpload = async () => {
    const text = uploadText.trim();
    if (!text && !uploadFile) {
      toast('텍스트를 입력하거나 파일을 업로드해주세요', 'error');
      return;
    }
    setAiLoading(true);
    setAiProgress('문서를 분석하고 있습니다...');
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let bodyText = text;
      if (uploadFile && !text) {
        // 파일에서 텍스트 읽기 (txt 파일만 클라이언트에서 처리)
        if (uploadFile.name.endsWith('.txt')) {
          bodyText = await uploadFile.text();
        } else {
          // PDF/DOCX는 서버에서 처리 (현재는 파일명만 전달)
          bodyText = `[업로드된 파일: ${uploadFile.name}] 파일 내용을 분석하여 이력서를 생성해주세요.`;
        }
      }

      setAiProgress('AI가 이력서 항목을 추출하고 있습니다...');
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/api/auto-generate/preview`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rawText: bodyText }),
      });
      if (!res.ok) throw new Error('AI 분석에 실패했습니다');
      const data = await res.json();

      setAiProgress('이력서를 구성하고 있습니다...');
      if (data.resume) {
        setInitialData(data.resume);
        toast('AI가 이력서를 자동으로 채웠습니다! 내용을 확인하고 수정해주세요.', 'success');
        setStep('form');
      } else {
        throw new Error('이력서 데이터를 생성할 수 없습니다');
      }
    } catch (err: any) {
      toast(err.message || 'AI 분석에 실패했습니다', 'error');
    } finally {
      setAiLoading(false);
      setAiProgress('');
    }
  };

  const handleSkip = () => {
    setSelectedTemplate(null);
    proceedToForm('empty');
  };

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplate(id);
    proceedToForm(startMode);
  };

  const proceedToForm = async (mode: 'empty' | 'sample' | 'copy') => {
    if (mode === 'sample') {
      setInitialData(SAMPLE_DATA);
      setStep('form');
    } else if (mode === 'copy' && copySourceId) {
      setLoadingCopy(true);
      try {
        const source = await fetchResume(copySourceId);
        const { id, createdAt, updatedAt, ...rest } = source;
        setInitialData({ ...rest, title: `${rest.title} (복사본)` });
      } catch {
        toast('이력서를 불러오는데 실패했습니다', 'error');
        setInitialData(createEmptyResumeData());
      } finally {
        setLoadingCopy(false);
      }
      setStep('form');
    } else {
      setInitialData(createEmptyResumeData());
      setStep('form');
    }
  };

  const handleCopyFromExisting = async () => {
    if (!copySourceId) {
      toast('복사할 이력서를 선택해주세요', 'error');
      return;
    }
    setLoadingCopy(true);
    try {
      const result = await duplicateResume(copySourceId);
      toast('이력서가 복사되었습니다', 'success');
      navigate(`/resumes/${result.id}/edit`);
    } catch {
      toast('복사에 실패했습니다. 직접 편집 모드로 전환합니다.', 'error');
      proceedToForm('copy');
    } finally {
      setLoadingCopy(false);
    }
  };

  const selected = templates.find(t => t.id === selectedTemplate);

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        {atLimit ? (
          <div className="text-center py-12 animate-fade-in">
            <span className="text-4xl mb-4 block">&#128202;</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">이력서 한도 도달</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              무료 플랜에서는 최대 {plan.features.maxResumes}개의 이력서를 생성할 수 있습니다.
            </p>
            <Link to="/pricing" className="inline-block px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
              프로 플랜으로 업그레이드
            </Link>
          </div>
        ) : step === 'template' ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">새 이력서 만들기</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">시작 방법과 템플릿을 선택하세요.</p>
              </div>
              <button
                onClick={handleSkip}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-1.5"
              >
                건너뛰기
              </button>
            </div>

            {/* Start Mode Selection */}
            <div className="mb-8">
              <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">시작 방법</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Empty */}
                <button
                  onClick={() => setStartMode('empty')}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    startMode === 'empty'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">빈 이력서로 시작</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">처음부터 직접 작성합니다</p>
                </button>

                {/* Sample Data */}
                <button
                  onClick={() => setStartMode('sample')}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    startMode === 'sample'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">샘플 데이터로 시작</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">예시 데이터를 수정하며 작성합니다</p>
                </button>

                {/* Copy from existing */}
                <button
                  onClick={() => setStartMode('copy')}
                  disabled={existingResumes.length === 0}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    existingResumes.length === 0
                      ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-700'
                      : startMode === 'copy'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">이전 이력서에서 복사</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {existingResumes.length > 0 ? `${existingResumes.length}개의 이력서에서 선택` : '기존 이력서가 없습니다'}
                  </p>
                </button>

                {/* AI Upload */}
                <button
                  onClick={() => setStartMode('ai-upload')}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    startMode === 'ai-upload'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">AI 문서 분석</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">파일/텍스트로 자동 채우기</p>
                </button>
              </div>

              {/* Copy source selector */}
              {startMode === 'copy' && existingResumes.length > 0 && (
                <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">복사할 이력서 선택</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {existingResumes.slice(0, 6).map(r => (
                      <button
                        key={r.id}
                        onClick={() => setCopySourceId(r.id)}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          copySourceId === r.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{r.title || '제목 없음'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {r.personalInfo?.name || ''} -- {new Date(r.updatedAt).toLocaleDateString('ko-KR')}
                        </p>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleCopyFromExisting}
                    disabled={!copySourceId || loadingCopy}
                    className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loadingCopy ? '복사 중...' : '선택한 이력서 복사하여 시작'}
                  </button>
                </div>
              )}

              {/* AI Upload mode */}
              {startMode === 'ai-upload' && (
                <div className="mt-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    경력증명서, 기존 이력서, 자기소개 텍스트 등을 붙여넣거나 파일을 업로드하세요
                  </label>
                  <textarea
                    value={uploadText}
                    onChange={e => setUploadText(e.target.value)}
                    placeholder={"경력 메모, LinkedIn 프로필, 이전 이력서 내용 등을 자유롭게 붙여넣기...\n\n예시:\n이름: 홍길동\n경력: 네이버 프론트엔드 개발자 3년\n기술: React, TypeScript, Node.js"}
                    rows={6}
                    className="w-full px-3 py-2 text-sm border border-purple-200 dark:border-purple-700 rounded-xl dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 resize-none mb-3"
                  />
                  <div className="flex items-center gap-3 mb-3">
                    <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-sm">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      파일 첨부
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt,.rtf"
                        className="hidden"
                        onChange={e => setUploadFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    {uploadFile && (
                      <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                        <span>{uploadFile.name}</span>
                        <button onClick={() => setUploadFile(null)} className="text-slate-400 hover:text-red-500">&times;</button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAiUpload}
                    disabled={aiLoading || (!uploadText.trim() && !uploadFile)}
                    className="w-full py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {aiLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {aiProgress}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        AI로 이력서 자동 채우기
                      </>
                    )}
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    AI가 텍스트를 분석하여 인적사항, 경력, 학력, 기술 등을 자동으로 채워줍니다.
                  </p>
                </div>
              )}
            </div>

            {/* Theme Gallery */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">테마 선택</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">{resumeThemes.length}개 테마</span>
              </div>

              {/* Category filter pills */}
              <div className="flex gap-1.5 overflow-x-auto py-1 mb-4 -mx-1 px-1">
                <button
                  onClick={() => setThemeFilter('all')}
                  className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                    themeFilter === 'all'
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  전체
                </button>
                {Object.entries(THEME_CATEGORY_LABELS).map(([key, label]) => {
                  const count = resumeThemes.filter(t => t.preview?.category === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setThemeFilter(key)}
                      className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                        themeFilter === key
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Blank / no theme */}
                <div
                  className={`group relative bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
                    selectedThemeId === null
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-slate-300 dark:border-slate-600 hover:border-blue-300'
                  }`}
                  onClick={() => { setSelectedThemeId(null); setSelectedTemplate(null); proceedToForm(startMode); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedThemeId(null); setSelectedTemplate(null); proceedToForm(startMode); } }}
                >
                  <div className="aspect-[3/4] flex items-center justify-center bg-slate-50 dark:bg-slate-700/50">
                    <div className="text-center">
                      <svg className="w-10 h-10 text-slate-300 dark:text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-xs text-slate-400 dark:text-slate-500">기본 양식</p>
                    </div>
                  </div>
                  <div className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">기본</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">테마 없이 시작</p>
                  </div>
                </div>

                {resumeThemes
                  .filter(t => themeFilter === 'all' || t.preview?.category === themeFilter)
                  .map((theme) => (
                    <ThemePreviewCard
                      key={theme.id}
                      theme={theme}
                      selected={selectedThemeId === theme.id}
                      onClick={() => {
                        setSelectedThemeId(theme.id);
                        proceedToForm(startMode);
                      }}
                      onPreview={() => setPreviewTheme(theme)}
                    />
                  ))
                }
              </div>
            </div>

            {/* Template Selection (from server) */}
            {templates.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">서버 템플릿</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {templates.map((t) => {
                    const layout = parseLayout(t.layout || '{}');
                    const sections: string[] = layout.sections || [];

                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTemplate(t.id)}
                        className="text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm truncate">{t.name}</h3>
                          {t.isDefault && (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full shrink-0 ml-1">기본</span>
                          )}
                        </div>
                        {t.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{t.description}</p>
                        )}
                        {sections.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {sections.slice(0, 3).map(s => (
                              <span key={s} className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                                {SECTION_LABELS[s] || s}
                              </span>
                            ))}
                            {sections.length > 3 && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-400 rounded">
                                +{sections.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Theme Preview Modal */}
            {previewTheme && (
              <ThemePreviewModal
                theme={previewTheme}
                onClose={() => setPreviewTheme(null)}
                onSelect={() => {
                  setSelectedThemeId(previewTheme.id);
                  setPreviewTheme(null);
                  proceedToForm(startMode);
                }}
              />
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setStep('template')}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                &larr; 템플릿 선택
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                새 이력서 작성
              </h1>
              <div className="flex items-center gap-2">
                {selected && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                    {selected.name}
                  </span>
                )}
                {startMode === 'sample' && (
                  <span className="px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full">
                    샘플 데이터
                  </span>
                )}
                {startMode === 'copy' && (
                  <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full">
                    복사본
                  </span>
                )}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
              {initialData && (
                <ResumeForm initialData={initialData} onSave={handleSave} saving={saving} />
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
