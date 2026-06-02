import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { buildFollowUpCalendarEvent, getFollowUpReminderFileName } from '@/lib/applicationPacket';
import {
  buildApplicationSearchInsights,
  type ApplicationSearchInsightSummary,
} from '@/lib/applicationSearchInsights';
import {
  buildNetworkingSearchUrl,
  buildRecruiterOutreachMessage,
  getApplicationNetworkingInsight,
} from '@/lib/applicationNetworking';
import { ROUTES, withQuery } from '@/lib/routes';
import { formatDate } from '@/lib/time';
import type { JobApplication } from '@/lib/api';
import { toast } from '@/components/Toast';
import type { ResumeSummary } from '@/types/resume';

type ReadinessStyle = CSSProperties & Record<`--${string}`, string>;
type PacketTaskId = 'resume' | 'coverLetter' | 'interview' | 'followUp';
type PacketProgress = Record<PacketTaskId, boolean>;
type KeywordMatchSnapshot = {
  score: number;
  matched: string[];
  missing: string[];
  sourceCount: number;
};

interface Props {
  resumes: ResumeSummary[];
  applications?: JobApplication[];
}

interface ReadinessSignal {
  id: string;
  label: string;
  value: string;
  detail: string;
  complete: boolean;
  weight: number;
  to: string;
  actionLabel: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const PACKET_TASKS: { id: PacketTaskId; label: string }[] = [
  { id: 'resume', label: '맞춤 이력서' },
  { id: 'coverLetter', label: '자소서 초안' },
  { id: 'interview', label: '면접 질문' },
  { id: 'followUp', label: '후속 메모' },
];
const KEYWORD_STOP_WORDS = new Set([
  '및',
  '또는',
  '관련',
  '경험',
  '업무',
  '역량',
  '지원',
  '채용',
  '포지션',
  '담당',
  '자격',
  '우대',
  '필수',
  '회사',
  '근무',
  '이력서',
  'the',
  'and',
  'or',
  'with',
  'for',
  'job',
  'role',
  'work',
  'team',
  'using',
  'experience',
  'required',
  'preferred',
]);

function daysSince(date: string) {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - time) / DAY_MS);
}

function daysUntil(date?: string) {
  if (!date) return null;
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.ceil((time - Date.now()) / DAY_MS);
}

function splitSkillItems(items: string) {
  return items
    .split(/[,/·\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeKeyword(keyword: string) {
  return keyword
    .trim()
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}+#.]+|[^\p{L}\p{N}+#.]+$/gu, '');
}

function tokenizeKeywords(text: string) {
  const matches = text.toLowerCase().match(/[a-z0-9+#.]{2,}|[가-힣]{2,}/g) ?? [];
  return matches
    .map(normalizeKeyword)
    .filter((keyword) => keyword.length >= 2 && !KEYWORD_STOP_WORDS.has(keyword));
}

function getSkillKeywordCount(resumes: ResumeSummary[]) {
  const keywords = new Set<string>();
  for (const resume of resumes) {
    for (const skill of resume.skills ?? []) {
      for (const item of splitSkillItems(skill.items)) keywords.add(item);
    }
  }
  return keywords.size;
}

function getResumeKeywordSet(resume: ResumeSummary) {
  const keywords = new Set<string>();
  for (const skill of resume.skills ?? []) {
    for (const item of splitSkillItems(skill.items)) keywords.add(normalizeKeyword(item));
    for (const item of tokenizeKeywords(skill.category)) keywords.add(item);
  }
  for (const item of tokenizeKeywords(resume.title || '')) keywords.add(item);
  for (const item of tokenizeKeywords(resume.personalInfo?.summary || '')) keywords.add(item);
  for (const item of tokenizeKeywords(resume.openToWorkRoles || '')) keywords.add(item);
  for (const tag of resume.tags ?? []) {
    for (const item of tokenizeKeywords(tag.name)) keywords.add(item);
  }
  return new Set([...keywords].filter(Boolean));
}

function getApplicationKeywordSet(application: JobApplication) {
  const text = [application.position, application.notes, application.location]
    .filter(Boolean)
    .join('\n');
  return new Set(tokenizeKeywords(text));
}

function getKeywordMatchSnapshot(
  resume: ResumeSummary,
  application: JobApplication,
): KeywordMatchSnapshot | null {
  const resumeKeywords = getResumeKeywordSet(resume);
  const applicationKeywords = getApplicationKeywordSet(application);
  if (applicationKeywords.size < 3 || resumeKeywords.size === 0) return null;

  const resumeCorpus = [...resumeKeywords].join(' ');
  const matched: string[] = [];
  const missing: string[] = [];

  for (const keyword of applicationKeywords) {
    if (resumeKeywords.has(keyword) || resumeCorpus.includes(keyword)) matched.push(keyword);
    else missing.push(keyword);
  }

  return {
    score: Math.round((matched.length / applicationKeywords.size) * 100),
    matched: matched.slice(0, 5),
    missing: missing.slice(0, 5),
    sourceCount: applicationKeywords.size,
  };
}

function getLatestResume(resumes: ResumeSummary[]) {
  return [...resumes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )[0];
}

function getMeterStyle(score: number): ReadinessStyle {
  return { '--home-readiness-fill': String(Math.max(0, Math.min(100, score)) / 100) };
}

function getApplicationDate(application: JobApplication) {
  return application.appliedDate || application.createdAt;
}

function isActiveApplication(application: JobApplication) {
  return !['offer', 'rejected', 'withdrawn'].includes(application.status);
}

function getApplicationMomentum(applications: JobApplication[]) {
  const active = applications.filter(isActiveApplication);
  const recent = applications.filter(
    (application) => daysSince(getApplicationDate(application)) <= 7,
  );
  const followUpDue = active.filter((application) => daysSince(application.updatedAt) >= 7);
  const deadlineSoon = active.filter((application) => {
    const days = daysUntil(application.deadline);
    return days !== null && days >= 0 && days <= 7;
  });
  const overdue = active.filter((application) => {
    const days = daysUntil(application.deadline);
    return days !== null && days < 0;
  });
  const interviewCount = applications.filter((application) =>
    ['interview', 'interviewing'].includes(application.status),
  ).length;

  return {
    activeCount: active.length,
    recentCount: recent.length,
    followUpDueCount: followUpDue.length,
    deadlineSoonCount: deadlineSoon.length,
    overdueCount: overdue.length,
    interviewCount,
  };
}

function getApplicationUrgency(application: JobApplication) {
  const deadlineDays = daysUntil(application.deadline);
  const untouchedDays = daysSince(application.updatedAt);
  const priorityScore =
    application.priority === 'high' ? 300 : application.priority === 'medium' ? 150 : 0;

  if (deadlineDays !== null && deadlineDays < 0) return 10000 + Math.abs(deadlineDays);
  if (deadlineDays !== null && deadlineDays <= 7) return 9000 - deadlineDays;
  if (['interview', 'interviewing'].includes(application.status)) return 7600;
  if (untouchedDays >= 7) return 6500 + untouchedDays;
  return 1000 + priorityScore - daysSince(getApplicationDate(application));
}

function getNextApplication(applications: JobApplication[]) {
  return applications
    .filter(isActiveApplication)
    .sort((a, b) => getApplicationUrgency(b) - getApplicationUrgency(a))[0];
}

function getApplicationReason(application: JobApplication) {
  const deadlineDays = daysUntil(application.deadline);
  if (deadlineDays !== null && deadlineDays < 0) return `마감 ${Math.abs(deadlineDays)}일 초과`;
  if (deadlineDays === 0) return '마감 오늘';
  if (deadlineDays !== null && deadlineDays <= 7) return `마감 ${deadlineDays}일 전`;
  if (['interview', 'interviewing'].includes(application.status)) return '면접 단계';
  const untouchedDays = daysSince(application.updatedAt);
  if (untouchedDays >= 7) return `후속 ${untouchedDays}일 지연`;
  if (application.priority === 'high') return '높은 우선순위';
  return '진행 중';
}

function getPacketStorageKey(applicationId: string) {
  return `home_application_packet_${applicationId}`;
}

function getDefaultPacketProgress(application: JobApplication): PacketProgress {
  return {
    resume: Boolean(application.resumeId),
    coverLetter: Boolean(application.notes?.trim()),
    interview: ['interview', 'interviewing'].includes(application.status),
    followUp: daysSince(application.updatedAt) < 7,
  };
}

function loadPacketProgress(application: JobApplication): PacketProgress {
  const defaults = getDefaultPacketProgress(application);
  try {
    const raw = window.localStorage.getItem(getPacketStorageKey(application.id));
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as Partial<PacketProgress>) };
  } catch {
    return defaults;
  }
}

function savePacketProgress(applicationId: string, progress: PacketProgress) {
  try {
    window.localStorage.setItem(getPacketStorageKey(applicationId), JSON.stringify(progress));
  } catch {
    // Ignore storage failures; the packet remains usable for the current session.
  }
}

function buildFollowUpEmail(application: JobApplication) {
  const appliedDate = application.appliedDate ? formatDate(application.appliedDate) : '최근';
  return [
    `제목: ${application.position} 지원 건 확인 요청드립니다`,
    '',
    '안녕하세요.',
    '',
    `${appliedDate} ${application.company}의 ${application.position} 포지션에 지원한 지원자입니다.`,
    '채용 검토가 진행 중인지 확인 부탁드리며, 추가로 전달드릴 자료나 보완할 내용이 있다면 안내 부탁드립니다.',
    '',
    '바쁘신 중 확인해 주셔서 감사합니다.',
  ].join('\n');
}

function buildKeywordInsertionDraft(application: JobApplication, keywords: string[]) {
  const keywordList = keywords.slice(0, 5).join(', ');
  return [
    `[${application.company} · ${application.position}] 이력서 키워드 보강 초안`,
    '',
    `요약문 후보: ${application.position} 직무에서 요구하는 ${keywordList} 역량을 바탕으로 문제 정의부터 실행, 개선까지 주도한 경험이 있습니다.`,
    '',
    `스킬 섹션 추가 후보: ${keywordList}`,
    '',
    `경험 bullet 후보: ${keywordList}를 활용해 지원 직무와 관련된 문제를 분석하고, 실행 결과를 지표 기반으로 개선했습니다.`,
  ].join('\n');
}

interface ApplicationPacketProps {
  application: JobApplication;
  resume: ResumeSummary;
  coverLetterPath: string;
  interviewPath: string;
}

function ApplicationSearchInsights({ insights }: { insights: ApplicationSearchInsightSummary }) {
  return (
    <div className="home-readiness-insights" aria-label="지원 검색 성과 인사이트">
      <div
        className={`home-readiness-insights__focus home-readiness-insights__item--${insights.focus.tone}`}
      >
        <span className="home-readiness-insights__label">{insights.focus.label}</span>
        <strong className="home-readiness-insights__value">{insights.focus.value}</strong>
        <p className="home-readiness-insights__detail">{insights.focus.detail}</p>
      </div>
      <div className="home-readiness-insights__cards">
        {insights.cards.map((card) => (
          <div
            key={card.id}
            className={`home-readiness-insights__card home-readiness-insights__item--${card.tone}`}
          >
            <span className="home-readiness-insights__label">{card.label}</span>
            <strong className="home-readiness-insights__value">{card.value}</strong>
            <p className="home-readiness-insights__detail">{card.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationPacket({
  application,
  resume,
  coverLetterPath,
  interviewPath,
}: ApplicationPacketProps) {
  const [progress, setProgress] = useState<PacketProgress>(() => loadPacketProgress(application));
  const keywordSnapshot = useMemo(
    () => getKeywordMatchSnapshot(resume, application),
    [resume, application],
  );
  const networkingInsight = useMemo(
    () => getApplicationNetworkingInsight(application),
    [application],
  );
  const networkingSearchUrl = useMemo(() => buildNetworkingSearchUrl(application), [application]);

  useEffect(() => {
    setProgress(loadPacketProgress(application));
  }, [application]);

  const completedCount = useMemo(
    () => PACKET_TASKS.filter((task) => progress[task.id]).length,
    [progress],
  );

  const toggleTask = (taskId: PacketTaskId) => {
    setProgress((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      savePacketProgress(application.id, next);
      return next;
    });
  };

  const markTask = (taskId: PacketTaskId) => {
    setProgress((prev) => {
      const next = { ...prev, [taskId]: true };
      savePacketProgress(application.id, next);
      return next;
    });
  };

  const copyFollowUpEmail = async () => {
    const template = buildFollowUpEmail(application);
    try {
      await navigator.clipboard.writeText(template);
      markTask('followUp');
      toast('후속 메일 템플릿을 복사했습니다', 'success');
    } catch {
      toast('클립보드 복사에 실패했습니다', 'error');
    }
  };

  const downloadFollowUpReminder = () => {
    const event = buildFollowUpCalendarEvent(application);
    const blob = new Blob([event.ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = getFollowUpReminderFileName(application);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    markTask('followUp');
    toast(`${event.displayDate} 후속 리마인더를 내려받았습니다`, 'success');
  };

  const copyKeywordDraft = async () => {
    if (!keywordSnapshot?.missing.length) return;
    const draft = buildKeywordInsertionDraft(application, keywordSnapshot.missing);
    try {
      await navigator.clipboard.writeText(draft);
      markTask('resume');
      toast('누락 키워드 보강 초안을 복사했습니다', 'success');
    } catch {
      toast('클립보드 복사에 실패했습니다', 'error');
    }
  };

  const copyNetworkingMessage = async () => {
    try {
      await navigator.clipboard.writeText(buildRecruiterOutreachMessage(application));
      markTask('followUp');
      toast('네트워킹 메시지를 복사했습니다', 'success');
    } catch {
      toast('클립보드 복사에 실패했습니다', 'error');
    }
  };

  return (
    <div className="home-readiness-packet">
      <div className="home-readiness-packet__head">
        <div className="home-readiness-packet__lead">
          <span className="home-readiness-packet__eyebrow">Next focus</span>
          <h3 className="home-readiness-packet__title">
            {application.company} · {application.position}
          </h3>
          <p className="home-readiness-packet__meta">{getApplicationReason(application)}</p>
        </div>
        <span className="home-readiness-packet__progress" aria-label="패킷 준비 진행률">
          <strong>{completedCount}</strong>/{PACKET_TASKS.length} 준비
        </span>
      </div>

      <div className="home-readiness-packet__checklist" aria-label="지원 패킷 체크리스트">
        {PACKET_TASKS.map((task) => (
          <button
            key={task.id}
            type="button"
            className={`home-readiness-packet__task ${
              progress[task.id] ? 'home-readiness-packet__task--done' : ''
            }`}
            onClick={() => toggleTask(task.id)}
            aria-pressed={progress[task.id]}
          >
            <span aria-hidden="true">{progress[task.id] ? '✓' : '○'}</span>
            {task.label}
          </button>
        ))}
      </div>

      {keywordSnapshot && (
        <>
          <div className="home-readiness-packet__divider" aria-hidden="true" />
          <div className="home-readiness-packet__match" aria-label="키워드 매칭 스냅샷">
            <div className="home-readiness-packet__match-head">
              <span className="home-readiness-packet__match-label">키워드 매칭</span>
              <span className="home-readiness-packet__match-score">{keywordSnapshot.score}%</span>
            </div>
            <div className="home-readiness-packet__keywords">
              {keywordSnapshot.matched.slice(0, 3).map((keyword) => (
                <span key={`matched-${keyword}`} className="home-readiness-keyword--matched">
                  {keyword}
                </span>
              ))}
              {keywordSnapshot.missing.slice(0, 3).map((keyword) => (
                <span key={`missing-${keyword}`} className="home-readiness-keyword--missing">
                  + {keyword}
                </span>
              ))}
            </div>
            {keywordSnapshot.missing.length > 0 && (
              <button
                type="button"
                className="home-readiness-packet__keyword-action"
                onClick={copyKeywordDraft}
              >
                보강 문장 복사
              </button>
            )}
          </div>
        </>
      )}

      <div
        className={`home-readiness-packet__network home-readiness-packet__network--${networkingInsight.status}`}
        aria-label="네트워킹 연락선"
      >
        <div className="min-w-0">
          <span className="home-readiness-packet__network-title">{networkingInsight.label}</span>
          <p className="home-readiness-packet__network-detail">{networkingInsight.detail}</p>
          <small className="home-readiness-packet__network-cta">
            {networkingInsight.nextAction}
          </small>
        </div>
        {networkingInsight.contactHints.length > 0 && (
          <div className="home-readiness-packet__contacts" aria-label="감지된 연락 힌트">
            {networkingInsight.contactHints.slice(0, 2).map((hint) => (
              <code key={hint}>{hint}</code>
            ))}
          </div>
        )}
        <div className="home-readiness-packet__network-actions">
          <button type="button" onClick={copyNetworkingMessage}>
            메시지 복사
          </button>
          <a href={networkingSearchUrl} target="_blank" rel="noreferrer">
            담당자 찾기
          </a>
        </div>
      </div>

      <div className="home-readiness-packet__actions">
        <Link to={coverLetterPath}>자소서</Link>
        <Link to={interviewPath}>면접</Link>
        <button type="button" onClick={copyFollowUpEmail}>
          후속 메일
        </button>
        <button type="button" onClick={downloadFollowUpReminder}>
          리마인더
        </button>
        <Link to={ROUTES.jobs.applications}>트래커</Link>
      </div>
    </div>
  );
}

export default function ApplicationReadinessPanel({ resumes, applications = [] }: Props) {
  const latestResume = getLatestResume(resumes);
  if (!latestResume) return null;

  const latestDays = daysSince(latestResume.updatedAt);
  const applicationMomentum = getApplicationMomentum(applications);
  const searchInsights = buildApplicationSearchInsights(applications);
  const visibleResumeCount = resumes.filter(
    (resume) => resume.visibility === 'public' || resume.visibility === 'link-only',
  ).length;
  const taggedResumeCount = resumes.filter((resume) => resume.tags?.length > 0).length;
  const skillKeywordCount = getSkillKeywordCount(resumes);
  const hasSummary = resumes.some((resume) => resume.personalInfo?.summary?.trim());
  const hasOpenToWork = resumes.some((resume) => resume.isOpenToWork);
  const latestEditPath = ROUTES.resume.edit(latestResume.id);

  const signals: ReadinessSignal[] = [
    {
      id: 'keyword',
      label: '키워드 커버리지',
      value: `${skillKeywordCount}개`,
      detail:
        skillKeywordCount >= 8
          ? '스킬 키워드가 충분해 JD 매칭 분석에 쓰기 좋습니다.'
          : '스킬 섹션에 도구·도메인 키워드를 더 넣으면 JD 매칭 정확도가 올라갑니다.',
      complete: skillKeywordCount >= 8,
      weight: 18,
      to: latestEditPath,
      actionLabel: '스킬 보강',
    },
    {
      id: 'tailoring',
      label: '직무별 버전',
      value: resumes.length >= 2 ? `${resumes.length}개` : '1개',
      detail:
        resumes.length >= 2 || taggedResumeCount > 0
          ? '직무별 이력서나 태그가 있어 지원처별 맞춤 작업이 빠릅니다.'
          : '지원 직무별 복제본이나 태그를 만들면 Teal식 맞춤 지원 흐름에 가까워집니다.',
      complete: resumes.length >= 2 || taggedResumeCount > 0,
      weight: 16,
      to: latestEditPath,
      actionLabel: '버전 만들기',
    },
    {
      id: 'ats',
      label: 'ATS 점검',
      value: hasSummary ? '요약 있음' : '요약 필요',
      detail: hasSummary
        ? '요약문이 있어 ATS/리크루터가 핵심 역량을 빠르게 읽을 수 있습니다.'
        : '상단 요약문을 추가하면 Rezi·Jobscan식 구조 점검 기준을 더 잘 충족합니다.',
      complete: hasSummary,
      weight: 16,
      to: ROUTES.resume.review(latestResume.id),
      actionLabel: 'ATS 점검',
    },
    {
      id: 'freshness',
      label: '최근 업데이트',
      value: latestDays <= 14 ? '최신' : `${latestDays}일 전`,
      detail:
        latestDays <= 14
          ? '최근 업데이트된 이력서가 있어 바로 지원 전환하기 좋습니다.'
          : '최근 공고 기준으로 성과 문장과 키워드를 다시 맞춰보세요.',
      complete: latestDays <= 14,
      weight: 15,
      to: latestEditPath,
      actionLabel: '최신화',
    },
    {
      id: 'tracker',
      label: '지원 트래커',
      value:
        applicationMomentum.overdueCount > 0
          ? `마감초과 ${applicationMomentum.overdueCount}`
          : applicationMomentum.deadlineSoonCount > 0
            ? `마감 ${applicationMomentum.deadlineSoonCount}`
            : applicationMomentum.followUpDueCount > 0
              ? `후속 ${applicationMomentum.followUpDueCount}`
              : `${applicationMomentum.activeCount}건`,
      detail:
        applicationMomentum.activeCount === 0
          ? '관심 공고와 지원 내역을 기록하면 Huntr식 후속 조치 루틴을 만들 수 있습니다.'
          : applicationMomentum.overdueCount > 0
            ? '마감이 지난 진행 중 지원이 있습니다. 상태를 업데이트하거나 철회 처리하세요.'
            : applicationMomentum.deadlineSoonCount > 0
              ? '마감이 임박한 지원이 있습니다. 맞춤 이력서와 자소서를 먼저 마무리하세요.'
              : applicationMomentum.followUpDueCount > 0
                ? '일주일 이상 업데이트가 없는 진행 중 지원이 있어 후속 메모가 필요합니다.'
                : applicationMomentum.recentCount > 0
                  ? '최근 지원 활동이 기록되어 다음 상태 추적까지 이어가기 좋습니다.'
                  : '진행 중 지원이 있습니다. 다음 업데이트 날짜와 메모를 남겨두세요.',
      complete:
        applicationMomentum.activeCount > 0 &&
        applicationMomentum.followUpDueCount === 0 &&
        applicationMomentum.overdueCount === 0,
      weight: 20,
      to: ROUTES.jobs.applications,
      actionLabel:
        applicationMomentum.overdueCount > 0 || applicationMomentum.deadlineSoonCount > 0
          ? '마감 확인'
          : applicationMomentum.followUpDueCount > 0
            ? '후속 확인'
            : '지원 기록',
    },
    {
      id: 'visibility',
      label: '공유 준비',
      value: visibleResumeCount > 0 ? `${visibleResumeCount}개` : '비공개',
      detail:
        visibleResumeCount > 0 || hasOpenToWork
          ? '공개·링크 공유 또는 구직 상태가 준비되어 외부 전달이 쉽습니다.'
          : '링크 공유용 이력서를 하나 만들어 지원/피드백 동선을 줄이세요.',
      complete: visibleResumeCount > 0 || hasOpenToWork,
      weight: 15,
      to: latestEditPath,
      actionLabel: '공유 설정',
    },
  ];

  const score = Math.round(
    signals.reduce((sum, signal) => sum + (signal.complete ? signal.weight : 0), 0),
  );
  const nextSignal = signals.find((signal) => !signal.complete) ?? signals[0];
  const completedCount = signals.filter((signal) => signal.complete).length;
  const nextApplication = getNextApplication(applications);
  const nextApplicationResumeId = nextApplication?.resumeId || latestResume.id;
  const nextApplicationResume =
    resumes.find((resume) => resume.id === nextApplicationResumeId) || latestResume;
  const nextApplicationCoverLetterPath = nextApplication
    ? withQuery(ROUTES.coverLetter.new(nextApplicationResumeId), {
        company: nextApplication.company,
        position: nextApplication.position,
      })
    : '';
  const nextApplicationInterviewPath = nextApplication
    ? withQuery(ROUTES.interview.prep, {
        resumeId: nextApplicationResumeId,
        position: nextApplication.position,
        company: nextApplication.company,
      })
    : '';

  return (
    <section
      className="home-readiness-panel imp-card mb-6 overflow-hidden"
      aria-labelledby="home-readiness-title"
    >
      <div className="home-readiness-panel__head">
        <div className="min-w-0">
          <span className="home-readiness-panel__eyebrow">Today · 지원 준비도</span>
          <h2 id="home-readiness-title" className="home-readiness-panel__title">
            오늘 지원 전 준비도
          </h2>
          <p className="home-readiness-panel__lede">
            이력서 키워드, ATS 점검, 지원 활동, 마감 상태를 한 번에 확인합니다.
          </p>
        </div>
        <div className="home-readiness-panel__score" aria-label={`지원 준비도 ${score}점`}>
          <span className="home-readiness-panel__score-value">{score}</span>
          <span className="home-readiness-panel__score-suffix">/ 100</span>
        </div>
      </div>

      <div className="home-readiness-panel__meter" aria-hidden="true">
        <span style={getMeterStyle(score)} />
      </div>

      <div className="home-readiness-panel__summary">
        <span>
          신호 <strong>{completedCount}</strong> / {signals.length} 완료
        </span>
        <span>다음 추천 · {nextSignal.label}</span>
      </div>

      <div className="home-readiness-panel__body">
        {applications.length > 0 && (
          <div className="home-readiness-pipeline" aria-label="지원 활동 요약">
            <span className="home-readiness-pipeline__pill">
              진행 중 <strong>{applicationMomentum.activeCount}</strong>
            </span>
            <span className="home-readiness-pipeline__pill">
              최근 7일 <strong>{applicationMomentum.recentCount}</strong>
            </span>
            <span className="home-readiness-pipeline__pill">
              면접 <strong>{applicationMomentum.interviewCount}</strong>
            </span>
            {applicationMomentum.followUpDueCount > 0 && (
              <span className="home-readiness-pipeline__pill home-readiness-pipeline__pill--attention">
                후속 필요 <strong>{applicationMomentum.followUpDueCount}</strong>
              </span>
            )}
            {applicationMomentum.deadlineSoonCount > 0 && (
              <span className="home-readiness-pipeline__pill home-readiness-pipeline__pill--attention">
                마감 임박 <strong>{applicationMomentum.deadlineSoonCount}</strong>
              </span>
            )}
            {applicationMomentum.overdueCount > 0 && (
              <span className="home-readiness-pipeline__pill home-readiness-pipeline__pill--danger">
                마감 초과 <strong>{applicationMomentum.overdueCount}</strong>
              </span>
            )}
          </div>
        )}

        {searchInsights && <ApplicationSearchInsights insights={searchInsights} />}

        {nextApplication && (
          <ApplicationPacket
            application={nextApplication}
            resume={nextApplicationResume}
            coverLetterPath={nextApplicationCoverLetterPath}
            interviewPath={nextApplicationInterviewPath}
          />
        )}

        <div className="home-readiness-panel__signals">
          {signals.map((signal) => (
            <Link
              key={signal.id}
              to={signal.to}
              className={`home-readiness-signal ${signal.complete ? 'home-readiness-signal--complete' : ''}`}
            >
              <span className="home-readiness-signal__mark" aria-hidden="true">
                {signal.complete ? '✓' : '○'}
              </span>
              <div className="home-readiness-signal__body">
                <div className="home-readiness-signal__head">
                  <span className="home-readiness-signal__label">{signal.label}</span>
                  <span className="home-readiness-signal__value">{signal.value}</span>
                </div>
                <p className="home-readiness-signal__detail">{signal.detail}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="home-readiness-panel__actions">
          <Link to={nextSignal.to} className="home-readiness-primary-action">
            {nextSignal.actionLabel}
          </Link>
          <Link to={ROUTES.jobs.applications} className="home-readiness-secondary-action">
            지원 관리
          </Link>
          <Link to={ROUTES.interview.prep} className="home-readiness-secondary-action">
            면접 준비
          </Link>
        </div>
      </div>
    </section>
  );
}
