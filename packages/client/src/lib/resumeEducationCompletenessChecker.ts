/**
 * 이력서 학력 완성도 체커 — 학교/학위/전공/졸업시기/학점 정보의 존재 여부를
 * 점검하고 누락 항목과 보완 방향을 제시한다.
 */

export type EducationField = 'school' | 'degree' | 'major' | 'graduation_date' | 'gpa';

export type EducationCompleteness = 'complete' | 'good' | 'partial' | 'minimal' | 'absent';

export interface EducationFieldStatus {
  field: EducationField;
  present: boolean;
  excerpt: string;
}

export interface ResumeEducationReport {
  completeness: EducationCompleteness;
  fields: EducationFieldStatus[];
  presentCount: number; // 핵심 4개 항목 중 감지 수
  hasGpa: boolean;
  sectionDetected: boolean;
  summary: string;
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Section isolation
// ---------------------------------------------------------------------------

const EDUCATION_HEADER_RE = /(?:학력\s*(?:사항)?|교육\s*(?:사항|이력)|학업|Education)/i;
const NEXT_SECTION_RE =
  /(?:경력\s*(?:사항)?|경험|프로젝트|자격\s*(?:증|사항)|보유\s*기술|기술\s*스택|스킬|수상|활동|어학|자기소개|Experience|Skills|Projects|Certification|Awards)/i;

function extractEducationSection(text: string): { section: string; detected: boolean } {
  const headerMatch = text.match(EDUCATION_HEADER_RE);
  if (!headerMatch || headerMatch.index === undefined) {
    return { section: text, detected: false };
  }
  const start = headerMatch.index;
  const rest = text.slice(start + headerMatch[0].length);
  const nextMatch = rest.match(NEXT_SECTION_RE);
  const end =
    nextMatch && nextMatch.index !== undefined ? nextMatch.index : Math.min(rest.length, 600);
  return { section: rest.slice(0, end), detected: true };
}

// ---------------------------------------------------------------------------
// Field patterns
// ---------------------------------------------------------------------------

const SCHOOL_RE =
  /(?:[가-힣A-Za-z]{2,}\s*(?:대학교|대학원|전문대학|University|College|Institute)|고등학교|[A-Za-z]+\s+University)/;
const DEGREE_RE =
  /(?:학사|석사|박사|전문학사|학위|수료|졸업|Bachelor|Master|Ph\.?\s?D|B\.?S\.?|M\.?S\.?|MBA|B\.?A\.?|M\.?A\.?)/i;
const MAJOR_RE =
  /(?:[가-힣]{2,}(?:공학|학과|학부|학|전공))|(?:전공\s*[:：]\s*\S+)|(?:major\s*[:：]?\s*\S+)/i;
const GRAD_DATE_RE =
  /(?:(?:19|20)\d{2}\s*[년./~-]|(?:19|20)\d{2}\s*[~-]\s*(?:19|20)\d{2}|\d{4}\.\d{2}|졸업\s*(?:예정)?|재학|중퇴|휴학)/;
const GPA_RE = /(?:학점|GPA|평점|성적)\s*[:：]?\s*\d\.\d+|(?:\d\.\d+)\s*\/\s*4\.[0235]/i;

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkResumeEducationCompleteness(text: string): ResumeEducationReport {
  const t = (text ?? '').trim();
  const { section, detected } = extractEducationSection(t);

  const matchField = (re: RegExp): { present: boolean; excerpt: string } => {
    const m = section.match(re);
    return m
      ? { present: true, excerpt: m[0].slice(0, 40).trim() }
      : { present: false, excerpt: '' };
  };

  const school = matchField(SCHOOL_RE);
  const degree = matchField(DEGREE_RE);
  const major = matchField(MAJOR_RE);
  const gradDate = matchField(GRAD_DATE_RE);
  const gpa = matchField(GPA_RE);

  const fields: EducationFieldStatus[] = [
    { field: 'school', present: school.present, excerpt: school.excerpt },
    { field: 'degree', present: degree.present, excerpt: degree.excerpt },
    { field: 'major', present: major.present, excerpt: major.excerpt },
    { field: 'graduation_date', present: gradDate.present, excerpt: gradDate.excerpt },
    { field: 'gpa', present: gpa.present, excerpt: gpa.excerpt },
  ];

  // Core fields = school, degree, major, graduation_date (GPA is optional bonus)
  const presentCount = [school, degree, major, gradDate].filter((f) => f.present).length;

  let completeness: EducationCompleteness;
  if (!school.present && presentCount === 0) {
    completeness = 'absent';
  } else if (presentCount === 4) {
    completeness = 'complete';
  } else if (presentCount === 3) {
    completeness = 'good';
  } else if (presentCount === 2) {
    completeness = 'partial';
  } else {
    completeness = 'minimal';
  }

  // Summary
  const COMPLETENESS_LABEL: Record<EducationCompleteness, string> = {
    complete: '학력 정보가 완전합니다 (학교·학위·전공·시기 모두 기재).',
    good: '학력 정보가 대체로 충실합니다 (핵심 4개 중 3개 기재).',
    partial: '학력 정보가 일부 누락되었습니다 (핵심 4개 중 2개 기재).',
    minimal: '학력 정보가 부족합니다. 핵심 항목을 보강하세요.',
    absent: '학력 정보가 감지되지 않습니다.',
  };
  const summary = COMPLETENESS_LABEL[completeness];

  // Suggestions
  const FIELD_LABEL: Record<EducationField, string> = {
    school: '학교명',
    degree: '학위(졸업 구분)',
    major: '전공/학과',
    graduation_date: '졸업 시기(연도)',
    gpa: '학점(GPA)',
  };
  const suggestions: string[] = [];
  for (const f of fields) {
    if (f.field === 'gpa') continue;
    if (!f.present) {
      suggestions.push(`${FIELD_LABEL[f.field]}을(를) 추가하세요.`);
    }
  }
  if (completeness === 'absent') {
    suggestions.length = 0;
    suggestions.push('"학력" 섹션을 추가하고 학교명·전공·졸업 시기를 기재하세요.');
  }
  if (!gpa.present && presentCount >= 2) {
    suggestions.push('신입/주니어라면 학점(예: 3.8/4.5)을 추가하면 신뢰도가 높아집니다.');
  }
  if (completeness === 'complete' && gpa.present) {
    suggestions.push(
      '학력 정보가 충분합니다. 전공과 직무의 연관성을 한 줄로 덧붙이면 더 좋습니다.',
    );
  }

  return {
    completeness,
    fields,
    presentCount,
    hasGpa: gpa.present,
    sectionDetected: detected,
    summary,
    suggestions,
  };
}
