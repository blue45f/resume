import type { Resume } from '@/types/resume';

interface SectionScore {
  label: string;
  score: number;
  maxScore: number;
  tip?: string;
}

export interface CompletenessResult {
  percentage: number;
  grade: string;
  sections: SectionScore[];
  tips: string[];
}

export function calculateCompleteness(resume: Resume): CompletenessResult {
  const sections: SectionScore[] = [];
  const tips: string[] = [];

  // 인적사항 (30점)
  const pi = resume.personalInfo;
  let piScore = 0;
  if (pi.name) piScore += 6;
  else tips.push('이름을 입력하세요');
  if (pi.email) piScore += 5;
  else tips.push('이메일을 입력하세요');
  if (pi.phone) piScore += 4;
  if (pi.summary && pi.summary.length > 30) piScore += 8;
  else if (pi.summary) piScore += 4;
  else tips.push('자기소개를 30자 이상 작성하세요');
  if (pi.address) piScore += 2;
  if (pi.website || pi.github) piScore += 3;
  if (pi.photo) piScore += 2;
  sections.push({ label: '인적사항', score: piScore, maxScore: 30 });

  // 경력 (25점)
  const expCount = resume.experiences.length;
  let expScore = 0;
  if (expCount >= 1) expScore += 10;
  if (expCount >= 2) expScore += 5;
  if (expCount >= 3) expScore += 3;
  const hasDescriptions = resume.experiences.some(
    (e) => e.description && e.description.length > 30,
  );
  if (hasDescriptions) expScore += 5;
  const hasTechStack = resume.experiences.some((e) => e.techStack);
  if (hasTechStack) expScore += 2;
  if (expCount === 0) tips.push('경력 사항을 1개 이상 추가하세요');
  else if (!hasDescriptions) tips.push('경력의 업무 내용을 상세히 작성하세요');
  sections.push({ label: '경력', score: Math.min(expScore, 25), maxScore: 25 });

  // 학력 (10점)
  let eduScore = 0;
  if (resume.educations.length >= 1) eduScore += 7;
  if (resume.educations.length >= 1 && resume.educations[0].degree) eduScore += 3;
  if (resume.educations.length === 0) tips.push('학력을 추가하세요');
  sections.push({ label: '학력', score: eduScore, maxScore: 10 });

  // 기술 (15점)
  let skillScore = 0;
  if (resume.skills.length >= 1) skillScore += 6;
  if (resume.skills.length >= 2) skillScore += 4;
  if (resume.skills.length >= 3) skillScore += 3;
  if (resume.skills.some((s) => s.items && s.items.split(',').length >= 3)) skillScore += 2;
  if (resume.skills.length === 0) tips.push('기술 스택을 추가하세요');
  sections.push({ label: '기술', score: Math.min(skillScore, 15), maxScore: 15 });

  // 프로젝트 (10점)
  let projScore = 0;
  if (resume.projects.length >= 1) projScore += 5;
  if (resume.projects.length >= 2) projScore += 3;
  if (resume.projects.some((p) => p.description && p.description.length > 30)) projScore += 2;
  sections.push({ label: '프로젝트', score: Math.min(projScore, 10), maxScore: 10 });

  // 기타 (10점)
  let etcScore = 0;
  if (resume.certifications.length >= 1) etcScore += 3;
  if (resume.languages.length >= 1) etcScore += 2;
  if (resume.awards.length >= 1) etcScore += 2;
  if (resume.activities.length >= 1) etcScore += 3;
  sections.push({ label: '자격/어학/수상/활동', score: Math.min(etcScore, 10), maxScore: 10 });

  const total = sections.reduce((sum, s) => sum + s.score, 0);
  const max = sections.reduce((sum, s) => sum + s.maxScore, 0);
  const percentage = Math.round((total / max) * 100);

  let grade = 'D';
  if (percentage >= 90) grade = 'S';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 50) grade = 'C';

  return { percentage, grade, sections, tips: tips.slice(0, 5) };
}
