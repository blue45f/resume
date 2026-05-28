/**
 * JD 필수/우대 기술 분리기 — 채용공고에서 "필수" 조건과
 * "우대" 조건을 분리하여 지원 적합도 판단을 돕는다.
 */

export type SkillTier = 'required' | 'preferred' | 'unknown';

export interface SkillEntry {
  skill: string;
  tier: SkillTier;
  context: string;
}

export interface JdRequiredPreferredReport {
  required: SkillEntry[];
  preferred: SkillEntry[];
  unknown: SkillEntry[];
  hasExplicitSplit: boolean;
  requiredCount: number;
  preferredCount: number;
  summary: string;
  fitGuide: string[];
}

// ---------------------------------------------------------------------------
// Section header patterns to determine if we're in a required/preferred block
// ---------------------------------------------------------------------------

const REQUIRED_SECTION_RE = /(?:자격\s*요건|필수\s*(?:조건|자격|역량|기술)|반드시\s*(?:필요|보유))/;
const PREFERRED_SECTION_RE =
  /(?:우대\s*(?:사항|조건|역량)|있으면\s*좋[은음]|플러스\s*(?:요소|포인트)|bonus)/i;

// ---------------------------------------------------------------------------
// Inline tier markers (single-line level)
// ---------------------------------------------------------------------------

const INLINE_REQUIRED_RE = /(?:필수|반드시|must\s*have|required)\s*[:：]?\s*(.{5,60})/i;
const INLINE_PREFERRED_RE =
  /(?:우대|있으면\s*좋[은음]|nice\s*to\s*have|preferred)\s*[:：]?\s*(.{5,60})/i;

// ---------------------------------------------------------------------------
// Tech/skill extraction (simplified keyword list)
// ---------------------------------------------------------------------------

const TECH_KEYWORDS = [
  'Java',
  'Python',
  'Go',
  'Kotlin',
  'TypeScript',
  'JavaScript',
  'Rust',
  'C\\+\\+',
  'Swift',
  'React',
  'Vue',
  'Angular',
  'Next\\.js',
  'NestJS',
  'Spring',
  'Django',
  'FastAPI',
  'MySQL',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'Elasticsearch',
  'AWS',
  'GCP',
  'Azure',
  'Docker',
  'Kubernetes',
  'Terraform',
  'Kafka',
  'RabbitMQ',
  'gRPC',
  'GraphQL',
  'REST',
  'TensorFlow',
  'PyTorch',
  'ML',
  'LLM',
  'CI\\/CD',
  'Git',
  'Linux',
];

const TECH_RE = new RegExp(`\\b(${TECH_KEYWORDS.join('|')})\\b`, 'g');

function extractTechKeywords(text: string): string[] {
  const matches = text.match(TECH_RE);
  return matches ? Array.from(new Set(matches)) : [];
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function parseJdRequiredVsPreferred(text: string): JdRequiredPreferredReport {
  const t = text ?? '';
  const lines = t
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const required: SkillEntry[] = [];
  const preferred: SkillEntry[] = [];
  const unknown: SkillEntry[] = [];

  let currentTier: SkillTier = 'unknown';
  let hasExplicitSplit = false;

  for (const line of lines) {
    // Detect section transitions
    if (REQUIRED_SECTION_RE.test(line)) {
      currentTier = 'required';
      hasExplicitSplit = true;
      continue;
    }
    if (PREFERRED_SECTION_RE.test(line)) {
      currentTier = 'preferred';
      hasExplicitSplit = true;
      continue;
    }

    // Detect inline markers
    const reqMatch = line.match(INLINE_REQUIRED_RE);
    const prefMatch = line.match(INLINE_PREFERRED_RE);
    if (reqMatch) {
      hasExplicitSplit = true;
      const techs = extractTechKeywords(reqMatch[1]);
      for (const skill of techs) {
        required.push({ skill, tier: 'required', context: line.slice(0, 60) });
      }
      continue;
    }
    if (prefMatch) {
      hasExplicitSplit = true;
      const techs = extractTechKeywords(prefMatch[1]);
      for (const skill of techs) {
        preferred.push({ skill, tier: 'preferred', context: line.slice(0, 60) });
      }
      continue;
    }

    // Use current section context to classify tech keywords on bullet lines
    if (/^[-•▪►*]/.test(line) || line.length < 120) {
      const techs = extractTechKeywords(line);
      for (const skill of techs) {
        const entry: SkillEntry = { skill, tier: currentTier, context: line.slice(0, 60) };
        if (currentTier === 'required') required.push(entry);
        else if (currentTier === 'preferred') preferred.push(entry);
        else unknown.push(entry);
      }
    }
  }

  // Deduplicate by skill name within each tier
  function dedup(entries: SkillEntry[]): SkillEntry[] {
    const seen = new Set<string>();
    return entries.filter((e) => {
      if (seen.has(e.skill)) return false;
      seen.add(e.skill);
      return true;
    });
  }

  const reqDeduped = dedup(required);
  const prefDeduped = dedup(preferred);
  const unkDeduped = dedup(unknown);

  const requiredCount = reqDeduped.length;
  const preferredCount = prefDeduped.length;

  let summary: string;
  if (!hasExplicitSplit) {
    summary = '필수/우대 구분이 명확하지 않습니다. 전체 요구 스킬 목록을 확인하세요.';
  } else if (requiredCount === 0 && preferredCount === 0) {
    summary = '기술 키워드가 감지되지 않았습니다.';
  } else {
    summary = `필수 ${requiredCount}개 / 우대 ${preferredCount}개 기술이 감지됩니다.`;
  }

  const fitGuide: string[] = [];
  if (requiredCount > 0) {
    const skills = reqDeduped
      .slice(0, 4)
      .map((s) => s.skill)
      .join(', ');
    fitGuide.push(
      `필수: ${skills}${requiredCount > 4 ? ` 외 ${requiredCount - 4}개` : ''} — 이 기술이 없으면 서류 탈락 가능성이 높습니다.`,
    );
  }
  if (preferredCount > 0) {
    const skills = prefDeduped
      .slice(0, 3)
      .map((s) => s.skill)
      .join(', ');
    fitGuide.push(
      `우대: ${skills}${preferredCount > 3 ? ` 외 ${preferredCount - 3}개` : ''} — 없어도 지원 가능하지만 있으면 유리합니다.`,
    );
  }
  if (!hasExplicitSplit && unkDeduped.length > 0) {
    fitGuide.push('구분이 없는 공고는 모든 항목을 필수로 간주하고 준비하세요.');
  }

  return {
    required: reqDeduped,
    preferred: prefDeduped,
    unknown: unkDeduped,
    hasExplicitSplit,
    requiredCount,
    preferredCount,
    summary,
    fitGuide,
  };
}
