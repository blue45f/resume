/**
 * 채용공고 자격요건·우대사항 추출 — 한국어 JD 에서 필수/우대 조건을 구조화한다.
 * LLM 없이 섹션 헤더 패턴·불릿 추출·분류 규칙만으로 동작.
 */

export type RequirementCategory = 'tech' | 'experience' | 'education' | 'soft' | 'other';
export type RequirementType = 'required' | 'preferred';

export interface Requirement {
  text: string;
  category: RequirementCategory;
  type: RequirementType;
}

export interface JdRequirementsReport {
  required: Requirement[];
  preferred: Requirement[];
  /** Bullets not confidently classified into either section. */
  unclassified: string[];
  requiredCount: number;
  preferredCount: number;
  /** Whether the JD had explicit section headers. */
  hasSections: boolean;
  summary: string;
}

// ---------------------------------------------------------------------------
// Section detection patterns
// ---------------------------------------------------------------------------

const REQUIRED_SECTION_RE =
  /(?:자격\s*요건|자격\s*조건|지원\s*자격|필수\s*역량|필수\s*요구\s*사항|required\s*qualifications?|requirements?)/i;
const PREFERRED_SECTION_RE =
  /(?:우대\s*사항|우대\s*요건|우대\s*조건|선호\s*사항|우대하는|우대합니다|preferred\s*qualifications?|nice\s*to\s*have|bonus\s*points?)/i;

// Generic "end of section" markers
const SECTION_BREAK_RE =
  /(?:^|\n)(?:업무\s*내용|주요\s*업무|담당\s*업무|혜택|복리\s*후생|근무\s*환경|채용\s*절차|전형\s*안내|제출\s*서류|복지|연봉|급여|주요\s*업무|job\s*description|responsibilities|benefits|what\s*you.ll\s*do)/i;

// ---------------------------------------------------------------------------
// Bullet extraction
// ---------------------------------------------------------------------------

function extractBullets(block: string): string[] {
  return block
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s\-•*·◦▪▫►▸→✓✔○●]+/, '').trim())
    .filter((l) => l.length >= 6 && l.length <= 300);
}

// ---------------------------------------------------------------------------
// Category classification rules
// ---------------------------------------------------------------------------

const TECH_RE =
  /(?:[Jj]ava(?:Script)?|[Tt]ype[Ss]cript|[Pp]ython|[Gg]o(?:lang)?|[Rr]ust|[Cc]#|[Cc]\+\+|[Ss]cala|[Kk]otlin|[Ss]wift|[Rr]eact|[Vv]ue|[Aa]ngular|[Nn]ode|[Ss]pring|[Dd]jango|[Nn]est|[Kk]8s|[Kk]ubernetes|[Dd]ocker|[Aa][Ww][Ss]|[Gg][Cc][Pp]|[Aa]zure|[Mm]y[Ss][Qq][Ll]|[Pp]ost[Gg]re|[Mm]ongo|[Rr]edis|[Gg]it|[Cc][Ii]\/[Cc][Dd]|[Mm][Ll]|딥러닝|머신러닝|데이터베이스|서버|백엔드|프론트엔드|모바일|iOS|안드로이드|API|REST|GraphQL|SQL|NoSQL|클라우드|인프라|DevOps|SRE)/;
const EXPERIENCE_RE =
  /(?:\d+\s*년\s*(?:이상|경력)|경력\s*\d+\s*년|년\s*이상의?\s*경험|프로젝트\s*경험|실무\s*경험|개발\s*경험|서비스\s*운영|production|프로덕션\s*경험|스타트업|대규모\s*서비스|MSA|마이크로서비스)/;
const EDUCATION_RE =
  /(?:학사|석사|박사|대졸|전공|컴퓨터|공학부|이학|B\.S\.|M\.S\.|Ph\.D|전문\s*학사|졸업)/;
const SOFT_RE =
  /(?:커뮤니케이션|소통|협업|협력|리더십|주도|자기\s*계발|학습|성장|책임|열정|문제\s*해결|창의|분석력|기획력|프레젠테이션|영어|일본어|중국어|언어)/;

function classifyBullet(text: string): RequirementCategory {
  if (TECH_RE.test(text)) return 'tech';
  if (EXPERIENCE_RE.test(text)) return 'experience';
  if (EDUCATION_RE.test(text)) return 'education';
  if (SOFT_RE.test(text)) return 'soft';
  return 'other';
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function buildJdRequirementsReport(jdText: string): JdRequirementsReport {
  const safe = (jdText ?? '').trim();
  if (!safe) {
    return {
      required: [],
      preferred: [],
      unclassified: [],
      requiredCount: 0,
      preferredCount: 0,
      hasSections: false,
      summary: '채용공고 내용을 입력하면 자격요건이 분석됩니다.',
    };
  }

  // Split text into lines for section scanning
  const lines = safe.split(/\r?\n/);
  let mode: 'required' | 'preferred' | 'none' | 'break' = 'none';
  const requiredLines: string[] = [];
  const preferredLines: string[] = [];
  const unclassifiedLines: string[] = [];
  let hasSections = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (
      SECTION_BREAK_RE.test(line) &&
      REQUIRED_SECTION_RE.test(line) === false &&
      PREFERRED_SECTION_RE.test(line) === false
    ) {
      mode = 'break';
      continue;
    }
    if (REQUIRED_SECTION_RE.test(line)) {
      mode = 'required';
      hasSections = true;
      continue;
    }
    if (PREFERRED_SECTION_RE.test(line)) {
      mode = 'preferred';
      hasSections = true;
      continue;
    }

    if (mode === 'required') requiredLines.push(line);
    else if (mode === 'preferred') preferredLines.push(line);
    else if (mode === 'none') unclassifiedLines.push(line);
  }

  // Extract and classify bullets
  const toRequirements = (lines_: string[], type: RequirementType): Requirement[] =>
    extractBullets(lines_.join('\n')).map((text) => ({
      text,
      category: classifyBullet(text),
      type,
    }));

  const required = toRequirements(requiredLines, 'required');
  const preferred = toRequirements(preferredLines, 'preferred');
  const unclassified = hasSections ? [] : extractBullets(unclassifiedLines.join('\n')).slice(0, 15);

  // Fallback: if no sections found, try to classify all bullets heuristically
  const allBullets = !hasSections && unclassified.length > 0 ? unclassified : [];

  let summary: string;
  if (!hasSections && allBullets.length === 0) {
    summary = '섹션 헤더를 감지하지 못했습니다. 자격요건 · 우대사항이 명시된 JD를 붙여넣으세요.';
  } else if (required.length > 0 && preferred.length > 0) {
    summary = `필수 ${required.length}개 · 우대 ${preferred.length}개 조건이 감지되었습니다.`;
  } else if (required.length > 0) {
    summary = `필수 조건 ${required.length}개 감지. 우대 사항 섹션이 없거나 명시되지 않았습니다.`;
  } else if (preferred.length > 0) {
    summary = `우대 조건 ${preferred.length}개 감지. 필수 요건 섹션이 없거나 명시되지 않았습니다.`;
  } else {
    summary = `섹션은 감지되었으나 개별 항목을 파싱하지 못했습니다 (불릿 형식 권장).`;
  }

  return {
    required,
    preferred,
    unclassified: allBullets,
    requiredCount: required.length,
    preferredCount: preferred.length,
    hasSections,
    summary,
  };
}
