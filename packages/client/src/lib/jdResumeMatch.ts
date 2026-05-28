/**
 * JD-이력서 요건 커버리지 분석 — jdRequirementsExtractor 의 자격요건을 이력서 텍스트와
 * 매핑해 각 요건이 커버되는지, 얼마나 일치하는지 점수를 낸다.
 */

import { buildJdRequirementsReport, type Requirement } from './jdRequirementsExtractor';

export interface RequirementCoverage {
  requirement: Requirement;
  /** Terms extracted from requirement text that were found in resume. */
  matchedTerms: string[];
  /** Whether we consider this requirement "covered." */
  covered: boolean;
  /** 0-100 confidence the resume addresses this requirement. */
  confidence: number;
}

export interface JdResumeMatchReport {
  /** Coverage result for each parsed requirement. */
  coverageItems: RequirementCoverage[];
  /** Required requirements only. */
  requiredCoverage: RequirementCoverage[];
  /** Preferred requirements only. */
  preferredCoverage: RequirementCoverage[];
  /** Number of required reqs covered. */
  requiredCoveredCount: number;
  /** Total required reqs. */
  requiredTotalCount: number;
  /** 0-100 match score (weighted: required=70, preferred=30). */
  matchScore: number;
  tone: 'good' | 'neutral' | 'warning';
  label: string;
  summary: string;
  /** Uncovered required requirements (actionable gap list). */
  gaps: Requirement[];
}

// ---------------------------------------------------------------------------
// Term extraction helpers
// ---------------------------------------------------------------------------

/** Extracts significant tokens from a requirement bullet for fuzzy matching. */
function extractTerms(text: string): string[] {
  const terms: string[] = [];

  // Tech keywords (exact case-sensitive)
  const techRe =
    /(?:Java(?:Script)?|TypeScript|Python|Golang?|Rust|C#|C\+\+|Scala|Kotlin|Swift|React|Vue|Angular|Node\.?js?|Spring\s*Boot?|Django|NestJS?|k8s|Kubernetes|Docker|AWS|GCP|Azure|MySQL|PostgreSQL?|MongoDB|Redis|Git|GraphQL|SQL|REST|gRPC|Kafka|Elasticsearch|Terraform|Ansible)/g;
  let m: RegExpExecArray | null;
  while ((m = techRe.exec(text)) !== null) terms.push(m[0]);

  // Korean tech / domain nouns (2-6 chars)
  const koreanRe = /[가-힣]{2,6}(?:\s+[가-힣]{2,6}){0,1}/g;
  while ((m = koreanRe.exec(text)) !== null) {
    const token = m[0].trim();
    if (
      token.length >= 2 &&
      !['이상', '경험', '이하', '필수', '우대', '가능', '관련'].includes(token)
    ) {
      terms.push(token);
    }
  }

  // Year/number expressions indicating experience level
  const yearRe = /\d+\s*년\s*(?:이상|경력)?/g;
  while ((m = yearRe.exec(text)) !== null) terms.push(m[0].replace(/\s+/g, ''));

  return [...new Set(terms)].slice(0, 8);
}

/** Check how many terms from the requirement appear in resume text. */
function checkCoverage(
  reqText: string,
  resumeText: string,
): { matchedTerms: string[]; confidence: number } {
  const terms = extractTerms(reqText);
  if (terms.length === 0) return { matchedTerms: [], confidence: 0 };

  const resumeLower = resumeText.toLowerCase();
  const matched = terms.filter((t) => resumeLower.includes(t.toLowerCase()));
  const ratio = matched.length / terms.length;
  const confidence = Math.round(ratio * 100);
  return { matchedTerms: matched, confidence };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function buildJdResumeMatchReport(jdText: string, resumeText: string): JdResumeMatchReport {
  const jdReport = buildJdRequirementsReport(jdText);

  if (jdReport.requiredCount === 0 && jdReport.preferredCount === 0) {
    return {
      coverageItems: [],
      requiredCoverage: [],
      preferredCoverage: [],
      requiredCoveredCount: 0,
      requiredTotalCount: 0,
      matchScore: 0,
      tone: 'warning',
      label: '분석 불가',
      summary: '자격요건·우대사항 섹션을 감지하지 못했습니다. JD 형식을 확인하세요.',
      gaps: [],
    };
  }

  const allRequirements: Requirement[] = [...jdReport.required, ...jdReport.preferred];
  const coverageItems: RequirementCoverage[] = allRequirements.map((req) => {
    const { matchedTerms, confidence } = checkCoverage(req.text, resumeText);
    return {
      requirement: req,
      matchedTerms,
      confidence,
      covered: confidence >= 30,
    };
  });

  const requiredCoverage = coverageItems.filter((c) => c.requirement.type === 'required');
  const preferredCoverage = coverageItems.filter((c) => c.requirement.type === 'preferred');
  const requiredCoveredCount = requiredCoverage.filter((c) => c.covered).length;
  const preferredCoveredCount = preferredCoverage.filter((c) => c.covered).length;

  const reqTotal = requiredCoverage.length;
  const prefTotal = preferredCoverage.length;

  const reqScore = reqTotal > 0 ? (requiredCoveredCount / reqTotal) * 70 : 35;
  const prefScore = prefTotal > 0 ? (preferredCoveredCount / prefTotal) * 30 : 15;
  const matchScore = Math.round(reqScore + prefScore);

  const tone: JdResumeMatchReport['tone'] =
    matchScore >= 65 ? 'good' : matchScore >= 40 ? 'neutral' : 'warning';

  const gaps = requiredCoverage.filter((c) => !c.covered).map((c) => c.requirement);

  const summary =
    reqTotal === 0
      ? `우대 조건 ${preferredCoveredCount}/${prefTotal} 충족.`
      : matchScore >= 65
        ? `필수 요건 ${requiredCoveredCount}/${reqTotal}개 충족 — 이력서가 JD 요건과 잘 맞습니다.`
        : matchScore >= 40
          ? `필수 요건 ${requiredCoveredCount}/${reqTotal}개 충족 — 미충족 항목을 이력서에 보강하세요.`
          : `필수 요건 ${requiredCoveredCount}/${reqTotal}개만 충족 — 주요 역량·경험을 이력서에 추가하세요.`;

  return {
    coverageItems,
    requiredCoverage,
    preferredCoverage,
    requiredCoveredCount,
    requiredTotalCount: reqTotal,
    matchScore,
    tone,
    label: `매칭 ${matchScore}점`,
    summary,
    gaps,
  };
}
