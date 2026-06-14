/**
 * JD 기술 스택 노후화 감지기 — 채용공고에 레거시/구식 기술 요구가 포함된 경우
 * 입사 후 기술 부채 환경에 노출될 가능성을 사전에 경고한다.
 */

export type ObsolescenceLevel = 'eol' | 'declining' | 'aging'

export interface ObsoleteTech {
  name: string
  level: ObsolescenceLevel
  reason: string
  modernAlternative: string
  excerpt: string
}

export type TechDebtRisk = 'high' | 'moderate' | 'low' | 'none'

export interface JdTechObsolescenceReport {
  techs: ObsoleteTech[]
  eolCount: number
  decliningCount: number
  agingCount: number
  risk: TechDebtRisk
  summary: string
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

interface TechPattern {
  re: RegExp
  name: string
  level: ObsolescenceLevel
  reason: string
  modernAlternative: string
}

const TECH_PATTERNS: TechPattern[] = [
  // ── EOL / Fully deprecated ───────────────────────────────────────────────
  {
    re: /\bFlash\b|Adobe\s*Flash|ActionScript/i,
    name: 'Flash / ActionScript',
    level: 'eol',
    reason: 'Adobe Flash는 2020년 EOL 선언, 브라우저 지원 완전 종료',
    modernAlternative: 'HTML5, CSS Animation, WebGL',
  },
  {
    re: /\bStruts\s*[12]?\b|\bApache\s*Struts\b/i,
    name: 'Apache Struts',
    level: 'eol',
    reason: '다수의 심각한 CVE 취약점; 현대적인 MVC 프레임워크로 대체 권장',
    modernAlternative: 'Spring MVC, Spring Boot',
  },
  {
    re: /\bSilverlight\b/i,
    name: 'Silverlight',
    level: 'eol',
    reason: 'Microsoft Silverlight 2021년 EOL, 브라우저 플러그인 지원 종료',
    modernAlternative: 'HTML5, React, Vue',
  },
  {
    re: /\bInternet\s*Explorer\b|\bIE\s*[89]\b|\bIE\s*11\b/i,
    name: 'Internet Explorer',
    level: 'eol',
    reason: 'Microsoft IE 2022년 공식 지원 종료; IE 전용 코드 유지 = 높은 기술 부채',
    modernAlternative: 'Chrome, Firefox, Edge 기반 모던 웹 표준',
  },
  {
    re: /\bVBScript\b|Visual\s*Basic\s*Script/i,
    name: 'VBScript',
    level: 'eol',
    reason: 'Microsoft VBScript 2024년 EOL 선언',
    modernAlternative: 'JavaScript / TypeScript',
  },
  {
    re: /(?:Python\s*2|py2)\b/i,
    name: 'Python 2',
    level: 'eol',
    reason: 'Python 2는 2020년 1월 EOL; 보안 패치 없음',
    modernAlternative: 'Python 3.10+',
  },
  {
    re: /\bPHP\s*5\b/i,
    name: 'PHP 5',
    level: 'eol',
    reason: 'PHP 5는 2018년 EOL; 심각한 보안 취약점 방치 위험',
    modernAlternative: 'PHP 8.2+ 또는 Node.js',
  },
  {
    re: /\bRuby\s*on\s*Rails\s*[34]\b|RoR\s*[34]\b/i,
    name: 'Rails 3/4',
    level: 'eol',
    reason: 'Rails 3/4 EOL; 보안 업데이트 없음',
    modernAlternative: 'Rails 7+, Node.js, FastAPI',
  },
  {
    re: /\bAngularJS\b|Angular\s*1\b|Angular\.js/i,
    name: 'AngularJS (1.x)',
    level: 'eol',
    reason: 'AngularJS 2022년 EOL; Google 공식 지원 종료',
    modernAlternative: 'Angular 17+, React, Vue 3',
  },
  {
    re: /\bExtJS\b|\bExt\.js\b|\bSencha\s*Touch\b/i,
    name: 'ExtJS / Sencha',
    level: 'eol',
    reason: '시장 채택률 급감; 채용 시장·커뮤니티 지원 사실상 종료',
    modernAlternative: 'React, Vue, Angular',
  },

  // ── Declining / Nearing EOL ──────────────────────────────────────────────
  {
    re: /\bjQuery\b(?!.*React|.*Vue|.*Alpine)/i,
    name: 'jQuery (standalone)',
    level: 'declining',
    reason: '모던 프레임워크 생태계 외 jQuery 단독 사용은 레거시 환경 신호',
    modernAlternative: 'React, Vue, Svelte',
  },
  {
    re: /\bJSP\b.*(?:MVC|화면|뷰|프론트|UI)|(?:MVC|화면|뷰|프론트|UI).*\bJSP\b/i,
    name: 'JSP (View Layer)',
    level: 'declining',
    reason: '뷰 레이어 JSP 사용은 구식 Java 웹 아키텍처 신호',
    modernAlternative: 'Thymeleaf, React, Vue + REST API',
  },
  {
    re: /\bIBATIS\b|iBATIS/i,
    name: 'iBATIS',
    level: 'declining',
    reason: 'iBATIS는 MyBatis로 대체되어 사실상 비활성 상태',
    modernAlternative: 'MyBatis, JPA/Hibernate',
  },
  {
    re: /\bSVN\b|Subversion|CVS\b(?!.*\w)/i,
    name: 'SVN / CVS',
    level: 'declining',
    reason: '버전 관리에 SVN/CVS 사용 = 현대적 협업 도구 미도입 가능성',
    modernAlternative: 'Git (GitHub, GitLab, Bitbucket)',
  },
  {
    re: /\bANT\b.*(?:빌드|build)|\bbuild\s*tool.*ANT\b/i,
    name: 'Apache Ant',
    level: 'declining',
    reason: 'Ant는 Maven/Gradle로 대체됨; 단독 Ant 사용은 구식 빌드 환경',
    modernAlternative: 'Maven, Gradle',
  },
  {
    re: /\bObjective-C\b.*(?:신규|개발|구현)|(?:신규|개발|구현).*\bObjective-C\b/i,
    name: 'Objective-C (신규 개발)',
    level: 'declining',
    reason: 'iOS 신규 개발에 Obj-C는 Apple도 Swift 전환을 권장',
    modernAlternative: 'Swift',
  },
  {
    re: /\bColdFusion\b|Adobe\s*ColdFusion/i,
    name: 'ColdFusion',
    level: 'declining',
    reason: '채용 시장·커뮤니티 지원 급감, 신규 진입 개발자 확보 어려움',
    modernAlternative: 'Node.js, Spring Boot, Django',
  },
  {
    re: /\bEJB\b.*(?:2|3\.0)|Entity\s*Bean/i,
    name: 'EJB 2.x / Entity Bean',
    level: 'declining',
    reason: 'EJB 2.x는 JPA·Spring으로 대체됨; 유지 중이면 레거시 Java EE 환경',
    modernAlternative: 'Spring Boot + JPA',
  },

  // ── Aging / Still usable but showing age ─────────────────────────────────
  {
    re: /\bJava\s*[67]\b/i,
    name: 'Java 6/7',
    level: 'aging',
    reason: 'Java 6/7은 EOL; 사용 중이면 상당한 기술 부채 환경일 가능성',
    modernAlternative: 'Java 17+ LTS, Kotlin',
  },
  {
    re: /\bMySQL\s*5\.[56]\b/i,
    name: 'MySQL 5.5/5.6',
    level: 'aging',
    reason: 'MySQL 5.5/5.6 EOL; 보안·성능 업그레이드 미비 가능성',
    modernAlternative: 'MySQL 8.0+, PostgreSQL',
  },
  {
    re: /\bWindows\s*Server\s*200[38]\b/i,
    name: 'Windows Server 2003/2008',
    level: 'aging',
    reason: 'EOL된 서버 OS 운영은 보안 취약점 관리 부담 시사',
    modernAlternative: 'Windows Server 2022, Linux',
  },
  {
    re: /\bBootstrap\s*[23]\b/i,
    name: 'Bootstrap 2/3',
    level: 'aging',
    reason: 'Bootstrap 5가 최신; 2/3 유지 중이면 프론트엔드 현대화 지연',
    modernAlternative: 'Bootstrap 5, Tailwind CSS',
  },
]

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function detectJdTechObsolescence(text: string): JdTechObsolescenceReport {
  const t = text ?? ''
  const techs: ObsoleteTech[] = []
  const seenNames = new Set<string>()

  for (const { re, name, level, reason, modernAlternative } of TECH_PATTERNS) {
    const m = t.match(re)
    if (m && !seenNames.has(name)) {
      seenNames.add(name)
      techs.push({ name, level, reason, modernAlternative, excerpt: m[0].slice(0, 50) })
    }
  }

  const eolCount = techs.filter((t) => t.level === 'eol').length
  const decliningCount = techs.filter((t) => t.level === 'declining').length
  const agingCount = techs.filter((t) => t.level === 'aging').length

  let risk: TechDebtRisk
  if (eolCount >= 1 || decliningCount >= 2) {
    risk = 'high'
  } else if (decliningCount >= 1 || agingCount >= 2) {
    risk = 'moderate'
  } else if (agingCount >= 1) {
    risk = 'low'
  } else {
    risk = 'none'
  }

  let summary: string
  if (risk === 'none') {
    summary = '이 공고에서 노후화된 기술 스택이 발견되지 않았습니다.'
  } else if (risk === 'low') {
    summary =
      '일부 노후화 가능성이 있는 기술이 요구됩니다. 시스템 연령 및 현대화 계획을 면접에서 확인하세요.'
  } else if (risk === 'moderate') {
    summary =
      '레거시 또는 쇠퇴 중인 기술이 요구됩니다. 기술 부채 규모와 현대화 로드맵을 반드시 확인하세요.'
  } else {
    summary =
      'EOL(수명 종료) 또는 다수의 쇠퇴 기술이 요구됩니다. 높은 기술 부채 환경일 가능성이 큽니다. 현대화 의지와 자원을 면접에서 심층 검증하세요.'
  }

  return { techs, eolCount, decliningCount, agingCount, risk, summary }
}
