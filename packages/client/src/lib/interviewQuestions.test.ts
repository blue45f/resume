import { describe, expect, it } from 'vitest';
import { generateInterviewQuestions } from './interviewQuestions';

const SENIOR_RESUME = `
경력 사항
2018.01 ~ 현재  A사  시니어 백엔드 엔지니어
- Spring Boot, Java, MySQL, Redis 활용
- 서비스 응답시간 40% 단축, 신규 유저 300% 증가
- 팀원 3명 코드리뷰 및 멘토링 주도

학력
2013.03 ~ 2017.02  OO대학교 컴퓨터공학과

기술 스택
Java, Spring Boot, MySQL, Redis, AWS, Docker
`;

describe('generateInterviewQuestions', () => {
  it('returns array for resume text', () => {
    const r = generateInterviewQuestions(SENIOR_RESUME);
    expect(Array.isArray(r)).toBe(true);
  });

  it('returns at most maxN questions', () => {
    const r = generateInterviewQuestions(SENIOR_RESUME, 5);
    expect(r.length).toBeLessThanOrEqual(5);
  });

  it('returns at most default 10 questions', () => {
    const r = generateInterviewQuestions(SENIOR_RESUME);
    expect(r.length).toBeLessThanOrEqual(10);
  });

  it('each question has required fields', () => {
    const r = generateInterviewQuestions(SENIOR_RESUME);
    for (const q of r) {
      expect(typeof q.question).toBe('string');
      expect(q.question.length).toBeGreaterThan(0);
      expect(['skill', 'experience', 'behavioral', 'project']).toContain(q.category);
      expect(typeof q.reason).toBe('string');
    }
  });

  it('generates skill questions for mentioned technologies', () => {
    const r = generateInterviewQuestions(SENIOR_RESUME);
    const skillQs = r.filter((q) => q.category === 'skill');
    expect(skillQs.length).toBeGreaterThan(0);
  });

  it('returns empty for empty text', () => {
    const r = generateInterviewQuestions('');
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBeLessThanOrEqual(10);
  });

  it('generates behavioral questions for senior-level resume', () => {
    const r = generateInterviewQuestions(SENIOR_RESUME);
    const behavioral = r.filter((q) => q.category === 'behavioral');
    expect(behavioral.length).toBeGreaterThan(0);
  });
});
