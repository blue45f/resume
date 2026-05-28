/**
 * 역할 키워드 갭 분석 모듈.
 *
 * 제공:
 * - detectRoleCategory: 이력서 텍스트에서 주요 기술 역할 카테고리 감지
 * - analyzeRoleKeywordGap: 감지된 역할의 표준 기술 스택 대비 누락 키워드 분석
 *
 * 관련 타입: RoleCategory, RoleKeywordGapReport.
 */

export type RoleCategory =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'mobile_ios'
  | 'mobile_android'
  | 'devops'
  | 'data'
  | 'ai_ml'
  | 'unknown';

const ROLE_LABEL_KO: Record<RoleCategory, string> = {
  frontend: '프론트엔드',
  backend: '백엔드',
  fullstack: '풀스택',
  mobile_ios: 'iOS 개발',
  mobile_android: 'Android 개발',
  devops: 'DevOps/인프라',
  data: '데이터 엔지니어링',
  ai_ml: 'AI/ML',
  unknown: '일반',
};

// ---------------------------------------------------------------------------
// Role signals — primary keywords that signal a role
// ---------------------------------------------------------------------------

const ROLE_SIGNALS: Record<RoleCategory, string[]> = {
  frontend: [
    'React',
    'Vue',
    'Next.js',
    'Angular',
    'TypeScript',
    'CSS',
    'Tailwind',
    'Webpack',
    'Vite',
  ],
  backend: [
    'Spring',
    'NestJS',
    'Django',
    'FastAPI',
    'Node.js',
    'Express',
    'PostgreSQL',
    'MySQL',
    'Redis',
  ],
  fullstack: ['React', 'Node.js', 'TypeScript', 'Spring', 'Django', 'MongoDB', 'PostgreSQL'],
  mobile_ios: ['Swift', 'iOS', 'Xcode', 'UIKit', 'SwiftUI', 'Objective-C'],
  mobile_android: ['Android', 'Kotlin', 'Java', 'Jetpack', 'Compose', 'Android Studio'],
  devops: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform', 'Jenkins', 'CI/CD', 'Helm'],
  data: [
    'Spark',
    'Kafka',
    'Airflow',
    'Hadoop',
    'Redshift',
    'BigQuery',
    'dbt',
    'Flink',
    '데이터 파이프라인',
  ],
  ai_ml: [
    'PyTorch',
    'TensorFlow',
    'scikit-learn',
    'MLflow',
    'Hugging Face',
    'LLM',
    'RAG',
    'BERT',
    'GPT',
  ],
  unknown: [],
};

// ---------------------------------------------------------------------------
// Standard skills per role — what a strong candidate should mention
// ---------------------------------------------------------------------------

const ROLE_STANDARD_SKILLS: Record<Exclude<RoleCategory, 'unknown'>, string[]> = {
  frontend: [
    'TypeScript',
    'React',
    'Next.js',
    'CSS',
    'Webpack',
    'Vite',
    '상태관리',
    'Jest',
    'REST',
    'GraphQL',
  ],
  backend: ['REST', 'Docker', 'Redis', 'MySQL', 'CI/CD', '배포', 'JWT', '캐싱', '로깅', '모니터링'],
  fullstack: [
    'TypeScript',
    'Docker',
    'REST',
    'CI/CD',
    'Redis',
    '배포',
    'Jest',
    'PostgreSQL',
    'AWS',
  ],
  mobile_ios: [
    'Swift',
    'SwiftUI',
    'Xcode',
    'REST',
    'CI/CD',
    'TestFlight',
    'App Store',
    'CoreData',
    'Combine',
  ],
  mobile_android: [
    'Kotlin',
    'Jetpack',
    'Compose',
    'REST',
    'CI/CD',
    'Play Store',
    'Room',
    'Coroutine',
    'Hilt',
  ],
  devops: [
    'Docker',
    'Kubernetes',
    'Terraform',
    'CI/CD',
    'AWS',
    'Prometheus',
    'Grafana',
    'Helm',
    'GitOps',
  ],
  data: [
    'Python',
    'SQL',
    'Spark',
    'Airflow',
    'Kafka',
    'ETL',
    '데이터 모델링',
    'Redshift',
    'BigQuery',
  ],
  ai_ml: [
    'Python',
    'PyTorch',
    'scikit-learn',
    'MLflow',
    'REST',
    'Docker',
    'GPU',
    '실험 관리',
    '모델 배포',
  ],
};

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

function countSignals(text: string, signals: string[]): number {
  const t = text.toLowerCase();
  return signals.filter((s) => t.includes(s.toLowerCase())).length;
}

/**
 * 이력서 텍스트에서 가장 많이 언급된 기술 역할 카테고리를 감지.
 * 동점 시 더 상위 카테고리 우선.
 */
export function detectRoleCategory(text: string): RoleCategory {
  const t = text ?? '';
  const scores: [RoleCategory, number][] = (
    Object.entries(ROLE_SIGNALS) as [RoleCategory, string[]][]
  )
    .filter(([cat]) => cat !== 'unknown')
    .map(([cat, signals]) => [cat, countSignals(t, signals)] as [RoleCategory, number]);

  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] >= 2 ? scores[0][0] : 'unknown';
}

// ---------------------------------------------------------------------------
// Gap analysis
// ---------------------------------------------------------------------------

export interface RoleKeywordGapReport {
  category: RoleCategory;
  categoryLabel: string;
  matched: string[];
  missing: string[];
  /** 0-100 — matched / total standard skills */
  score: number;
  suggestion: string;
}

/**
 * 감지된 역할 카테고리 기준으로 이력서에 누락된 표준 기술 스택 키워드를 분석.
 */
export function analyzeRoleKeywordGap(text: string): RoleKeywordGapReport {
  const t = text ?? '';
  const category = detectRoleCategory(t);
  const categoryLabel = ROLE_LABEL_KO[category];

  if (category === 'unknown') {
    return {
      category,
      categoryLabel,
      matched: [],
      missing: [],
      score: 0,
      suggestion:
        '기술 역할을 감지하지 못했습니다. 기술 스택을 더 명시적으로 기재하면 분석 가능합니다.',
    };
  }

  const standard = ROLE_STANDARD_SKILLS[category];
  const tLow = t.toLowerCase();
  const matched = standard.filter((s) => tLow.includes(s.toLowerCase()));
  const missing = standard.filter((s) => !tLow.includes(s.toLowerCase()));
  const score = Math.round((matched.length / standard.length) * 100);

  let suggestion: string;
  if (score >= 70) {
    suggestion = `${categoryLabel} 핵심 기술 스택이 충분히 언급되어 있습니다.`;
  } else if (score >= 40) {
    suggestion = `${categoryLabel} 표준 기술 중 일부가 누락되었습니다. ${missing.slice(0, 3).join(', ')} 등을 추가해 보세요.`;
  } else {
    suggestion = `${categoryLabel} 역할의 핵심 기술이 많이 빠져 있습니다. ${missing.slice(0, 4).join(', ')} 등을 경력/기술 섹션에 포함하세요.`;
  }

  return { category, categoryLabel, matched, missing, score, suggestion };
}
