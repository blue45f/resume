import type { Resume } from '@/types/resume';

export interface JdMatchResult {
  /** 이력서에 이미 있는 키워드 */
  matched: string[];
  /** JD 에 있지만 이력서엔 없는 키워드 */
  missing: string[];
  /** 매칭률 0-100 */
  matchRate: number;
  /** 추출된 총 JD 키워드 수 */
  totalKeywords: number;
}

/**
 * JD 텍스트에서 의미있는 키워드를 추출해 이력서와 교집합 계산.
 * LLM 없이 정규식·화이트리스트로 기술·도구·프레임워크·도메인 단어 추출.
 */
export function analyzeJdMatch(jdText: string, resume: Resume): JdMatchResult {
  if (!jdText.trim()) {
    return { matched: [], missing: [], matchRate: 0, totalKeywords: 0 };
  }

  const jdKeywords = extractKeywords(jdText);
  const resumeText = collectResumeText(resume).toLowerCase();

  const matched: string[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const kw of jdKeywords) {
    const lower = kw.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);

    if (containsKeyword(resumeText, lower)) matched.push(kw);
    else missing.push(kw);
  }

  const total = matched.length + missing.length;
  const matchRate = total > 0 ? Math.round((matched.length / total) * 100) : 0;

  return {
    matched: matched.sort((a, b) => a.localeCompare(b)),
    missing: missing.sort((a, b) => a.localeCompare(b)),
    matchRate,
    totalKeywords: total,
  };
}

/**
 * 기술·도구·프레임워크 화이트리스트 — 자주 나오는 키워드만 추출.
 * 너무 일반적인 단어(개발/서비스 등)는 제외해서 시그널 높이기.
 */
const TECH_KEYWORDS = [
  // Languages
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'Kotlin',
  'Swift',
  'Go',
  'Rust',
  'C++',
  'C#',
  'Ruby',
  'PHP',
  'Scala',
  'Dart',
  'Elixir',
  'SQL',
  'HTML',
  'CSS',
  // Frontend
  'React',
  'Vue',
  'Angular',
  'Svelte',
  'Next.js',
  'Nuxt',
  'Remix',
  'SolidJS',
  'Astro',
  'Redux',
  'Zustand',
  'MobX',
  'Tailwind',
  'Bootstrap',
  'Material-UI',
  'Emotion',
  'styled-components',
  'CSS-in-JS',
  'SCSS',
  'SASS',
  'Less',
  // Backend
  'Node.js',
  'Express',
  'Fastify',
  'NestJS',
  'Koa',
  'Deno',
  'Bun',
  'Django',
  'Flask',
  'FastAPI',
  'Spring',
  'Spring Boot',
  'Rails',
  'Laravel',
  'Gin',
  'Fiber',
  '.NET',
  'ASP.NET',
  // Database
  'PostgreSQL',
  'MySQL',
  'MariaDB',
  'MongoDB',
  'Redis',
  'Memcached',
  'Elasticsearch',
  'DynamoDB',
  'Cassandra',
  'SQLite',
  'Oracle',
  'MSSQL',
  'Neo4j',
  'InfluxDB',
  'BigQuery',
  'Snowflake',
  'Redshift',
  // Cloud/Infra
  'AWS',
  'Azure',
  'GCP',
  'Google Cloud',
  'Cloudflare',
  'Vercel',
  'Netlify',
  'Heroku',
  'Digital Ocean',
  'Docker',
  'Kubernetes',
  'K8s',
  'Helm',
  'Terraform',
  'Ansible',
  'Pulumi',
  'CloudFormation',
  'EC2',
  'S3',
  'Lambda',
  'ECS',
  'EKS',
  'CloudFront',
  'Route53',
  'RDS',
  'Aurora',
  'ElastiCache',
  // DevOps/Tools
  'Git',
  'GitHub',
  'GitLab',
  'Bitbucket',
  'Jenkins',
  'CircleCI',
  'GitHub Actions',
  'Travis',
  'ArgoCD',
  'FluxCD',
  'Prometheus',
  'Grafana',
  'Datadog',
  'Sentry',
  'Splunk',
  'New Relic',
  'PagerDuty',
  'Jira',
  'Confluence',
  'Notion',
  'Slack',
  'Figma',
  'Sketch',
  'Adobe XD',
  'Zeplin',
  // Data/ML
  'TensorFlow',
  'PyTorch',
  'Keras',
  'scikit-learn',
  'NumPy',
  'Pandas',
  'Jupyter',
  'Airflow',
  'Spark',
  'Hadoop',
  'Kafka',
  'RabbitMQ',
  'NATS',
  'LangChain',
  'OpenAI',
  'Anthropic',
  'Hugging Face',
  'LLM',
  'RAG',
  'Vector DB',
  'Pinecone',
  'Chroma',
  'Weaviate',
  // Testing
  'Jest',
  'Vitest',
  'Cypress',
  'Playwright',
  'Selenium',
  'Mocha',
  'JUnit',
  'pytest',
  'Testing Library',
  'Storybook',
  // Mobile
  'React Native',
  'Flutter',
  'SwiftUI',
  'Jetpack Compose',
  'Android',
  'iOS',
  'Xamarin',
  'Expo',
  // API/Protocols
  'GraphQL',
  'REST',
  'gRPC',
  'WebSocket',
  'Webhook',
  'OAuth',
  'JWT',
  'OpenAPI',
  'Swagger',
  'Postman',
  'tRPC',
  // Methodology
  'Agile',
  'Scrum',
  'Kanban',
  'TDD',
  'BDD',
  'DDD',
  'CI/CD',
  'DevOps',
  'SRE',
  'MSA',
  'Microservices',
  'Monorepo',
  'MVC',
  'MVVM',
];

/** 한국 직무·도메인 키워드 */
const KO_DOMAIN_KEYWORDS = [
  '프론트엔드',
  '백엔드',
  '풀스택',
  '모바일',
  '데이터',
  '머신러닝',
  '인공지능',
  'DevOps',
  'SRE',
  '보안',
  '블록체인',
  '게임',
  '커머스',
  '핀테크',
  '헬스케어',
  '에듀테크',
  'SaaS',
  'B2B',
  'B2C',
  'O2O',
  'IoT',
  'AR',
  'VR',
  '메타버스',
  '클라우드',
  '온프레미스',
  '하이브리드',
  '대규모 트래픽',
  'MAU',
  'DAU',
  '디자인시스템',
  '컴포넌트',
  '사용자경험',
  'UX',
  'UI',
  '성능최적화',
  '반응형',
  '접근성',
  '국제화',
  'i18n',
  'A/B 테스트',
  '실험',
  '데이터분석',
];

const ALL_KEYWORDS = [...TECH_KEYWORDS, ...KO_DOMAIN_KEYWORDS];

function extractKeywords(jdText: string): string[] {
  const text = jdText;
  const found = new Set<string>();

  // 화이트리스트 매칭 — 대소문자 무관, 단어 경계
  for (const kw of ALL_KEYWORDS) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|[^A-Za-z0-9가-힣])${escaped}(?:$|[^A-Za-z0-9가-힣])`, 'i');
    if (re.test(text)) found.add(kw);
  }

  // 추가: 대문자로 시작하는 2-20자 Pascal/CamelCase 단어 (Brand/Product 이름 감지)
  const camelMatches = text.match(/\b[A-Z][A-Za-z0-9]{1,19}\b/g) || [];
  const common = new Set([
    'The',
    'And',
    'Or',
    'For',
    'With',
    'Our',
    'Your',
    'This',
    'That',
    'We',
    'You',
    'They',
    'When',
    'Where',
    'How',
    'What',
    'Why',
    'Who',
    'Job',
    'Role',
    'Team',
    'Description',
    'Company',
    'Business',
  ]);
  for (const m of camelMatches) {
    if (!common.has(m) && m.length >= 3 && m.length <= 20) {
      // 이미 화이트리스트에 대소문자 다르게 있으면 스킵
      const alreadyIn = Array.from(found).some((f) => f.toLowerCase() === m.toLowerCase());
      if (!alreadyIn) found.add(m);
    }
  }

  return Array.from(found);
}

function containsKeyword(haystack: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[^A-Za-z0-9가-힣])${escaped}(?:$|[^A-Za-z0-9가-힣])`, 'i');
  return re.test(haystack);
}

function collectResumeText(resume: Resume): string {
  const parts: string[] = [];
  if (resume.personalInfo.summary) parts.push(resume.personalInfo.summary);
  for (const e of resume.experiences) {
    parts.push(e.position || '', e.description || '', e.achievements || '', e.techStack || '');
  }
  for (const s of resume.skills) parts.push(s.items);
  for (const p of resume.projects) {
    parts.push(p.name || '', p.description || '', p.techStack || '');
  }
  return parts.join(' ');
}
