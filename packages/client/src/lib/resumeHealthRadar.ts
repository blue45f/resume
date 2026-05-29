/**
 * 이력서 건강 레이더 — 여러 분석기를 6개 축으로 종합해 한눈에 보는 점수 모델.
 *
 * 개별 패널이 "무엇이 문제인가"를 알려준다면, 레이더는 "전반적으로 어디가 강하고
 * 어디가 약한가"를 시각적으로 요약한다.
 */

import { analyzeQuantification, analyzeActionVerbs } from './achievementSignals';
import { scoreSpecificity, scoreResumeCompleteness } from './resumeScoring';
import { checkResumeContributionClarity } from './resumeContributionClarityChecker';
import { analyzeReadability } from './readabilityAnalyzers';

export type RadarAxisKey =
  | 'quantification'
  | 'actionVerbs'
  | 'specificity'
  | 'completeness'
  | 'contribution'
  | 'readability';

export interface RadarAxis {
  key: RadarAxisKey;
  label: string;
  score: number; // 0–100
}

export type RadarGrade = 'excellent' | 'good' | 'fair' | 'weak';

export interface ResumeHealthRadarReport {
  axes: RadarAxis[];
  overall: number; // 0–100
  grade: RadarGrade;
  topStrength: RadarAxis | null;
  topWeakness: RadarAxis | null;
  headline: string;
}

const AXIS_LABEL: Record<RadarAxisKey, string> = {
  quantification: '정량성',
  actionVerbs: '액션동사',
  specificity: '구체성',
  completeness: '구성 완성도',
  contribution: '기여 명확성',
  readability: '가독성',
};

const LEVEL3 = { low: 35, medium: 65, high: 90 } as const;

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function buildResumeHealthRadar(text: string): ResumeHealthRadarReport {
  const t = (text ?? '').trim();

  // 1. 정량성
  const q = analyzeQuantification(t);
  const quantification = { none: 15, low: 42, medium: 70, high: 92 }[q.level];

  // 2. 액션동사
  const av = analyzeActionVerbs(t);
  const actionVerbs = av.strong + av.weak === 0 ? 45 : LEVEL3[av.level];

  // 3. 구체성
  const specificity = clamp(scoreSpecificity(t).overall);

  // 4. 구성 완성도
  const completeness = clamp(scoreResumeCompleteness(t).overall);

  // 5. 기여 명확성
  const cc = checkResumeContributionClarity(t);
  const contribution = { clear: 88, mixed: 55, unclear: 25 }[cc.clarity];

  // 6. 가독성
  const readability = clamp(analyzeReadability(t).readabilityScore);

  const axes: RadarAxis[] = [
    { key: 'quantification', label: AXIS_LABEL.quantification, score: clamp(quantification) },
    { key: 'actionVerbs', label: AXIS_LABEL.actionVerbs, score: clamp(actionVerbs) },
    { key: 'specificity', label: AXIS_LABEL.specificity, score: specificity },
    { key: 'completeness', label: AXIS_LABEL.completeness, score: completeness },
    { key: 'contribution', label: AXIS_LABEL.contribution, score: clamp(contribution) },
    { key: 'readability', label: AXIS_LABEL.readability, score: readability },
  ];

  const overall = clamp(axes.reduce((sum, a) => sum + a.score, 0) / axes.length);

  let grade: RadarGrade;
  if (overall >= 80) grade = 'excellent';
  else if (overall >= 62) grade = 'good';
  else if (overall >= 45) grade = 'fair';
  else grade = 'weak';

  // Strength / weakness — only meaningful with some content.
  let topStrength: RadarAxis | null = null;
  let topWeakness: RadarAxis | null = null;
  if (t.length >= 40) {
    topStrength = axes.reduce((best, a) => (a.score > best.score ? a : best), axes[0]);
    topWeakness = axes.reduce((worst, a) => (a.score < worst.score ? a : worst), axes[0]);
  }

  const GRADE_HEADLINE: Record<RadarGrade, string> = {
    excellent: '전반적으로 매우 탄탄한 이력서입니다.',
    good: '핵심 지표가 양호합니다. 약한 축만 보완하면 좋습니다.',
    fair: '기본기는 갖췄으나 개선 여지가 있습니다.',
    weak: '여러 축에서 보강이 필요합니다.',
  };
  let headline = GRADE_HEADLINE[grade];
  if (topWeakness && (grade === 'fair' || grade === 'weak' || grade === 'good')) {
    headline += ` 특히 '${topWeakness.label}'을(를) 먼저 다듬어 보세요.`;
  }

  return { axes, overall, grade, topStrength, topWeakness, headline };
}
