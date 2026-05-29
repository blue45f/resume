/**
 * 자기소개서 종합 점수 — 구성·구조·마무리(CTA)·톤 4개 축을 0~100으로 종합한다.
 * 흐름 맵(구조 시각화)과 달리 "전반 완성도 점수"를 한 숫자로 보여주기 위한 모델.
 */

import { checkCoverLetterCoverage } from './coverLetterCoverageChecker';
import { buildCoverLetterStructureReport } from './coverLetterStructure';
import { detectCoverLetterCta } from './coverLetterCtaDetector';
import { detectCoverLetterNegativeFraming } from './coverLetterNegativeFramingDetector';

export type CoverLetterScoreAxisKey = 'coverage' | 'structure' | 'closing' | 'tone';

export interface CoverLetterScoreAxis {
  key: CoverLetterScoreAxisKey;
  label: string;
  score: number; // 0–100
  weight: number; // 정규화 가중치(합=1) — 개선 플랜이 임팩트 계산에 재사용
}

export type CoverLetterScoreGrade = 'excellent' | 'good' | 'fair' | 'weak';

export interface CoverLetterScoreReport {
  axes: CoverLetterScoreAxis[];
  overall: number; // 0–100
  grade: CoverLetterScoreGrade;
  headline: string;
}

const AXIS_LABEL: Record<CoverLetterScoreAxisKey, string> = {
  coverage: '구성',
  structure: '구조',
  closing: '마무리',
  tone: '톤',
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function buildCoverLetterScore(text: string): CoverLetterScoreReport {
  const t = (text ?? '').trim();

  // 구성: 4대 블록 중 포함 수
  const coverage = clamp((checkCoverLetterCoverage(t).presentCount / 4) * 100);

  // 구조: 단락·오프닝·CTA 등 5축 구조 점수
  const structure = clamp(buildCoverLetterStructureReport(t).score);

  // 마무리(CTA)
  const cta = detectCoverLetterCta(t);
  const closing = { strong: 100, present: 70, weak: 40, absent: 15 }[cta.strength];

  // 톤(부정 프레이밍 없는 정도)
  const neg = detectCoverLetterNegativeFraming(t);
  const tone = { clean: 100, minor: 60, concerning: 25 }[neg.grade];

  // 가중치: 구성·구조에 약간 더 비중. 정규화(합=1)해 axis.weight 로 노출 → 개선 플랜이 재사용.
  const rawWeights: Record<CoverLetterScoreAxisKey, number> = {
    coverage: 1.2,
    structure: 1.2,
    closing: 0.8,
    tone: 0.8,
  };
  const weightTotal = Object.values(rawWeights).reduce((s, w) => s + w, 0);
  const scoreByKey: Record<CoverLetterScoreAxisKey, number> = {
    coverage,
    structure,
    closing: clamp(closing),
    tone: clamp(tone),
  };
  const axes: CoverLetterScoreAxis[] = (
    ['coverage', 'structure', 'closing', 'tone'] as CoverLetterScoreAxisKey[]
  ).map((key) => ({
    key,
    label: AXIS_LABEL[key],
    score: scoreByKey[key],
    weight: rawWeights[key] / weightTotal,
  }));
  const overall = clamp(axes.reduce((sum, a) => sum + a.score * a.weight, 0));

  let grade: CoverLetterScoreGrade;
  if (overall >= 80) grade = 'excellent';
  else if (overall >= 62) grade = 'good';
  else if (overall >= 45) grade = 'fair';
  else grade = 'weak';

  const weakest = axes.reduce((worst, a) => (a.score < worst.score ? a : worst), axes[0]);
  const GRADE_HEADLINE: Record<CoverLetterScoreGrade, string> = {
    excellent: '완성도 높은 자기소개서입니다.',
    good: '전반적으로 좋습니다. 약한 축만 다듬으면 됩니다.',
    fair: '기본은 갖췄으나 보완이 필요합니다.',
    weak: '여러 축에서 보강이 필요합니다.',
  };
  let headline = GRADE_HEADLINE[grade];
  if (grade !== 'excellent') headline += ` '${weakest.label}'부터 손보세요.`;

  return { axes, overall, grade, headline };
}
