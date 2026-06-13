/**
 * 이력서 기술 스택 구성 검사기 — 언어/프레임워크/데이터베이스/인프라 등
 * 카테고리별로 정리되어 있는지, 아니면 무분별하게 나열되어 있는지 평가한다.
 */

export type SkillCategory =
  | 'language' // 프로그래밍 언어
  | 'framework_frontend' // 프론트엔드 프레임워크
  | 'framework_backend' // 백엔드 프레임워크
  | 'database' // 데이터베이스
  | 'devops_cloud' // DevOps / 클라우드
  | 'mobile' // 모바일 플랫폼
  | 'data_ml' // 데이터/ML
  | 'testing' // 테스트 도구
  | 'tool_other'; // 기타 도구

export type SkillOrganizationIssue =
  | 'no_categories' // 카테고리 구분 없음
  | 'mixed_categories' // 서로 다른 카테고리가 섞임
  | 'too_broad' // 너무 많은 기술 (50+)
  | 'outdated_tech' // 구식 기술만 있고 현대 기술 없음
  | 'no_proficiency'; // 숙련도 표시 없음 (선택적 권고)

export interface DetectedSkill {
  name: string;
  category: SkillCategory;
}

export type SkillsOrganizationGrade = 'organized' | 'partial' | 'jumbled' | 'minimal';

export interface ResumeSkillsOrganizationReport {
  detectedSkills: DetectedSkill[];
  categoryCount: number;
  skillCount: number;
  issues: SkillOrganizationIssue[];
  grade: SkillsOrganizationGrade;
  summary: string;
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Skill category keyword maps
// ---------------------------------------------------------------------------

const SKILL_CATEGORIES: Array<{ category: SkillCategory; keywords: RegExp }> = [
  {
    category: 'language',
    keywords:
      /\b(Java|Python|TypeScript|JavaScript|Go|Rust|C\+\+|C#|Kotlin|Swift|Ruby|PHP|Scala|R|Dart|Groovy)\b/gi,
  },
  {
    category: 'framework_frontend',
    keywords: /\b(React|Vue|Angular|Next\.js|Nuxt|Svelte|Remix|Astro|jQuery|Backbone)\b/gi,
  },
  {
    category: 'framework_backend',
    keywords:
      /\b(Spring|SpringBoot|NestJS|Express|FastAPI|Django|Flask|Rails|Laravel|Gin|Echo|Fiber)\b/gi,
  },
  {
    category: 'database',
    keywords:
      /\b(MySQL|PostgreSQL|MongoDB|Redis|Elasticsearch|Oracle|SQLite|Cassandra|DynamoDB|MariaDB|Neo4j|ClickHouse)\b/gi,
  },
  {
    category: 'devops_cloud',
    keywords:
      /\b(AWS|GCP|Azure|Docker|Kubernetes|Terraform|Jenkins|GitHub\s*Actions|CircleCI|ArgoCD|Helm|Ansible|Nginx|Linux)\b/gi,
  },
  {
    category: 'mobile',
    keywords: /\b(iOS|Android|Flutter|React\s*Native|Xcode|Swift|Kotlin|Compose|SwiftUI)\b/gi,
  },
  {
    category: 'data_ml',
    keywords:
      /\b(TensorFlow|PyTorch|scikit.learn|Pandas|NumPy|Spark|Hadoop|Kafka|Airflow|dbt|Tableau|Power\s*BI)\b/gi,
  },
  {
    category: 'testing',
    keywords: /\b(Jest|JUnit|pytest|Cypress|Playwright|Selenium|Vitest|Mockito|TestContainers)\b/gi,
  },
];

// ---------------------------------------------------------------------------
// Category header detection (to check if user organized skills)
// ---------------------------------------------------------------------------

const CATEGORY_HEADER_RE =
  /(?:언어|프로그래밍\s*언어|Languages?|Frameworks?|프레임워크|Backend|Frontend|Database|DB|DevOps|Cloud|인프라|Infrastructure|Mobile|Testing|테스트)\s*[:：-]/gi;

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkResumeSkillsOrganization(text: string): ResumeSkillsOrganizationReport {
  const t = text ?? '';
  const detectedSkills: DetectedSkill[] = [];
  const categoriesFound = new Set<SkillCategory>();
  let totalSkillCount = 0;

  for (const { category, keywords } of SKILL_CATEGORIES) {
    const fresh = new RegExp(keywords.source, 'gi');
    const matches = t.match(fresh) ?? [];
    const unique = [...new Set(matches.map((m) => m.trim()))];
    for (const name of unique) {
      detectedSkills.push({ name, category });
      categoriesFound.add(category);
      totalSkillCount++;
    }
  }

  // Check if headers are used
  const headerMatches = t.match(CATEGORY_HEADER_RE) ?? [];
  const hasOrganizedHeaders = headerMatches.length >= 2;

  // Determine issues
  const issues: SkillOrganizationIssue[] = [];

  if (totalSkillCount >= 5 && !hasOrganizedHeaders && categoriesFound.size >= 3) {
    issues.push('no_categories');
  }

  if (totalSkillCount > 50) {
    issues.push('too_broad');
  }

  // Compute grade
  let grade: SkillsOrganizationGrade;
  if (totalSkillCount === 0) {
    grade = 'minimal';
  } else if (hasOrganizedHeaders && issues.length === 0) {
    grade = 'organized';
  } else if (hasOrganizedHeaders && issues.length <= 1) {
    grade = 'partial';
  } else if (issues.includes('no_categories') && categoriesFound.size >= 3) {
    grade = 'jumbled';
  } else if (categoriesFound.size >= 2) {
    grade = 'partial';
  } else {
    grade = 'jumbled';
  }

  let summary: string;
  if (grade === 'organized') {
    summary = '기술 스택이 카테고리별로 잘 정리되어 있습니다.';
  } else if (grade === 'partial') {
    summary =
      '기술 스택이 일부 정리되어 있습니다. 카테고리 구분을 더 명확히 하면 가독성이 높아집니다.';
  } else if (grade === 'jumbled') {
    summary = `${totalSkillCount}개 기술이 카테고리 없이 나열되어 있습니다. 언어/프레임워크/데이터베이스/인프라로 구분하세요.`;
  } else {
    summary = '기술 스택 섹션이 감지되지 않았습니다.';
  }

  const suggestions: string[] = [];
  if (issues.includes('no_categories')) {
    suggestions.push('기술을 "언어: ...", "프레임워크: ...", "DB: ..." 형식으로 카테고리화하세요.');
  }
  if (issues.includes('too_broad')) {
    suggestions.push(
      `기술이 ${totalSkillCount}개로 너무 많습니다. 핵심 기술 30개 이내로 압축하세요.`,
    );
  }
  if (grade !== 'minimal' && categoriesFound.size === 1) {
    suggestions.push('감지된 카테고리가 1개입니다. 다양한 기술 영역을 포함해 구성하세요.');
  }

  return {
    detectedSkills,
    categoryCount: categoriesFound.size,
    skillCount: totalSkillCount,
    issues,
    grade,
    summary,
    suggestions,
  };
}
