export type KeywordCategory =
  | 'language' // Python, Java, TypeScript …
  | 'framework' // React, Spring, Django …
  | 'cloud' // AWS, GCP, Azure …
  | 'database' // MySQL, PostgreSQL, Redis …
  | 'tool' // Git, Docker, Kubernetes …
  | 'methodology' // Agile, CI/CD, TDD …
  | 'domain'; // 머신러닝, 데이터 분석 …

export type KeywordStatus = 'present' | 'missing';

export interface KeywordHit {
  keyword: string;
  category: KeywordCategory;
  categoryLabel: string;
  status: KeywordStatus;
}

export interface KeywordGapReport {
  /** All keywords detected in the JD. */
  jdKeywords: KeywordHit[];
  /** Keywords found in the JD but absent from the resume. */
  missing: KeywordHit[];
  /** Keywords found in both JD and resume. */
  present: KeywordHit[];
  /** 0-100 match score (present / jdKeywords * 100). */
  matchScore: number;
  /** Korean short label. */
  label: string;
  /** Korean one-sentence summary. */
  summary: string;
  /** Grouped by category for display. */
  byCategory: Record<KeywordCategory, KeywordHit[]>;
}

// ---------------------------------------------------------------------------
// Keyword table
// ---------------------------------------------------------------------------

interface KeywordDef {
  keyword: string;
  category: KeywordCategory;
  /** Patterns to match keyword in text. English: case-insensitive. Korean: exact. */
  patterns: RegExp[];
}

const KEYWORD_TABLE: KeywordDef[] = [
  // ── Languages ──────────────────────────────────────────────────────────
  { keyword: 'Python', category: 'language', patterns: [/\bpython\b/i, /파이썬/g] },
  { keyword: 'Java', category: 'language', patterns: [/\bjava\b/i, /자바(?!스크립트)/g] },
  {
    keyword: 'JavaScript',
    category: 'language',
    patterns: [/\bjavascript\b/i, /자바스크립트/g, /\bjs\b/i],
  },
  {
    keyword: 'TypeScript',
    category: 'language',
    patterns: [/\btypescript\b/i, /타입스크립트/g, /\bts\b/],
  },
  { keyword: 'Kotlin', category: 'language', patterns: [/\bkotlin\b/i, /코틀린/g] },
  { keyword: 'Swift', category: 'language', patterns: [/\bswift\b/i] },
  { keyword: 'Go', category: 'language', patterns: [/\bgo(?:lang)?\b/i, /\bgolang\b/i] },
  { keyword: 'Rust', category: 'language', patterns: [/\brust\b/i] },
  { keyword: 'C++', category: 'language', patterns: [/\bc\+\+/i, /c\s*plus\s*plus/i] },
  { keyword: 'C#', category: 'language', patterns: [/\bc#/i] },
  { keyword: 'PHP', category: 'language', patterns: [/\bphp\b/i] },
  { keyword: 'Ruby', category: 'language', patterns: [/\bruby\b/i, /루비/g] },
  { keyword: 'Scala', category: 'language', patterns: [/\bscala\b/i] },
  {
    keyword: 'R',
    category: 'language',
    patterns: [/\bR\b(?=\s*언어|\s*프로그래밍|\s*\()/, /\bR언어\b/g],
  },
  { keyword: 'Dart', category: 'language', patterns: [/\bdart\b/i] },
  // ── Frameworks / Libraries ─────────────────────────────────────────────
  { keyword: 'React', category: 'framework', patterns: [/\breact(?:\.js|js)?\b/i, /리액트/g] },
  { keyword: 'Vue', category: 'framework', patterns: [/\bvue(?:\.js|js)?\b/i, /뷰(?:js|\.js)?/g] },
  { keyword: 'Angular', category: 'framework', patterns: [/\bangular(?:js)?\b/i, /앵귤러/g] },
  { keyword: 'Next.js', category: 'framework', patterns: [/\bnext\.?js\b/i, /넥스트(?:\.js)?/g] },
  { keyword: 'NestJS', category: 'framework', patterns: [/\bnest\.?js\b/i, /네스트(?:\.?js)?/g] },
  {
    keyword: 'Spring',
    category: 'framework',
    patterns: [/\bspring(?:\s*boot|mvc)?\b/i, /스프링/g],
  },
  { keyword: 'Django', category: 'framework', patterns: [/\bdjango\b/i, /장고/g] },
  { keyword: 'FastAPI', category: 'framework', patterns: [/\bfastapi\b/i] },
  { keyword: 'Flask', category: 'framework', patterns: [/\bflask\b/i, /플라스크/g] },
  { keyword: 'Express', category: 'framework', patterns: [/\bexpress(?:\.js|js)?\b/i] },
  { keyword: 'Flutter', category: 'framework', patterns: [/\bflutter\b/i, /플러터/g] },
  { keyword: 'React Native', category: 'framework', patterns: [/\breact\s*native\b/i] },
  { keyword: 'PyTorch', category: 'framework', patterns: [/\bpytorch\b/i, /파이토치/g] },
  { keyword: 'TensorFlow', category: 'framework', patterns: [/\btensorflow\b/i, /텐서플로우?/g] },
  { keyword: 'LangChain', category: 'framework', patterns: [/\blangchain\b/i, /랭체인/g] },
  // ── Cloud & Infrastructure ─────────────────────────────────────────────
  { keyword: 'AWS', category: 'cloud', patterns: [/\baws\b/i, /아마존\s*웹\s*서비스/g] },
  {
    keyword: 'GCP',
    category: 'cloud',
    patterns: [/\bgcp\b/i, /\bgoogle\s*cloud\b/i, /구글\s*클라우드/g],
  },
  { keyword: 'Azure', category: 'cloud', patterns: [/\bazure\b/i, /애저/g] },
  { keyword: 'Docker', category: 'cloud', patterns: [/\bdocker\b/i, /도커/g] },
  {
    keyword: 'Kubernetes',
    category: 'cloud',
    patterns: [/\bkubernetes\b/i, /\bk8s\b/i, /쿠버네티스/g],
  },
  { keyword: 'Terraform', category: 'cloud', patterns: [/\bterraform\b/i, /테라폼/g] },
  {
    keyword: 'CI/CD',
    category: 'cloud',
    patterns: [/\bci\s*\/?\s*cd\b/i, /\bjenkins\b/i, /\bgithub\s*actions\b/i, /\bgitlab\s*ci\b/i],
  },
  {
    keyword: 'Linux',
    category: 'cloud',
    patterns: [/\blinux\b/i, /리눅스/g, /\bubuntu\b/i, /\bcentos\b/i],
  },
  { keyword: 'Nginx', category: 'cloud', patterns: [/\bnginx\b/i, /엔진엑스/g] },
  // ── Databases ──────────────────────────────────────────────────────────
  { keyword: 'MySQL', category: 'database', patterns: [/\bmysql\b/i, /마이에스큐엘/g] },
  { keyword: 'PostgreSQL', category: 'database', patterns: [/\bpostgresql?\b/i, /포스트그레/g] },
  { keyword: 'MongoDB', category: 'database', patterns: [/\bmongodb\b/i, /몽고db/i, /몽고디비/g] },
  { keyword: 'Redis', category: 'database', patterns: [/\bredis\b/i, /레디스/g] },
  {
    keyword: 'Elasticsearch',
    category: 'database',
    patterns: [/\belasticsearch\b/i, /엘라스틱서치/g],
  },
  { keyword: 'Kafka', category: 'database', patterns: [/\bkafka\b/i, /카프카/g] },
  { keyword: 'DynamoDB', category: 'database', patterns: [/\bdynamodb\b/i, /다이나모db/i] },
  { keyword: 'SQLite', category: 'database', patterns: [/\bsqlite\b/i] },
  { keyword: 'Oracle', category: 'database', patterns: [/\boracle\b/i, /오라클/g] },
  // ── Tools & Platforms ──────────────────────────────────────────────────
  { keyword: 'Git', category: 'tool', patterns: [/\bgit(?:hub|lab)?\b/i, /깃허브?/g] },
  { keyword: 'Jira', category: 'tool', patterns: [/\bjira\b/i, /지라/g] },
  { keyword: 'Figma', category: 'tool', patterns: [/\bfigma\b/i, /피그마/g] },
  { keyword: 'Notion', category: 'tool', patterns: [/\bnotion\b/i, /노션/g] },
  { keyword: 'Slack', category: 'tool', patterns: [/\bslack\b/i, /슬랙/g] },
  { keyword: 'GraphQL', category: 'tool', patterns: [/\bgraphql\b/i, /그래프큐엘/g] },
  { keyword: 'REST API', category: 'tool', patterns: [/\brest(?:ful)?\s*api\b/i, /REST\s*API/g] },
  { keyword: 'gRPC', category: 'tool', patterns: [/\bgrpc\b/i] },
  { keyword: 'Prometheus', category: 'tool', patterns: [/\bprometheus\b/i, /프로메테우스/g] },
  { keyword: 'Grafana', category: 'tool', patterns: [/\bgrafana\b/i, /그라파나/g] },
  { keyword: 'Datadog', category: 'tool', patterns: [/\bdatadog\b/i, /데이터독/g] },
  // ── Methodology ────────────────────────────────────────────────────────
  { keyword: 'Agile', category: 'methodology', patterns: [/\bagile\b/i, /애자일/g] },
  { keyword: 'Scrum', category: 'methodology', patterns: [/\bscrum\b/i, /스크럼/g] },
  { keyword: 'TDD', category: 'methodology', patterns: [/\btdd\b/i, /테스트\s*주도/g] },
  { keyword: 'OOP', category: 'methodology', patterns: [/\boop\b/i, /객체지향/g] },
  {
    keyword: 'MSA',
    category: 'methodology',
    patterns: [/\bmsa\b/i, /\bmicroservice\b/i, /마이크로서비스/g],
  },
  { keyword: 'DevOps', category: 'methodology', patterns: [/\bdevops\b/i, /데브옵스/g] },
  // ── Domain / Korean skills ─────────────────────────────────────────────
  {
    keyword: '머신러닝',
    category: 'domain',
    patterns: [/머신\s*러닝/g, /\bmachine\s*learning\b/i, /\bml\b(?!\s*엔지니어)/i],
  },
  { keyword: '딥러닝', category: 'domain', patterns: [/딥\s*러닝/g, /\bdeep\s*learning\b/i] },
  {
    keyword: '데이터 분석',
    category: 'domain',
    patterns: [/데이터\s*분석/g, /data\s*analysis/i, /\bda\b/],
  },
  { keyword: '자연어처리', category: 'domain', patterns: [/자연어\s*처리/g, /\bnlp\b/i] },
  {
    keyword: '컴퓨터비전',
    category: 'domain',
    patterns: [/컴퓨터\s*비전/g, /\bcv\b/i, /\bcomputer\s*vision\b/i],
  },
  { keyword: 'LLM', category: 'domain', patterns: [/\bllm\b/i, /대형?\s*언어\s*모델/g] },
  { keyword: '보안', category: 'domain', patterns: [/정보\s*보안/g, /\bsecurity\b/i, /취약점/g] },
  {
    keyword: '블록체인',
    category: 'domain',
    patterns: [/블록체인/g, /\bblockchain\b/i, /\bweb3\b/i],
  },
];

const CATEGORY_LABELS: Record<KeywordCategory, string> = {
  language: '언어',
  framework: '프레임워크',
  cloud: '클라우드/인프라',
  database: 'DB',
  tool: '도구/플랫폼',
  methodology: '방법론',
  domain: '도메인',
};

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

function matchesPatterns(text: string, patterns: RegExp[]): boolean {
  for (const p of patterns) {
    const flags = p.flags.includes('g') ? p.flags : p.flags + 'g';
    const re = new RegExp(p.source, flags);
    if (re.test(text)) return true;
  }
  return false;
}

export function buildJdKeywordGapReport(jdText: string, resumeText: string): KeywordGapReport {
  const safeJd = (jdText ?? '').trim();
  const safeResume = (resumeText ?? '').trim();

  const jdKeywords: KeywordHit[] = [];

  for (const def of KEYWORD_TABLE) {
    if (!matchesPatterns(safeJd, def.patterns)) continue;
    const inResume = safeResume ? matchesPatterns(safeResume, def.patterns) : false;
    jdKeywords.push({
      keyword: def.keyword,
      category: def.category,
      categoryLabel: CATEGORY_LABELS[def.category],
      status: inResume ? 'present' : 'missing',
    });
  }

  const present = jdKeywords.filter((k) => k.status === 'present');
  const missing = jdKeywords.filter((k) => k.status === 'missing');
  const total = jdKeywords.length;
  const matchScore = total === 0 ? 0 : Math.round((present.length / total) * 100);

  const byCategory = {} as Record<KeywordCategory, KeywordHit[]>;
  for (const cat of Object.keys(CATEGORY_LABELS) as KeywordCategory[]) {
    byCategory[cat] = jdKeywords.filter((k) => k.category === cat);
  }

  let label: string;
  let summary: string;
  if (total === 0) {
    label = '키워드 없음';
    summary = '채용공고에서 알려진 기술 키워드를 찾지 못했습니다.';
  } else if (matchScore >= 80) {
    label = `키워드 일치 ${matchScore}%`;
    summary = `JD 키워드 ${total}개 중 ${present.length}개가 이력서에 포함되어 있습니다. 매우 잘 맞습니다.`;
  } else if (matchScore >= 50) {
    label = `키워드 일치 ${matchScore}%`;
    summary = `JD 키워드 ${total}개 중 ${missing.length}개가 이력서에 없습니다. 해당 기술을 경험했다면 추가해 보세요.`;
  } else {
    label = `키워드 일치 ${matchScore}%`;
    summary = `JD 키워드 ${total}개 중 ${missing.length}개가 이력서에 빠져 있습니다. 관련 경험을 이력서에 반영하거나 면접에서 언급하세요.`;
  }

  return { jdKeywords, missing, present, matchScore, label, summary, byCategory };
}
