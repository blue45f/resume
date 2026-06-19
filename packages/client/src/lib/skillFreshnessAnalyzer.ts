/**
 * 기술 스택 신선도 분석 모듈.
 *
 * 제공:
 * - analyzeSkillFreshness: 이력서의 기술 스택 중 구식(deprecated/legacy) 기술 감지
 *
 * 관련 타입: SkillFreshnessReport.
 */

export type SkillAge = 'legacy' | 'aging' | 'current'

export interface SkillFreshnessItem {
  skill: string
  age: SkillAge
  note: string
  modernAlternative?: string
}

export interface SkillFreshnessReport {
  legacySkills: SkillFreshnessItem[]
  agingSkills: SkillFreshnessItem[]
  legacyCount: number
  agingCount: number
  suggestion: string
}

// ---------------------------------------------------------------------------
// Legacy skill definitions
// ---------------------------------------------------------------------------

interface LegacyDef {
  re: RegExp
  skill: string
  age: SkillAge
  note: string
  modernAlternative?: string
}

const LEGACY_SKILLS: LegacyDef[] = [
  // Seriously outdated
  {
    re: /\bFlash\b|Adobe Flash|ActionScript/i,
    skill: 'Flash / ActionScript',
    age: 'legacy',
    note: '2020년 Adobe에 의해 EOL 처리됨',
    modernAlternative: 'HTML5, CSS 애니메이션, WebGL',
  },
  {
    re: /\bJSP\b.*\bStruts\b|\bStruts\b.*\bJSP\b|\bStruts\s*[12]/i,
    skill: 'Struts',
    age: 'legacy',
    note: 'Apache Struts 1은 EOL. 보안 취약점으로 기피됨',
    modernAlternative: 'Spring MVC, Spring Boot',
  },
  {
    re: /\bEJB\b(?!\s*(?:lookup|interface))/i,
    skill: 'EJB (Enterprise JavaBeans)',
    age: 'legacy',
    note: 'EJB 2.x는 사실상 구식. Spring이 대체',
    modernAlternative: 'Spring Framework, CDI',
  },
  {
    re: /\bSVN\b|Subversion/i,
    skill: 'SVN / Subversion',
    age: 'legacy',
    note: '대부분 Git으로 전환됨',
    modernAlternative: 'Git',
  },
  {
    re: /\bCVS\b(?!-)/i,
    skill: 'CVS',
    age: 'legacy',
    note: 'CVS는 거의 사용되지 않음',
    modernAlternative: 'Git',
  },
  {
    re: /\bColdFusion\b/i,
    skill: 'ColdFusion',
    age: 'legacy',
    note: '주류 시장에서 퇴장한 서버사이드 기술',
    modernAlternative: 'Node.js, Spring Boot',
  },
  {
    re: /\bPerl\b.*\bweb\b|\bCGI\b.*\bPerl\b/i,
    skill: 'Perl CGI',
    age: 'legacy',
    note: 'Perl CGI 웹 개발은 실질적으로 종료됨',
    modernAlternative: 'Python/FastAPI, Node.js',
  },
  {
    re: /\bSilverlight\b/i,
    skill: 'Silverlight',
    age: 'legacy',
    note: 'Microsoft가 EOL 처리. 브라우저 지원 종료',
    modernAlternative: 'HTML5, WebAssembly',
  },
  {
    re: /Internet\s*Explorer|IE\s*(?:6|7|8|9|10|11)(?:\b|[^+])/i,
    skill: 'IE 호환성',
    age: 'legacy',
    note: 'IE는 Microsoft가 2022년 6월 완전 종료',
    modernAlternative: 'Modern browser support (Chrome/Edge/Firefox)',
  },

  // Aging — still used but declining
  {
    re: /\bjQuery\b(?!\s*(?:UI|Mobile))/i,
    skill: 'jQuery',
    age: 'aging',
    note: 'jQuery는 여전히 존재하나 SPA 프레임워크로 대체 추세',
    modernAlternative: 'React, Vue, Vanilla JS',
  },
  {
    re: /\bAngularJS\b|Angular\s*1\.[x\d]/i,
    skill: 'AngularJS (Angular 1.x)',
    age: 'aging',
    note: 'AngularJS는 2022년 EOL. Angular 2+는 무관',
    modernAlternative: 'Angular (v14+), React, Vue',
  },
  {
    re: /\bGulp\b|\bGrunt\.js\b/i,
    skill: 'Gulp / Grunt',
    age: 'aging',
    note: 'Webpack, Vite, esbuild으로 대부분 대체됨',
    modernAlternative: 'Vite, Webpack, esbuild',
  },
  {
    re: /\bBower\b/i,
    skill: 'Bower',
    age: 'aging',
    note: 'npm/yarn으로 전환 권고; 공식적으로 유지보수 중단',
    modernAlternative: 'npm, pnpm, yarn',
  },
  {
    re: /\bMoment\.js\b/i,
    skill: 'Moment.js',
    age: 'aging',
    note: '공식적으로 레거시 선언. 번들 크기 큰 편',
    modernAlternative: 'date-fns, dayjs, Luxon',
  },
  {
    re: /\bBackbone\.js\b|\bBackbone\b/i,
    skill: 'Backbone.js',
    age: 'aging',
    note: 'SPA 프레임워크로 대체됨',
    modernAlternative: 'React, Vue',
  },
  {
    re: /\bMeteor\.js\b|\bMeteor\b/i,
    skill: 'Meteor.js',
    age: 'aging',
    note: '커뮤니티·생태계 축소',
    modernAlternative: 'Next.js, SvelteKit',
  },
  {
    re: /\bPHP\s*(?:5\.[0-9]|4|3)\b/i,
    skill: 'PHP 5.x / 4.x',
    age: 'aging',
    note: 'PHP 5는 EOL. PHP 8.x 사용 권장',
    modernAlternative: 'PHP 8.x, Laravel',
  },
]

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

/**
 * 이력서 텍스트에서 구식 기술 스택을 감지하고 현대 대안을 제안.
 */
export function analyzeSkillFreshness(text: string): SkillFreshnessReport {
  const t = text ?? ''

  const hits: SkillFreshnessItem[] = LEGACY_SKILLS.filter(({ re }) => re.test(t)).map(
    ({ skill, age, note, modernAlternative }) => ({
      skill,
      age,
      note,
      modernAlternative,
    })
  )

  const legacySkills = hits.filter((h) => h.age === 'legacy')
  const agingSkills = hits.filter((h) => h.age === 'aging')

  let suggestion: string
  if (legacySkills.length >= 2) {
    suggestion = `EOL 기술 ${legacySkills.length}개가 감지되었습니다. 현대 기술로 대체하거나 사용 기간을 명시하세요.`
  } else if (legacySkills.length === 1) {
    suggestion = `"${legacySkills[0].skill}"은 EOL 기술입니다. 현재도 사용 중이라면 컨텍스트를 명시하세요.`
  } else if (agingSkills.length >= 2) {
    suggestion = `사용 빈도가 낮아지는 기술이 ${agingSkills.length}개 있습니다. 현대 대안도 함께 기재하면 좋습니다.`
  } else if (agingSkills.length === 1) {
    suggestion = `"${agingSkills[0].skill}"은 사용 빈도가 낮아지는 추세입니다. 대안 기술도 기재를 고려하세요.`
  } else {
    suggestion = '구식 기술 스택이 감지되지 않았습니다.'
  }

  return {
    legacySkills,
    agingSkills,
    legacyCount: legacySkills.length,
    agingCount: agingSkills.length,
    suggestion,
  }
}
