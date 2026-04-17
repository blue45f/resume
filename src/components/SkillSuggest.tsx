import { useState, useEffect } from 'react';

/** Static skill relationship map - zero LLM cost */
const SKILL_RELATIONS: Record<string, string[]> = {
  'react': ['TypeScript', 'Next.js', 'Redux', 'React Query', 'Zustand', 'Tailwind CSS'],
  'vue': ['Nuxt.js', 'Vuex', 'Pinia', 'TypeScript', 'Vite'],
  'angular': ['TypeScript', 'RxJS', 'NgRx', 'Jasmine'],
  'typescript': ['JavaScript', 'Node.js', 'ESLint', 'Jest'],
  'javascript': ['TypeScript', 'Node.js', 'React', 'Vue'],
  'node.js': ['Express', 'NestJS', 'TypeScript', 'MongoDB', 'PostgreSQL'],
  'nestjs': ['TypeScript', 'Prisma', 'PostgreSQL', 'JWT', 'Swagger'],
  'python': ['Django', 'FastAPI', 'Flask', 'Pandas', 'NumPy'],
  'java': ['Spring Boot', 'JPA', 'Hibernate', 'Gradle', 'JUnit'],
  'spring': ['Spring Boot', 'JPA', 'MyBatis', 'Gradle', 'Java'],
  'spring boot': ['JPA', 'Spring Security', 'Redis', 'Kafka'],
  'kotlin': ['Spring Boot', 'Coroutines', 'Ktor', 'Android'],
  'go': ['Gin', 'gRPC', 'Docker', 'Kubernetes'],
  'rust': ['Actix', 'Tokio', 'WebAssembly', 'Cargo'],
  'docker': ['Kubernetes', 'Docker Compose', 'CI/CD', 'AWS ECS'],
  'kubernetes': ['Docker', 'Helm', 'ArgoCD', 'Istio', 'Terraform'],
  'aws': ['EC2', 'S3', 'Lambda', 'RDS', 'CloudFront', 'ECS'],
  'gcp': ['GKE', 'Cloud Run', 'BigQuery', 'Firestore'],
  'postgresql': ['Prisma', 'TypeORM', 'Sequelize', 'Redis'],
  'mongodb': ['Mongoose', 'Node.js', 'Redis', 'Express'],
  'mysql': ['JPA', 'MyBatis', 'Sequelize', 'Prisma'],
  'redis': ['Node.js', 'Spring', 'Celery', 'Pub/Sub'],
  'graphql': ['Apollo', 'TypeGraphQL', 'Relay', 'Hasura'],
  'flutter': ['Dart', 'Firebase', 'Riverpod', 'GetX'],
  'swift': ['SwiftUI', 'UIKit', 'Combine', 'CoreData'],
  'figma': ['Sketch', 'Adobe XD', 'Zeplin', 'Storybook'],
  'tailwind': ['PostCSS', 'CSS Modules', 'styled-components'],
  'terraform': ['Ansible', 'CloudFormation', 'Pulumi', 'AWS'],
  'kafka': ['RabbitMQ', 'Redis Streams', 'Event Sourcing'],
  'elasticsearch': ['Kibana', 'Logstash', 'OpenSearch'],
  'ci/cd': ['GitHub Actions', 'Jenkins', 'GitLab CI', 'ArgoCD'],
  'git': ['GitHub', 'GitLab', 'Bitbucket', 'Git Flow'],
};

/** Company to common roles map */
const COMPANY_ROLES: Record<string, string[]> = {
  '네이버': ['프론트엔드 엔지니어', '백엔드 엔지니어', 'AI/ML 엔지니어', '데이터 엔지니어', 'QA 엔지니어', 'SRE'],
  '카카오': ['서버 개발자', '프론트엔드 개발자', 'iOS 개발자', 'Android 개발자', '데이터 사이언티스트'],
  '라인': ['서버사이드 엔지니어', '프론트엔드 엔지니어', '보안 엔지니어', 'SRE'],
  '쿠팡': ['소프트웨어 엔지니어', '프론트엔드 엔지니어', '데이터 엔지니어', 'DevOps 엔지니어'],
  '배달의민족': ['서버 개발자', '웹 프론트엔드 개발자', 'Android 개발자', 'iOS 개발자', 'DBA'],
  '우아한형제들': ['서버 개발자', '웹 프론트엔드 개발자', 'Android 개발자', 'iOS 개발자', 'DBA'],
  '토스': ['Server Developer', 'Frontend Developer', 'iOS Developer', 'Android Developer', 'Data Engineer'],
  '비바리퍼블리카': ['Server Developer', 'Frontend Developer', 'iOS Developer', 'Android Developer'],
  '당근': ['백엔드 엔지니어', '프론트엔드 엔지니어', 'ML 엔지니어', 'SRE'],
  '당근마켓': ['백엔드 엔지니어', '프론트엔드 엔지니어', 'ML 엔지니어', 'SRE'],
  'samsung': ['Software Engineer', 'Embedded Engineer', 'AI Researcher'],
  '삼성전자': ['SW 엔지니어', '임베디드 개발자', 'AI 연구원', 'ASIC 설계'],
  'lg': ['Software Engineer', 'Data Scientist', 'DevOps Engineer'],
  'sk': ['백엔드 개발자', '프론트엔드 개발자', '클라우드 엔지니어', 'AI 엔지니어'],
  'google': ['Software Engineer', 'Site Reliability Engineer', 'Product Manager'],
  'amazon': ['Software Development Engineer', 'Data Engineer', 'Solutions Architect'],
  'microsoft': ['Software Engineer', 'Program Manager', 'Data Scientist'],
  'apple': ['Software Engineer', 'Machine Learning Engineer', 'UI Engineer'],
  'meta': ['Software Engineer', 'Production Engineer', 'Research Scientist'],
};

function findRelatedSkills(currentItems: string): string[] {
  const existing = currentItems.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const suggestions = new Set<string>();

  for (const item of existing) {
    const related = SKILL_RELATIONS[item];
    if (related) {
      for (const r of related) {
        if (!existing.includes(r.toLowerCase())) {
          suggestions.add(r);
        }
      }
    }
  }
  return [...suggestions].slice(0, 5);
}

function findRolesForCompany(company: string): string[] {
  const lower = company.toLowerCase().trim();
  for (const [key, roles] of Object.entries(COMPANY_ROLES)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return roles;
    }
  }
  return [];
}

/** Inline skill suggestions dropdown */
export function SkillSuggestDropdown({ currentItems, onAdd }: { currentItems: string; onAdd: (skill: string) => void }) {
  const [dismissed, setDismissed] = useState(false);
  const suggestions = findRelatedSkills(currentItems);

  if (dismissed || suggestions.length === 0 || currentItems.trim().length < 2) return null;

  // Determine which skill triggered suggestions
  const existing = currentItems.split(',').map(s => s.trim()).filter(Boolean);
  const lastSkill = existing[existing.length - 1] || '';

  return (
    <div className="mt-1.5 p-2.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg animate-fade-in w-full overflow-hidden">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-xs text-purple-700 dark:text-purple-300 flex-1 min-w-0 break-words">
          <span className="font-medium">{lastSkill}</span>을(를) 입력하셨습니다. 관련 기술도 추가하시겠습니까?
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="p-0.5 text-purple-400 hover:text-purple-600 transition-colors shrink-0"
          aria-label="닫기"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map(skill => (
          <button
            key={skill}
            type="button"
            onClick={() => onAdd(skill)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {skill}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Company-based role suggestions */
export function CompanyRoleSuggest({ company, onSelect }: { company: string; onSelect: (role: string) => void }) {
  const [dismissed, setDismissed] = useState(false);
  const [prevCompany, setPrevCompany] = useState(company);
  const roles = findRolesForCompany(company);

  // Reset dismissed when company changes
  useEffect(() => {
    if (company !== prevCompany) {
      setDismissed(false);
      setPrevCompany(company);
    }
  }, [company, prevCompany]);

  if (dismissed || roles.length === 0 || company.trim().length < 2) return null;

  return (
    <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg animate-fade-in w-full overflow-hidden">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium flex-1 min-w-0 truncate">{company}의 일반적인 직위:</p>
        <button
          onClick={() => setDismissed(true)}
          className="p-0.5 text-blue-400 hover:text-blue-600 transition-colors shrink-0"
          aria-label="닫기"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {roles.map(role => (
          <button
            key={role}
            type="button"
            onClick={() => { onSelect(role); setDismissed(true); }}
            className="px-2 py-0.5 text-xs text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Inline content quality tip for short descriptions */
export function InlineContentTip({ text, section }: { text: string; section: 'experience' | 'project' | 'summary' }) {
  const plain = (text || '').replace(/<[^>]*>/g, '').trim();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || plain.length === 0 || plain.length >= 50) return null;

  const tips: Record<string, { message: string; template: string }> = {
    experience: {
      message: '이 경력에 대해 더 자세히 작성해보세요',
      template: '- [상황] OO 프로젝트에서\n- [과제] OO 문제를 해결하기 위해\n- [행동] OO 기술로 OO을 구현하여\n- [결과] OO% 개선/달성',
    },
    project: {
      message: '프로젝트 설명을 더 구체적으로 작성해보세요',
      template: '- 프로젝트 배경 및 목표\n- 본인의 역할과 기여\n- 사용 기술 및 아키텍처\n- 정량적 성과',
    },
    summary: {
      message: '자기소개를 더 풍부하게 작성해보세요',
      template: '- 핵심 역량 (예: N년 경력의 OO 전문가)\n- 주요 성과 1~2개\n- 기술 스택 요약\n- 커리어 목표',
    },
  };

  const tip = tips[section];
  if (!tip) return null;

  return (
    <div className="mt-1.5 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg animate-fade-in w-full overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{tip.message}</span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1.5">STAR 기법으로 작성하면 더 효과적입니다:</p>
          <pre className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/30 p-2 rounded whitespace-pre-wrap font-sans leading-relaxed">{tip.template}</pre>
          {/* Mini score */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-amber-600 dark:text-amber-400">섹션 점수:</span>
            <div className="flex-1 h-1 bg-amber-200 dark:bg-amber-800 rounded-full max-w-[80px]">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(Math.round((plain.length / 50) * 100), 100)}%` }} />
            </div>
            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">{Math.min(Math.round((plain.length / 50) * 100), 100)}/100</span>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-0.5 text-amber-400 hover:text-amber-600 transition-colors shrink-0"
          aria-label="닫기"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
