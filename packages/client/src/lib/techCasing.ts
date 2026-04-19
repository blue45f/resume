/**
 * 기술 용어 대소문자 일관성 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * 제공:
 * - detectInconsistentCasing: JavaScript/javascript/Javascript, GitHub/github 등 케이스
 *   불일치 감지. canonical 표기 + 등장 변형 목록 + 주류 표기 추천.
 *
 * 관련 타입: CasingHit, CasingAnalysis.
 */

const TECH_CANONICAL: Record<string, string[]> = {
  JavaScript: ['javascript', 'Javascript', 'JAVASCRIPT', 'JS'],
  TypeScript: ['typescript', 'Typescript', 'TYPESCRIPT', 'TS'],
  'Node.js': ['nodejs', 'Nodejs', 'NodeJS', 'NODE.JS', 'node.js'],
  GitHub: ['github', 'Github', 'GITHUB'],
  GitLab: ['gitlab', 'Gitlab', 'GITLAB'],
  iOS: ['ios', 'IOS', 'Ios'],
  MySQL: ['mysql', 'Mysql', 'MYSQL'],
  PostgreSQL: ['postgresql', 'Postgresql', 'POSTGRESQL', 'postgres', 'Postgres'],
  MongoDB: ['mongodb', 'Mongodb', 'MONGODB', 'mongo'],
  AWS: ['Aws', 'aws'],
  HTML: ['html', 'Html'],
  CSS: ['css', 'Css'],
  API: ['api', 'Api'],
  REST: ['rest', 'Rest'],
  GraphQL: ['graphql', 'Graphql', 'GRAPHQL'],
  Docker: ['docker', 'DOCKER'],
  Kubernetes: ['kubernetes', 'KUBERNETES', 'K8S', 'k8s'],
  'CI/CD': ['ci/cd', 'Ci/Cd', 'cicd', 'CICD'],
  React: ['react', 'REACT'],
  'Vue.js': ['vue.js', 'vue', 'Vue', 'VUE.JS'],
  'Next.js': ['next.js', 'next', 'Next', 'NEXT.JS', 'nextjs', 'Nextjs'],
};

export interface CasingHit {
  canonical: string;
  variants: Array<{ form: string; count: number }>;
  total: number;
}

export interface CasingAnalysis {
  hits: CasingHit[];
  suggestion: string;
}

/**
 * 기술 용어 대소문자 일관성 — "JavaScript / javascript / Javascript", "GitHub / github",
 * "Node.js / nodejs / Nodejs" 같은 케이스 불일치를 검출. 이력서에서 한 용어 여러 표기 노출.
 * canonical 표기 + 등장한 변형 목록 + 주류 표기 추천.
 */
export function detectInconsistentCasing(text: string): CasingAnalysis {
  const t = text ?? '';
  const hits: CasingHit[] = [];
  for (const [canonical, variants] of Object.entries(TECH_CANONICAL)) {
    const forms = new Map<string, number>();
    const all = [canonical, ...variants];
    for (const form of all) {
      // word boundary 우회 — 특수문자 포함된 토큰(Node.js)도 대응
      const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?<![A-Za-z0-9.])${escaped}(?![A-Za-z0-9.])`, 'g');
      const matches = t.match(re);
      if (matches) forms.set(form, matches.length);
    }
    if (forms.size >= 2) {
      const variants2 = [...forms.entries()]
        .map(([form, count]) => ({ form, count }))
        .sort((a, b) => b.count - a.count);
      hits.push({
        canonical,
        variants: variants2,
        total: variants2.reduce((a, b) => a + b.count, 0),
      });
    }
  }
  hits.sort((a, b) => b.total - a.total);
  const suggestion = hits.length
    ? `기술 용어 케이스 불일치 ${hits.length}건 — "${hits[0].canonical}" 등 정식 표기로 통일하세요.`
    : '기술 용어 대소문자가 일관됩니다.';
  return { hits: hits.slice(0, 8), suggestion };
}
