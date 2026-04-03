import { useState } from 'react';

/** Pre-written content suggestions by job title (LiveCareer-inspired) */

interface SuggestionCategory {
  label: string;
  items: string[];
}

interface JobSuggestions {
  title: string;
  categories: SuggestionCategory[];
}

const JOB_SUGGESTIONS: JobSuggestions[] = [
  {
    title: '프론트엔드 개발자',
    categories: [
      { label: '업무 설명', items: [
        'React/TypeScript 기반 SPA 개발 및 유지보수',
        '디자인 시스템 구축 및 재사용 가능한 컴포넌트 라이브러리 개발',
        'REST API 및 GraphQL 연동을 통한 데이터 처리 로직 구현',
        'Webpack/Vite 빌드 최적화 및 CI/CD 파이프라인 구성',
      ]},
      { label: '성과', items: [
        'Core Web Vitals 전 항목 Good 달성, LCP 40% 개선',
        '페이지 로딩 속도 2.5초에서 0.8초로 단축',
        '코드 리뷰 문화 도입으로 버그 발생률 30% 감소',
      ]},
      { label: '기술 스택', items: [
        'React, Next.js, TypeScript, Tailwind CSS, Redux',
        'Jest, Cypress, Storybook, Figma',
        'Git, GitHub Actions, Docker, AWS CloudFront',
      ]},
    ],
  },
  {
    title: '백엔드 개발자',
    categories: [
      { label: '업무 설명', items: [
        'Node.js/NestJS 기반 RESTful API 설계 및 개발',
        'PostgreSQL/MySQL 데이터베이스 설계 및 쿼리 최적화',
        'MSA 아키텍처 전환 및 서비스 간 통신 설계',
        'Redis 캐싱 전략 수립 및 적용으로 응답 속도 개선',
      ]},
      { label: '성과', items: [
        'API 응답 시간 평균 200ms에서 50ms로 75% 개선',
        '서버 비용 40% 절감을 위한 인프라 최적화 수행',
        '일일 100만 요청 처리 가능한 확장 가능한 시스템 구축',
      ]},
      { label: '기술 스택', items: [
        'Node.js, NestJS, Express, TypeScript',
        'PostgreSQL, MongoDB, Redis, Elasticsearch',
        'Docker, Kubernetes, AWS (EC2, RDS, Lambda)',
      ]},
    ],
  },
  {
    title: '풀스택 개발자',
    categories: [
      { label: '업무 설명', items: [
        '프론트엔드부터 백엔드, 배포까지 전체 개발 사이클 담당',
        'Next.js SSR/SSG 기반 웹 애플리케이션 개발',
        'Prisma ORM을 활용한 데이터 모델링 및 API 개발',
        'Vercel/AWS 기반 배포 자동화 및 모니터링 구축',
      ]},
      { label: '성과', items: [
        'MVP 2주 내 단독 출시, 월간 사용자 5,000명 달성',
        'SEO 최적화로 오가닉 트래픽 200% 증가',
        '테스트 커버리지 85% 달성으로 배포 안정성 확보',
      ]},
      { label: '기술 스택', items: [
        'React, Next.js, Node.js, TypeScript',
        'PostgreSQL, Prisma, Redis, GraphQL',
        'Docker, Vercel, GitHub Actions, Terraform',
      ]},
    ],
  },
  {
    title: 'UI/UX 디자이너',
    categories: [
      { label: '업무 설명', items: [
        '사용자 리서치 및 페르소나 기반 UX 전략 수립',
        'Figma를 활용한 와이어프레임, 프로토타입, UI 디자인',
        '디자인 시스템 및 컴포넌트 가이드라인 문서화',
        'A/B 테스트 기획 및 분석을 통한 전환율 최적화',
      ]},
      { label: '성과', items: [
        '회원가입 전환율 35% 향상 (UX 개선 프로젝트)',
        '디자인 시스템 도입으로 디자인-개발 협업 시간 50% 단축',
        'NPS 점수 45에서 72로 개선',
      ]},
      { label: '기술 스택', items: [
        'Figma, Sketch, Adobe XD, Illustrator, Photoshop',
        'Maze, Hotjar, Google Analytics, Mixpanel',
        'Principle, ProtoPie, After Effects',
      ]},
    ],
  },
  {
    title: '데이터 분석가',
    categories: [
      { label: '업무 설명', items: [
        'Python/SQL 기반 데이터 분석 및 인사이트 도출',
        'Tableau/Looker를 활용한 대시보드 구축 및 리포팅',
        'A/B 테스트 설계, 실행, 통계적 유의성 검증',
        '비즈니스 KPI 정의 및 데이터 기반 의사결정 지원',
      ]},
      { label: '성과', items: [
        '데이터 기반 의사결정으로 마케팅 ROI 25% 향상',
        '자동화 리포팅 시스템 구축으로 주간 보고 시간 80% 단축',
        '이탈 예측 모델 개발로 고객 유지율 15% 개선',
      ]},
      { label: '기술 스택', items: [
        'Python, SQL, R, Pandas, NumPy',
        'Tableau, Looker, Google Data Studio',
        'BigQuery, Redshift, Airflow, dbt',
      ]},
    ],
  },
  {
    title: '프로덕트 매니저',
    categories: [
      { label: '업무 설명', items: [
        '제품 로드맵 수립 및 우선순위 관리 (RICE/ICE 프레임워크)',
        '사용자 인터뷰 및 정량/정성 데이터 기반 요구사항 정의',
        'PRD 작성 및 개발팀, 디자인팀과의 크로스펑셔널 협업',
        '스프린트 플래닝 및 애자일 프로세스 리드',
      ]},
      { label: '성과', items: [
        '신규 기능 출시로 MAU 30% 증가, 매출 20% 성장',
        '사용자 피드백 루프 구축으로 기능 채택률 2배 향상',
        'OKR 기반 목표 관리 체계 도입 및 팀 성과 가시화',
      ]},
      { label: '기술 스택', items: [
        'Jira, Confluence, Notion, Linear',
        'Amplitude, Mixpanel, Google Analytics',
        'Figma, Miro, SQL (기본 데이터 조회)',
      ]},
    ],
  },
  {
    title: '마케터',
    categories: [
      { label: '업무 설명', items: [
        '퍼포먼스 마케팅 전략 수립 및 캠페인 운영 (Google/Meta Ads)',
        'SEO/SEM 전략 수립 및 콘텐츠 최적화',
        'CRM 마케팅 자동화 구축 및 고객 세그먼트 관리',
        'SNS 채널 운영 및 인플루언서 마케팅 기획',
      ]},
      { label: '성과', items: [
        'ROAS 350% 달성, CPA 40% 절감',
        'SEO 최적화로 오가닉 트래픽 월 50만 달성',
        'CRM 자동화로 이메일 오픈율 25%에서 42%로 개선',
      ]},
      { label: '기술 스택', items: [
        'Google Ads, Meta Ads, Google Analytics 4',
        'HubSpot, Mailchimp, Braze',
        'Google Search Console, SEMrush, Ahrefs',
      ]},
    ],
  },
  {
    title: '인사/HR',
    categories: [
      { label: '업무 설명', items: [
        '채용 프로세스 설계 및 인재 확보 전략 수립',
        '성과 평가 제도 운영 및 보상 체계 관리',
        '온보딩 프로그램 기획 및 사내 교육 체계 구축',
        '조직 문화 개선 프로젝트 기획 및 실행',
      ]},
      { label: '성과', items: [
        '연간 채용 목표 120% 달성 (50명 규모)',
        '직원 만족도 조사 점수 3.2에서 4.1로 개선',
        '퇴직률 25%에서 12%로 감소',
      ]},
      { label: '기술 스택', items: [
        'Workday, SAP SuccessFactors, 그리팅',
        'Google Workspace, Notion, Slack',
        'Excel (고급), HRIS 시스템 운용',
      ]},
    ],
  },
  {
    title: '영업/세일즈',
    categories: [
      { label: '업무 설명', items: [
        'B2B/B2C 신규 고객 발굴 및 계약 체결',
        '고객 니즈 분석 및 맞춤형 솔루션 제안',
        'CRM 기반 고객 관계 관리 및 파이프라인 운영',
        '영업 전략 수립 및 분기별 매출 목표 달성',
      ]},
      { label: '성과', items: [
        '분기별 매출 목표 130% 달성 (팀 1위)',
        '신규 거래처 20개 개척, 연간 매출 5억원 달성',
        '고객 재계약률 95% 유지',
      ]},
      { label: '기술 스택', items: [
        'Salesforce, HubSpot CRM, Pipedrive',
        'Excel, PowerPoint, Google Slides',
        'Zoom, Teams, Calendly',
      ]},
    ],
  },
  {
    title: 'DevOps 엔지니어',
    categories: [
      { label: '업무 설명', items: [
        'CI/CD 파이프라인 설계 및 자동화 (GitHub Actions, Jenkins)',
        'Kubernetes 클러스터 운영 및 컨테이너 오케스트레이션',
        'Terraform/Ansible 기반 IaC 구현 및 인프라 관리',
        '모니터링/알림 시스템 구축 (Prometheus, Grafana, PagerDuty)',
      ]},
      { label: '성과', items: [
        '배포 주기 월 1회에서 일 3회로 단축 (CI/CD 자동화)',
        '서비스 가용성 99.95% → 99.99% 달성',
        '인프라 비용 35% 절감 (스팟 인스턴스, 오토스케일링 적용)',
      ]},
      { label: '기술 스택', items: [
        'Docker, Kubernetes, Terraform, Ansible',
        'AWS (EKS, ECR, S3, CloudWatch), GCP',
        'GitHub Actions, Jenkins, ArgoCD, Helm',
      ]},
    ],
  },
  {
    title: '모바일 개발자',
    categories: [
      { label: '업무 설명', items: [
        'React Native/Flutter 기반 크로스플랫폼 앱 개발',
        'iOS/Android 네이티브 기능 연동 및 성능 최적화',
        'Push 알림, 딥링크, 인앱 결제 등 핵심 기능 구현',
        'App Store/Google Play 배포 및 버전 관리',
      ]},
      { label: '성과', items: [
        '앱 스토어 평점 4.2에서 4.7로 개선',
        '앱 실행 시간 3초에서 1.2초로 60% 단축',
        '월간 크래시 프리 율 99.5% 달성',
      ]},
      { label: '기술 스택', items: [
        'React Native, Flutter, Swift, Kotlin',
        'Firebase, Fastlane, CodePush',
        'Redux, MobX, Riverpod, SQLite',
      ]},
    ],
  },
  {
    title: '데이터 엔지니어',
    categories: [
      { label: '업무 설명', items: [
        'ETL/ELT 파이프라인 설계 및 데이터 웨어하우스 구축',
        'Spark/Airflow 기반 대규모 데이터 처리 시스템 운영',
        '실시간 스트리밍 데이터 처리 (Kafka, Flink)',
        '데이터 품질 모니터링 및 거버넌스 체계 구축',
      ]},
      { label: '성과', items: [
        '일일 10TB 데이터 처리 파이프라인 안정 운영',
        '데이터 처리 시간 8시간에서 45분으로 단축',
        '데이터 품질 이슈 90% 감소 (자동 검증 시스템)',
      ]},
      { label: '기술 스택', items: [
        'Python, Scala, SQL, Apache Spark',
        'Airflow, Kafka, Flink, dbt',
        'BigQuery, Snowflake, Redshift, S3',
      ]},
    ],
  },
];

interface ContentSuggestionsProps {
  jobTitle: string;
  onInsert: (text: string) => void;
}

export default function ContentSuggestions({ jobTitle, onInsert }: ContentSuggestionsProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedJob, setSelectedJob] = useState(jobTitle || '');

  // Find matching suggestions (partial match)
  const matchedJob = JOB_SUGGESTIONS.find(j =>
    selectedJob && (
      j.title.includes(selectedJob) ||
      selectedJob.includes(j.title) ||
      j.title.toLowerCase().includes(selectedJob.toLowerCase())
    )
  );

  return (
    <div className="border border-amber-200 dark:border-amber-800 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">직종별 문구 추천</span>
        </div>
        <svg className={`w-4 h-4 text-amber-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Job selector */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">직종 선택</label>
            <select
              value={selectedJob}
              onChange={e => setSelectedJob(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-amber-200 dark:border-amber-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">직종을 선택하세요</option>
              {JOB_SUGGESTIONS.map(j => (
                <option key={j.title} value={j.title}>{j.title}</option>
              ))}
            </select>
          </div>

          {/* Suggestions */}
          {matchedJob ? (
            <div className="space-y-3">
              {matchedJob.categories.map(cat => (
                <div key={cat.label}>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {cat.label}
                  </h4>
                  <div className="space-y-1">
                    {cat.items.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onInsert(item)}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex-1">{item}</span>
                          <span className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium shrink-0 mt-0.5">
                            + 삽입
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : selectedJob ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
              해당 직종의 추천 문구가 없습니다. 다른 직종을 선택해주세요.
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
              직종을 선택하면 추천 문구를 확인할 수 있습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Exported job titles list for use in wizard */
export const JOB_TITLE_LIST = JOB_SUGGESTIONS.map(j => j.title);
