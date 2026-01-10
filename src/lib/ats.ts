import type { Resume } from '@/types/resume';

interface AtsIssue {
  severity: 'error' | 'warning' | 'info';
  section: string;
  message: string;
  tip: string;
}

interface AtsResult {
  score: number; // 0-100
  grade: string; // A-F
  issues: AtsIssue[];
  passed: string[];
}

export function analyzeAtsCompatibility(resume: Resume): AtsResult {
  const issues: AtsIssue[] = [];
  const passed: string[] = [];
  let score = 100;

  const pi = resume.personalInfo;

  // Contact Info checks
  if (!pi.email) {
    issues.push({ severity: 'error', section: '인적사항', message: '이메일 누락', tip: '채용 담당자가 연락할 수 없습니다. 이메일을 반드시 입력하세요.' });
    score -= 15;
  } else passed.push('이메일 입력됨');

  if (!pi.phone) {
    issues.push({ severity: 'error', section: '인적사항', message: '연락처 누락', tip: '전화번호를 입력하면 합격률이 높아집니다.' });
    score -= 10;
  } else passed.push('연락처 입력됨');

  if (!pi.name) {
    issues.push({ severity: 'error', section: '인적사항', message: '이름 누락', tip: 'ATS는 이름이 없으면 이력서를 처리할 수 없습니다.' });
    score -= 20;
  } else passed.push('이름 입력됨');

  // Summary check
  if (!pi.summary || pi.summary.replace(/<[^>]*>/g, '').trim().length < 50) {
    issues.push({ severity: 'warning', section: '자기소개', message: '자기소개가 너무 짧습니다', tip: '50자 이상의 자기소개를 작성하면 ATS 통과율이 높아집니다. 핵심 역량과 경력 요약을 포함하세요.' });
    score -= 8;
  } else passed.push('자기소개 충분');

  // Experience checks
  if (resume.experiences.length === 0) {
    issues.push({ severity: 'error', section: '경력', message: '경력 섹션이 비어있습니다', tip: '최소 1개 이상의 경력을 입력하세요. 신입이라면 인턴/아르바이트도 포함하세요.' });
    score -= 15;
  } else {
    passed.push(`경력 ${resume.experiences.length}개 입력됨`);

    for (const exp of resume.experiences) {
      if (!exp.startDate) {
        issues.push({ severity: 'warning', section: '경력', message: `"${exp.company}" 시작일 누락`, tip: 'ATS는 근무 기간을 파싱합니다. 날짜를 입력하세요.' });
        score -= 3;
      }
      if (!exp.description || exp.description.replace(/<[^>]*>/g, '').trim().length < 30) {
        issues.push({ severity: 'warning', section: '경력', message: `"${exp.company}" 업무 설명이 부족합니다`, tip: '구체적인 성과와 수치를 포함한 설명을 작성하세요. (예: "매출 20% 증가 기여")' });
        score -= 5;
      }
    }
  }

  // Education check
  if (resume.educations.length === 0) {
    issues.push({ severity: 'warning', section: '학력', message: '학력 정보 없음', tip: '학력 정보는 대부분의 ATS에서 필수 필드입니다.' });
    score -= 5;
  } else passed.push('학력 입력됨');

  // Skills check
  if (resume.skills.length === 0) {
    issues.push({ severity: 'error', section: '기술', message: '기술 스택 누락', tip: 'ATS는 키워드 매칭으로 이력서를 필터링합니다. 기술 스택을 반드시 입력하세요.' });
    score -= 15;
  } else {
    const totalSkills = resume.skills.reduce((sum, s) => sum + s.items.split(',').length, 0);
    if (totalSkills < 5) {
      issues.push({ severity: 'warning', section: '기술', message: `기술 키워드가 ${totalSkills}개로 적습니다`, tip: '최소 5-10개의 기술 키워드를 입력하면 ATS 매칭률이 높아집니다.' });
      score -= 5;
    } else passed.push(`기술 키워드 ${totalSkills}개`);
  }

  // Formatting checks
  const allText = JSON.stringify(resume);
  if (allText.includes('<table') || allText.includes('<img')) {
    issues.push({ severity: 'warning', section: '형식', message: '표/이미지 사용', tip: 'ATS는 표와 이미지를 파싱하지 못할 수 있습니다. 텍스트 기반으로 작성하세요.' });
    score -= 5;
  }

  // Length check
  const textLength = allText.replace(/<[^>]*>/g, '').length;
  if (textLength < 500) {
    issues.push({ severity: 'warning', section: '전체', message: '이력서 내용이 너무 짧습니다', tip: '충분한 정보를 제공해야 ATS가 키워드를 매칭할 수 있습니다.' });
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  return { score, grade, issues, passed };
}
