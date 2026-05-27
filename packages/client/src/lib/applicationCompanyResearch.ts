import type { JobApplication } from './api';

export type CompanyResearchGrade = 'strong' | 'usable' | 'thin';

export interface CompanyResearchCheck {
  id: string;
  label: string;
  detail: string;
  complete: boolean;
  weight: number;
}

export interface CompanyResearchLink {
  label: string;
  url: string;
}

export interface CompanyResearchBrief {
  score: number;
  grade: CompanyResearchGrade;
  label: string;
  nextAction: string;
  checks: CompanyResearchCheck[];
  links: CompanyResearchLink[];
  interviewAngles: string[];
}

const COMPANY_SIGNAL_PATTERN =
  /제품|서비스|문화|투자|뉴스|매출|성장|경쟁|전략|비전|미션|시장|고객|조직|팀/i;
const INTERVIEW_SIGNAL_PATTERN = /면접|질문|STAR|답변|사례|프로젝트|성과|기여|협업|문제/i;

const cleanText = (value?: string | null, fallback = '') => value?.trim() || fallback;

const makeSearchUrl = (query: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;

const getGrade = (score: number): CompanyResearchGrade => {
  if (score >= 80) return 'strong';
  if (score >= 50) return 'usable';
  return 'thin';
};

const getLabel = (grade: CompanyResearchGrade) => {
  if (grade === 'strong') return '리서치 충분';
  if (grade === 'usable') return '리서치 보완';
  return '리서치 부족';
};

const getNextAction = (checks: CompanyResearchCheck[]) => {
  const missing = checks.find((check) => !check.complete);
  if (!missing) return '회사 맥락과 면접 포인트가 충분합니다. 답변 스토리만 정리하세요.';
  if (missing.id === 'posting-context')
    return '공고 원문 URL 또는 JD 핵심 내용을 메모에 저장하세요.';
  if (missing.id === 'company-signals')
    return '회사 제품, 최근 뉴스, 시장/경쟁 구도를 2~3줄로 정리하세요.';
  if (missing.id === 'interview-angles')
    return '면접에서 물어볼 질문과 연결할 성과 사례를 메모하세요.';
  return missing.detail;
};

export const buildCompanyResearchBrief = (
  application: Pick<JobApplication, 'company' | 'position' | 'url' | 'location' | 'notes'>,
): CompanyResearchBrief => {
  const company = cleanText(application.company, '지원 기업');
  const position = cleanText(application.position, '지원 포지션');
  const notes = application.notes || '';
  const hasPostingContext = Boolean(application.url?.trim()) || notes.length >= 80;
  const hasCompanySignals = COMPANY_SIGNAL_PATTERN.test(notes);
  const hasInterviewAngles = INTERVIEW_SIGNAL_PATTERN.test(notes);

  const checks: CompanyResearchCheck[] = [
    {
      id: 'posting-context',
      label: '공고 원문',
      detail: '공고 URL 또는 JD 핵심 내용이 저장되어 있어야 비교/복기가 가능합니다.',
      complete: hasPostingContext,
      weight: 34,
    },
    {
      id: 'company-signals',
      label: '회사 맥락',
      detail: '제품, 시장, 뉴스, 문화, 경쟁사 중 하나 이상을 메모하세요.',
      complete: hasCompanySignals,
      weight: 33,
    },
    {
      id: 'interview-angles',
      label: '면접 각도',
      detail: '면접 질문, 성과 사례, 기여 포인트를 회사 맥락과 연결하세요.',
      complete: hasInterviewAngles,
      weight: 33,
    },
  ];
  const score = checks.reduce((sum, check) => sum + (check.complete ? check.weight : 0), 0);
  const grade = getGrade(score);

  return {
    score,
    grade,
    label: getLabel(grade),
    nextAction: getNextAction(checks),
    checks,
    links: [
      { label: '회사 뉴스', url: makeSearchUrl(`${company} 최근 뉴스`) },
      { label: '채용/팀 정보', url: makeSearchUrl(`${company} ${position} 채용 팀`) },
      { label: '면접 후기', url: makeSearchUrl(`${company} ${position} 면접 후기`) },
    ],
    interviewAngles: [
      `${company}가 이 포지션에서 해결하려는 문제는 무엇인가?`,
      `${position} 역할에서 바로 증명할 수 있는 내 성과 사례는 무엇인가?`,
      application.location
        ? `${application.location} 근무/협업 환경에서 확인해야 할 조건은 무엇인가?`
        : '팀 운영 방식과 협업 프로세스에서 확인해야 할 조건은 무엇인가?',
    ],
  };
};
