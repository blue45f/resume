import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import { useScrollRevealAll } from '@/hooks/useScrollReveal';
import { CardGridSkeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';
import QuickImportModal from '@/components/QuickImportModal';
import ShareResumeWithUserDialog from '@/components/ShareResumeWithUserDialog';
import Footer from '@/components/Footer';
import { ROUTES } from '@/lib/routes';
import type { ResumeSummary, Tag, Resume } from '@/types/resume';
import { deleteResume, duplicateResume, fetchResume } from '@/lib/api';
import {
  useResumes,
  useTags,
  useBookmarks,
  useApplications,
  useSystemContent,
} from '@/hooks/useResources';
import NoticePopup from '@/components/NoticePopup';
import WhatsNewModal from '@/components/WhatsNewModal';
import { getUser } from '@/lib/auth';
import {
  DEFAULT_FEATURES,
  DEFAULT_HIGHLIGHTS,
  DEFAULT_TESTIMONIALS,
  type HomeContent,
  type ResumeSortBy,
} from '@/features/home/types';
import HomeLanding from '@/features/home/HomeLanding';
import HomeDashboardWidgets from '@/features/home/HomeDashboardWidgets';
import MyResumesSection from '@/features/home/MyResumesSection';

const BannerSlider = lazy(() => import('@/components/BannerSlider'));

export default function HomePage() {
  const queryClient = useQueryClient();
  const user = getUser();
  const resumesQuery = useResumes(!!user);
  const resumes: ResumeSummary[] = (resumesQuery.data as ResumeSummary[] | undefined) ?? [];
  const tagsQuery = useTags(!!user);
  const tags: (Tag & { resumeCount: number })[] =
    (tagsQuery.data as (Tag & { resumeCount: number })[] | undefined) ?? [];
  const bookmarksQuery = useBookmarks(!!user);
  const bookmarks =
    (bookmarksQuery.data as
      | { id: string; resumeId: string; title: string; name: string }[]
      | undefined) ?? [];
  const applicationsQuery = useApplications();
  const applications = applicationsQuery.data ?? [];
  const loading = !!user && (resumesQuery.isLoading || tagsQuery.isLoading);
  const serverError = !!resumesQuery.error;
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ResumeSortBy>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const navigate = useNavigate();

  useScrollRevealAll('.reveal');

  const load = () => {
    queryClient.invalidateQueries({ queryKey: ['resumes'] });
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
  };

  // Load first resume for ProfileWizard
  const firstResumeId = resumes[0]?.id;
  const [wizardResume, setWizardResume] = useState<Resume | null>(null);
  useEffect(() => {
    if (firstResumeId && user) {
      fetchResume(firstResumeId)
        .then(setWizardResume)
        .catch(() => {});
    } else {
      setWizardResume(null);
    }
  }, [firstResumeId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        window.location.href = '/resumes/new';
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const { data: homeContent = {} } = useSystemContent<HomeContent>('homepage');
  const safeContent: HomeContent = homeContent ?? {};
  const highlights = safeContent.highlights?.length ? safeContent.highlights : DEFAULT_HIGHLIGHTS;
  const features = safeContent.features?.length ? safeContent.features : DEFAULT_FEATURES;
  const testimonials = safeContent.testimonials?.length
    ? safeContent.testimonials
    : DEFAULT_TESTIMONIALS;
  const socialProofTitle = safeContent.socialProofTitle || '이미 수천 명이 선택했습니다';

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title || '제목 없음'}" 이력서를 삭제하시겠습니까?`)) return;
    try {
      await deleteResume(id);
      toast('이력서가 삭제되었습니다', 'success');
      load();
    } catch {
      toast('삭제에 실패했습니다', 'error');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateResume(id);
      toast('이력서가 복제되었습니다', 'success');
      load();
    } catch {
      toast('복제에 실패했습니다', 'error');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((r) => r.id)));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`선택한 ${selectedIds.size}개의 이력서를 삭제하시겠습니까?`)) return;
    for (const id of selectedIds) {
      try {
        await deleteResume(id);
      } catch {}
    }
    toast(`${selectedIds.size}개 이력서가 삭제되었습니다`, 'success');
    setSelectedIds(new Set());
    setSelectMode(false);
    load();
  };

  const filtered = resumes
    .filter((r) => (filterTag ? r.tags?.some((t) => t.id === filterTag) : true))
    .filter((r) => (filterVisibility === 'all' ? true : r.visibility === filterVisibility))
    .filter(
      (r) =>
        !searchQuery ||
        (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.personalInfo?.name || '').toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const sorted = [...filtered].sort((a, b) => {
    let cmp: number;
    switch (sortBy) {
      case 'title':
        cmp = (a.title || '').localeCompare(b.title || '', 'ko');
        break;
      case 'viewCount':
        cmp = (a.viewCount || 0) - (b.viewCount || 0);
        break;
      case 'updatedAt':
      default:
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  if (loading) {
    return (
      <>
        <Header />
        <main
          id="main-content"
          className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
          role="main"
          aria-busy="true"
        >
          <div className="h-8 bg-slate-200 rounded w-48 mb-6 animate-pulse" />
          <CardGridSkeleton count={6} />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NoticePopup />
      <WhatsNewModal />
      <Header />
      <main
        id="main-content"
        className="home-shell flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <Suspense fallback={null}>
          <BannerSlider />
        </Suspense>
        {serverError && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-amber-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                서버가 시작 중입니다. 무료 호스팅 특성상 첫 로딩에 30~60초 소요될 수 있습니다.
              </p>
            </div>
            <button
              onClick={() => {
                load();
              }}
              className="home-hover-dim shrink-0 px-3 py-1 bg-amber-600 text-white text-xs font-medium rounded-lg"
            >
              재시도
            </button>
          </div>
        )}
        {user && (user.userType === 'recruiter' || user.userType === 'company') && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
            <p className="text-sm text-emerald-800 dark:text-emerald-300">
              🏢 채용 대시보드에서 공고와 스카우트를 관리하세요
            </p>
            <Link
              to={ROUTES.recruiter.dashboard}
              className="home-hover-dim shrink-0 px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg"
            >
              대시보드
            </Link>
          </div>
        )}
        {resumes.length === 0 ? (
          <HomeLanding
            highlights={highlights}
            features={features}
            testimonials={testimonials}
            socialProofTitle={socialProofTitle}
            onImport={() => setShowImport(true)}
          />
        ) : (
          <div>
            <HomeDashboardWidgets
              user={user}
              resumes={resumes}
              applications={applications}
              bookmarks={bookmarks}
              filteredCount={filtered.length}
              wizardResume={wizardResume}
            />

            <MyResumesSection
              resumes={resumes}
              tags={tags}
              filtered={filtered}
              sorted={sorted}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterTag={filterTag}
              setFilterTag={setFilterTag}
              filterVisibility={filterVisibility}
              setFilterVisibility={setFilterVisibility}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              selectMode={selectMode}
              setSelectMode={setSelectMode}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              toggleSelect={toggleSelect}
              selectAll={selectAll}
              setShareDialogOpen={setShareDialogOpen}
              handleBulkDelete={handleBulkDelete}
              handleDelete={handleDelete}
              handleDuplicate={handleDuplicate}
              navigate={navigate}
            />
          </div>
        )}
      </main>
      <Footer />
      {showImport && (
        <QuickImportModal
          onClose={() => setShowImport(false)}
          onSuccess={(id) => {
            setShowImport(false);
            navigate(ROUTES.resume.edit(id));
          }}
        />
      )}
      <ShareResumeWithUserDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        context="general"
      />
    </>
  );
}
