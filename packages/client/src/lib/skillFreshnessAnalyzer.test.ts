import { describe, expect, it } from 'vitest';
import { analyzeSkillFreshness } from './skillFreshnessAnalyzer';

describe('analyzeSkillFreshness', () => {
  it('returns clean for empty text', () => {
    const r = analyzeSkillFreshness('');
    expect(r.legacyCount).toBe(0);
    expect(r.agingCount).toBe(0);
  });

  it('returns clean for modern tech stack', () => {
    const text = 'React TypeScript Next.js Docker Kubernetes PostgreSQL';
    const r = analyzeSkillFreshness(text);
    expect(r.legacyCount).toBe(0);
    expect(r.agingCount).toBe(0);
  });

  it('detects Flash as legacy', () => {
    const text = 'Flash ActionScript 개발 경험. Adobe Flash 기반 UI 구현.';
    const r = analyzeSkillFreshness(text);
    expect(r.legacySkills.some((s) => s.skill.includes('Flash'))).toBe(true);
    expect(r.legacySkills[0].age).toBe('legacy');
  });

  it('detects SVN as legacy', () => {
    const text = 'SVN, Git 형상 관리 경험. Subversion 기반 협업.';
    const r = analyzeSkillFreshness(text);
    expect(r.legacySkills.some((s) => s.skill.includes('SVN'))).toBe(true);
  });

  it('detects IE compatibility as legacy', () => {
    const text = 'IE11 크로스브라우저 대응. Internet Explorer 호환 개발.';
    const r = analyzeSkillFreshness(text);
    expect(r.legacySkills.some((s) => s.skill.includes('IE'))).toBe(true);
  });

  it('detects jQuery as aging', () => {
    const text = 'jQuery 기반 SPA 개발. Ajax 비동기 처리.';
    const r = analyzeSkillFreshness(text);
    expect(r.agingSkills.some((s) => s.skill.includes('jQuery'))).toBe(true);
    expect(r.agingSkills[0].age).toBe('aging');
  });

  it('detects AngularJS (1.x) as aging', () => {
    const text = 'AngularJS 1.x 기반 프론트엔드 개발. $scope 패턴 사용.';
    const r = analyzeSkillFreshness(text);
    expect(r.agingSkills.some((s) => s.skill.includes('AngularJS'))).toBe(true);
  });

  it('provides modern alternative when available', () => {
    const text = 'Flash 기반 인터랙티브 콘텐츠 제작.';
    const r = analyzeSkillFreshness(text);
    expect(r.legacySkills[0].modernAlternative).toBeTruthy();
  });

  it('suggestion mentions EOL count when multiple legacy skills', () => {
    const text = 'Flash ActionScript 개발. SVN 형상관리. IE11 대응.';
    const r = analyzeSkillFreshness(text);
    expect(r.legacyCount).toBeGreaterThanOrEqual(2);
    expect(r.suggestion).toContain('EOL');
  });
});
