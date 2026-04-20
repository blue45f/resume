/**
 * 예상 면접 질문 생성 모듈 — koreanChecker.ts 에서 분리.
 *
 * 이력서에서 감지된 스킬·경력 레벨·정량 지표·액션 동사 비율을 바탕으로
 * 룰-기반 면접 질문을 생성. LLM 없이 동작하는 가벼운 면접 준비 도우미.
 */

import { detectSkillMentions } from './jdKeywords';
import { estimateJobLevel } from './resumeScoring';
import { analyzeActionVerbs, analyzeQuantification } from './achievementSignals';

export interface InterviewQuestion {
  question: string;
  category: 'skill' | 'experience' | 'behavioral' | 'project';
  reason: string;
}

export function generateInterviewQuestions(text: string, maxN = 10): InterviewQuestion[] {
  const skills = detectSkillMentions(text, 5);
  const level = estimateJobLevel(text);
  const actionVerbs = analyzeActionVerbs(text);
  const quant = analyzeQuantification(text);
  const questions: InterviewQuestion[] = [];

  for (const s of skills.slice(0, 3)) {
    questions.push({
      question: `${s.skill} 를 사용하며 겪은 가장 어려웠던 문제와 해결 과정은?`,
      category: 'skill',
      reason: `이력서에 ${s.count}회 언급된 핵심 스킬`,
    });
  }

  if (level.level === 'lead') {
    questions.push({
      question: '팀을 리딩하면서 가장 어려웠던 의사결정은 무엇이었습니까?',
      category: 'behavioral',
      reason: '리드 레벨 — 리더십 검증',
    });
    questions.push({
      question: '구성원 간 갈등을 어떻게 조정했나요?',
      category: 'behavioral',
      reason: '리드 레벨 — 팀 관리',
    });
  } else if (level.level === 'senior') {
    questions.push({
      question: '주니어 엔지니어에게 가장 자주 하는 피드백은 무엇인가요?',
      category: 'behavioral',
      reason: '시니어 — 멘토링 역량',
    });
    questions.push({
      question: '기술 부채를 어떻게 관리해 왔나요?',
      category: 'experience',
      reason: '시니어 — 시스템 판단력',
    });
  } else if (level.level === 'mid') {
    questions.push({
      question: '최근 주도적으로 개선한 프로젝트의 구체 성과는?',
      category: 'project',
      reason: '미드 — 오너십·성과',
    });
  } else {
    questions.push({
      question: '학교/개인 프로젝트에서 가장 배운 점 한 가지만 꼽는다면?',
      category: 'experience',
      reason: '주니어 — 학습 속도',
    });
  }

  if (quant.level === 'none' || quant.level === 'low') {
    questions.push({
      question: '이력서에 수치화된 성과가 부족합니다. 가장 인상 깊은 결과를 숫자로 설명해 주세요.',
      category: 'project',
      reason: '정량 지표 부족 → 구체 결과 확인',
    });
  }

  if (actionVerbs.strong + actionVerbs.weak >= 3 && actionVerbs.ratio < 0.5) {
    questions.push({
      question: '"담당/참여" 같은 표현이 많은데, 실제로 본인이 주도한 업무는 어느 정도 비율인가요?',
      category: 'behavioral',
      reason: '약한 동사 비율 높음 → 주도성 확인',
    });
  }

  const fallbacks: InterviewQuestion[] = [
    {
      question: '3년 후 커리어 목표는 무엇인가요?',
      category: 'behavioral',
      reason: '장기 비전',
    },
    {
      question: '실패했던 프로젝트와 배운 점을 말해 주세요.',
      category: 'behavioral',
      reason: '성장 마인드셋',
    },
    {
      question: '다른 팀과의 협업에서 가장 만족스러웠던 경험은?',
      category: 'behavioral',
      reason: '협업 역량',
    },
  ];
  for (const q of fallbacks) {
    if (questions.length >= maxN) break;
    questions.push(q);
  }

  return questions.slice(0, maxN);
}
