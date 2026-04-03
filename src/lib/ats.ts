import type { Resume } from '@/types/resume';

export interface AtsIssue {
  severity: 'error' | 'warning' | 'info';
  section: string;
  message: string;
  tip: string;
}

export interface AtsCheckItem {
  id: string;
  category: string;
  label: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  detail?: string;
}

export interface KeywordDensity {
  keyword: string;
  count: number;
  density: number; // percentage
  recommendation: 'good' | 'low' | 'high';
}

export interface AtsResult {
  score: number; // 0-100
  grade: string; // A-F
  issues: AtsIssue[];
  passed: string[];
  checklist: AtsCheckItem[];
  keywordDensity: KeywordDensity[];
}

/** Strip HTML tags from text */
function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Check if a date string follows a consistent format */
function isConsistentDateFormat(dates: string[]): boolean {
  if (dates.length < 2) return true;
  const patterns = dates.filter(d => d).map(d => {
    if (/^\d{4}-\d{2}$/.test(d)) return 'YYYY-MM';
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return 'YYYY-MM-DD';
    if (/^\d{4}\.\d{2}$/.test(d)) return 'YYYY.MM';
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(d)) return 'YYYY.MM.DD';
    if (/^\d{4}\/\d{2}$/.test(d)) return 'YYYY/MM';
    return 'other';
  });
  const uniquePatterns = new Set(patterns);
  return uniquePatterns.size <= 1;
}

/** Check for special characters that may confuse ATS parsers */
function hasProblematicChars(text: string): boolean {
  // Check for fancy quotes, em-dashes, special bullets, non-standard chars
  return /[""''—–•◆◇★☆♦♣♠♥※†‡§¶]/.test(text);
}

export function analyzeAtsCompatibility(resume: Resume): AtsResult {
  const issues: AtsIssue[] = [];
  const passed: string[] = [];
  const checklist: AtsCheckItem[] = [];
  let score = 100;

  const pi = resume.personalInfo;
  const allText = JSON.stringify(resume);
  const plainText = stripHtml(allText);

  // ============================================================
  // CONTACT INFO CHECKS
  // ============================================================
  if (!pi.email) {
    issues.push({ severity: 'error', section: '인적사항', message: '이메일 누락', tip: '채용 담당자가 연락할 수 없습니다. 이메일을 반드시 입력하세요.' });
    checklist.push({ id: 'email', category: '인적사항', label: '이메일 입력', passed: false, severity: 'error', detail: '이메일이 누락되었습니다' });
    score -= 15;
  } else {
    passed.push('이메일 입력됨');
    checklist.push({ id: 'email', category: '인적사항', label: '이메일 입력', passed: true, severity: 'info' });
  }

  if (!pi.phone) {
    issues.push({ severity: 'error', section: '인적사항', message: '연락처 누락', tip: '전화번호를 입력하면 합격률이 높아집니다.' });
    checklist.push({ id: 'phone', category: '인적사항', label: '전화번호 입력', passed: false, severity: 'error', detail: '전화번호가 누락되었습니다' });
    score -= 10;
  } else {
    passed.push('연락처 입력됨');
    checklist.push({ id: 'phone', category: '인적사항', label: '전화번호 입력', passed: true, severity: 'info' });
  }

  if (!pi.name) {
    issues.push({ severity: 'error', section: '인적사항', message: '이름 누락', tip: 'ATS는 이름이 없으면 이력서를 처리할 수 없습니다.' });
    checklist.push({ id: 'name', category: '인적사항', label: '이름 입력', passed: false, severity: 'error', detail: '이름이 누락되었습니다' });
    score -= 20;
  } else {
    passed.push('이름 입력됨');
    checklist.push({ id: 'name', category: '인적사항', label: '이름 입력', passed: true, severity: 'info' });
  }

  // ============================================================
  // SUMMARY CHECK
  // ============================================================
  const summaryText = stripHtml(pi.summary || '');
  if (summaryText.length < 50) {
    issues.push({ severity: 'warning', section: '자기소개', message: '자기소개가 너무 짧습니다', tip: '50자 이상의 자기소개를 작성하면 ATS 통과율이 높아집니다. 핵심 역량과 경력 요약을 포함하세요.' });
    checklist.push({ id: 'summary-length', category: '자기소개', label: '자기소개 50자 이상', passed: false, severity: 'warning', detail: `현재 ${summaryText.length}자` });
    score -= 8;
  } else {
    passed.push('자기소개 충분');
    checklist.push({ id: 'summary-length', category: '자기소개', label: '자기소개 50자 이상', passed: true, severity: 'info' });
  }

  // ============================================================
  // EXPERIENCE CHECKS
  // ============================================================
  if (resume.experiences.length === 0) {
    issues.push({ severity: 'error', section: '경력', message: '경력 섹션이 비어있습니다', tip: '최소 1개 이상의 경력을 입력하세요. 신입이라면 인턴/아르바이트도 포함하세요.' });
    checklist.push({ id: 'exp-exists', category: '경력', label: '경력 1개 이상 입력', passed: false, severity: 'error' });
    score -= 15;
  } else {
    passed.push(`경력 ${resume.experiences.length}개 입력됨`);
    checklist.push({ id: 'exp-exists', category: '경력', label: '경력 1개 이상 입력', passed: true, severity: 'info' });

    let allExpDatesPresent = true;
    let allExpDescSufficient = true;

    for (const exp of resume.experiences) {
      if (!exp.startDate) {
        issues.push({ severity: 'warning', section: '경력', message: `"${exp.company}" 시작일 누락`, tip: 'ATS는 근무 기간을 파싱합니다. 날짜를 입력하세요.' });
        allExpDatesPresent = false;
        score -= 3;
      }
      const descText = stripHtml(exp.description || '');
      if (descText.length < 30) {
        issues.push({ severity: 'warning', section: '경력', message: `"${exp.company}" 업무 설명이 부족합니다`, tip: '구체적인 성과와 수치를 포함한 설명을 작성하세요. (예: "매출 20% 증가 기여")' });
        allExpDescSufficient = false;
        score -= 5;
      }
    }

    checklist.push({ id: 'exp-dates', category: '경력', label: '모든 경력 날짜 입력', passed: allExpDatesPresent, severity: 'warning' });
    checklist.push({ id: 'exp-desc', category: '경력', label: '경력 설명 충분 (30자+)', passed: allExpDescSufficient, severity: 'warning' });
  }

  // ============================================================
  // EDUCATION CHECK
  // ============================================================
  if (resume.educations.length === 0) {
    issues.push({ severity: 'warning', section: '학력', message: '학력 정보 없음', tip: '학력 정보는 대부분의 ATS에서 필수 필드입니다.' });
    checklist.push({ id: 'edu', category: '학력', label: '학력 정보 입력', passed: false, severity: 'warning' });
    score -= 5;
  } else {
    passed.push('학력 입력됨');
    checklist.push({ id: 'edu', category: '학력', label: '학력 정보 입력', passed: true, severity: 'info' });
  }

  // ============================================================
  // SKILLS CHECK
  // ============================================================
  if (resume.skills.length === 0) {
    issues.push({ severity: 'error', section: '기술', message: '기술 스택 누락', tip: 'ATS는 키워드 매칭으로 이력서를 필터링합니다. 기술 스택을 반드시 입력하세요.' });
    checklist.push({ id: 'skills', category: '기술', label: '기술 스택 입력', passed: false, severity: 'error' });
    score -= 15;
  } else {
    const totalSkills = resume.skills.reduce((sum, s) => sum + s.items.split(',').filter(i => i.trim()).length, 0);
    if (totalSkills < 5) {
      issues.push({ severity: 'warning', section: '기술', message: `기술 키워드가 ${totalSkills}개로 적습니다`, tip: '최소 5-10개의 기술 키워드를 입력하면 ATS 매칭률이 높아집니다.' });
      checklist.push({ id: 'skills', category: '기술', label: '기술 키워드 5개 이상', passed: false, severity: 'warning', detail: `현재 ${totalSkills}개` });
      score -= 5;
    } else {
      passed.push(`기술 키워드 ${totalSkills}개`);
      checklist.push({ id: 'skills', category: '기술', label: '기술 키워드 5개 이상', passed: true, severity: 'info', detail: `${totalSkills}개` });
    }
  }

  // ============================================================
  // FORMATTING CHECKS (NEW - Enhanced)
  // ============================================================

  // Tables check
  const hasTable = allText.includes('<table') || allText.includes('<TABLE');
  checklist.push({ id: 'no-tables', category: '형식', label: '표(table) 미사용', passed: !hasTable, severity: 'warning', detail: hasTable ? 'ATS가 표를 파싱하지 못할 수 있습니다' : undefined });
  if (hasTable) {
    issues.push({ severity: 'warning', section: '형식', message: '표(table) 사용 감지', tip: 'ATS는 표를 제대로 파싱하지 못합니다. 텍스트 기반으로 변경하세요.' });
    score -= 5;
  }

  // Images check
  const hasImages = allText.includes('<img') || allText.includes('<IMG') || (pi.photo && pi.photo.length > 0);
  checklist.push({ id: 'no-images', category: '형식', label: '이미지 최소화', passed: !hasImages, severity: 'info', detail: hasImages ? '이미지가 포함되어 있습니다' : undefined });
  if (hasImages && !pi.photo) {
    issues.push({ severity: 'info', section: '형식', message: '본문에 이미지 사용', tip: 'ATS는 이미지 속 텍스트를 읽지 못합니다. 중요한 정보는 텍스트로 작성하세요.' });
    score -= 3;
  }

  // Special characters check
  const hasSpecialChars = hasProblematicChars(plainText);
  checklist.push({ id: 'no-special-chars', category: '형식', label: '특수문자 미사용', passed: !hasSpecialChars, severity: 'warning', detail: hasSpecialChars ? '일부 ATS에서 인식하지 못하는 특수문자가 있습니다' : undefined });
  if (hasSpecialChars) {
    issues.push({ severity: 'warning', section: '형식', message: '특수문자 사용 감지', tip: '일부 ATS는 특수문자(", ", -, -, 등)를 인식하지 못합니다. 표준 문자를 사용하세요.' });
    score -= 3;
  }

  // Header/footer content check (checking for content in header-like positions - name/summary)
  const nameHasExtraInfo = pi.name && (pi.name.includes('|') || pi.name.includes('/') || pi.name.length > 30);
  checklist.push({ id: 'clean-header', category: '형식', label: '깔끔한 헤더 (이름만)', passed: !nameHasExtraInfo, severity: 'info', detail: nameHasExtraInfo ? '이름 필드에 추가 정보가 포함되어 있습니다' : undefined });
  if (nameHasExtraInfo) {
    issues.push({ severity: 'info', section: '형식', message: '이름 필드에 불필요한 정보 포함', tip: '이름 필드에는 이름만 입력하세요. 추가 정보는 적절한 섹션에 넣으세요.' });
    score -= 2;
  }

  // ============================================================
  // DATE FORMAT CONSISTENCY CHECK (NEW)
  // ============================================================
  const allDates: string[] = [];
  resume.experiences.forEach(e => { if (e.startDate) allDates.push(e.startDate); if (e.endDate) allDates.push(e.endDate); });
  resume.educations.forEach(e => { if (e.startDate) allDates.push(e.startDate); if (e.endDate) allDates.push(e.endDate); });
  resume.projects.forEach(p => { if (p.startDate) allDates.push(p.startDate); if (p.endDate) allDates.push(p.endDate); });

  const datesConsistent = isConsistentDateFormat(allDates);
  checklist.push({ id: 'date-format', category: '형식', label: '날짜 형식 일관성', passed: datesConsistent, severity: 'warning', detail: datesConsistent ? undefined : '날짜 형식이 일관되지 않습니다' });
  if (!datesConsistent) {
    issues.push({ severity: 'warning', section: '형식', message: '날짜 형식이 일관되지 않음', tip: 'ATS는 일관된 날짜 형식을 선호합니다. YYYY-MM 또는 YYYY.MM 형식으로 통일하세요.' });
    score -= 4;
  }

  // ============================================================
  // SECTION HEADINGS CHECK (NEW)
  // ============================================================
  const hasSufficientSections = (
    resume.experiences.length > 0 ||
    resume.educations.length > 0 ||
    resume.skills.length > 0 ||
    resume.projects.length > 0
  );
  const sectionCount = [
    resume.experiences.length > 0,
    resume.educations.length > 0,
    resume.skills.length > 0,
    resume.projects.length > 0,
    resume.certifications.length > 0,
    resume.activities.length > 0,
  ].filter(Boolean).length;

  checklist.push({
    id: 'sections',
    category: '구조',
    label: '주요 섹션 3개 이상',
    passed: sectionCount >= 3,
    severity: 'warning',
    detail: `${sectionCount}개 섹션 사용 중`,
  });
  if (sectionCount < 3) {
    issues.push({ severity: 'warning', section: '구조', message: `이력서 섹션이 ${sectionCount}개로 부족합니다`, tip: 'ATS는 경력, 학력, 기술 등 표준 섹션을 기대합니다. 최소 3개 이상의 섹션을 작성하세요.' });
    score -= 5;
  }

  // ============================================================
  // CONTENT LENGTH CHECK
  // ============================================================
  const textLength = plainText.length;
  if (textLength < 500) {
    issues.push({ severity: 'warning', section: '전체', message: '이력서 내용이 너무 짧습니다', tip: '충분한 정보를 제공해야 ATS가 키워드를 매칭할 수 있습니다.' });
    checklist.push({ id: 'length', category: '전체', label: '충분한 내용 (500자+)', passed: false, severity: 'warning', detail: `현재 ${textLength}자` });
    score -= 10;
  } else {
    checklist.push({ id: 'length', category: '전체', label: '충분한 내용 (500자+)', passed: true, severity: 'info', detail: `${textLength}자` });
  }

  // ============================================================
  // QUANTIFIABLE ACHIEVEMENTS CHECK (NEW)
  // ============================================================
  const allDescriptions = [
    ...resume.experiences.map(e => e.description || ''),
    ...resume.projects.map(p => p.description || ''),
  ].join(' ');
  const hasNumbers = /\d+%|\d+명|\d+건|\d+만|\d+억|\d+배|\d+개/.test(stripHtml(allDescriptions));
  checklist.push({ id: 'quantifiable', category: '내용', label: '수치화된 성과 포함', passed: hasNumbers, severity: 'info', detail: hasNumbers ? undefined : '성과를 수치로 표현하면 더 효과적입니다' });
  if (!hasNumbers && resume.experiences.length > 0) {
    issues.push({ severity: 'info', section: '내용', message: '수치화된 성과가 없습니다', tip: '성과를 수치로 표현하면 ATS 점수와 인사 담당자의 관심도가 높아집니다. (예: "매출 20% 증가", "사용자 1만명 확보")' });
    score -= 3;
  }

  // ============================================================
  // ACTION VERBS CHECK (NEW)
  // ============================================================
  const actionVerbs = ['개발', '설계', '구현', '주도', '이끌', '달성', '개선', '최적화', '자동화', '도입', '구축', '관리', '분석', '기획', '운영'];
  const descPlainText = stripHtml(allDescriptions).toLowerCase();
  const usedActionVerbs = actionVerbs.filter(v => descPlainText.includes(v));
  const hasActionVerbs = usedActionVerbs.length >= 2;
  checklist.push({ id: 'action-verbs', category: '내용', label: '행동 동사 사용', passed: hasActionVerbs, severity: 'info', detail: hasActionVerbs ? `${usedActionVerbs.join(', ')} 사용` : '경력 설명에 행동 동사를 사용하세요' });

  // ============================================================
  // KEYWORD DENSITY ANALYSIS (NEW)
  // ============================================================
  const keywordDensity: KeywordDensity[] = [];
  const skillKeywords: string[] = [];
  resume.skills.forEach(s => {
    s.items.split(',').forEach(item => {
      const trimmed = item.trim();
      if (trimmed) skillKeywords.push(trimmed);
    });
  });

  const totalWords = plainText.split(/\s+/).length;
  for (const kw of skillKeywords.slice(0, 15)) {
    const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = plainText.match(regex);
    const count = matches ? matches.length : 0;
    const density = totalWords > 0 ? (count / totalWords) * 100 : 0;

    let recommendation: 'good' | 'low' | 'high' = 'good';
    if (count <= 1) recommendation = 'low';
    else if (density > 5) recommendation = 'high';

    keywordDensity.push({ keyword: kw, count, density: Math.round(density * 100) / 100, recommendation });
  }

  // Sort: low recommendations first so user sees what to fix
  keywordDensity.sort((a, b) => {
    const order = { low: 0, high: 1, good: 2 };
    return order[a.recommendation] - order[b.recommendation];
  });

  // ============================================================
  // FINAL SCORE
  // ============================================================
  score = Math.max(0, Math.min(100, score));
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  return { score, grade, issues, passed, checklist, keywordDensity };
}
