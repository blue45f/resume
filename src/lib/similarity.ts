export interface SimilarityIssue {
  section: string;
  itemA: string;
  itemB: string;
  similarity: number;
  message: string;
}

function normalize(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function calculateSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.length < 10 || nb.length < 10) return 0;

  // Simple word overlap similarity
  const wordsA = new Set(na.split(' '));
  const wordsB = new Set(nb.split(' '));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}

import type { Resume } from '@/types/resume';

export function findDuplicates(resume: Resume): SimilarityIssue[] {
  const issues: SimilarityIssue[] = [];

  // Check experience descriptions
  const exps = resume.experiences || [];
  for (let i = 0; i < exps.length; i++) {
    for (let j = i + 1; j < exps.length; j++) {
      const sim = calculateSimilarity(exps[i].description, exps[j].description);
      if (sim > 0.6) {
        issues.push({
          section: '경력',
          itemA: exps[i].company,
          itemB: exps[j].company,
          similarity: Math.round(sim * 100),
          message: `"${exps[i].company}"와 "${exps[j].company}"의 업무 설명이 ${Math.round(sim * 100)}% 유사합니다. 차별화된 성과를 작성하세요.`,
        });
      }
    }
  }

  // Check project descriptions
  const projs = resume.projects || [];
  for (let i = 0; i < projs.length; i++) {
    for (let j = i + 1; j < projs.length; j++) {
      const sim = calculateSimilarity(projs[i].description, projs[j].description);
      if (sim > 0.6) {
        issues.push({
          section: '프로젝트',
          itemA: projs[i].name,
          itemB: projs[j].name,
          similarity: Math.round(sim * 100),
          message: `"${projs[i].name}"와 "${projs[j].name}"의 설명이 유사합니다. 각 프로젝트의 고유한 성과를 강조하세요.`,
        });
      }
    }
  }

  // Check if experience and project descriptions overlap
  for (const exp of exps) {
    for (const proj of projs) {
      const sim = calculateSimilarity(exp.description, proj.description);
      if (sim > 0.5) {
        issues.push({
          section: '경력 ↔ 프로젝트',
          itemA: exp.company,
          itemB: proj.name,
          similarity: Math.round(sim * 100),
          message: `경력 "${exp.company}"와 프로젝트 "${proj.name}"의 내용이 겹칩니다. 경력에는 역할, 프로젝트에는 기술적 성과를 분리하세요.`,
        });
      }
    }
  }

  return issues;
}
