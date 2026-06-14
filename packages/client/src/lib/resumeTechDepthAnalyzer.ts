/**
 * 이력서 기술 깊이 분석기 — 단순 기술명 나열(표면 버즈워드)과
 * 아키텍처 의사결정·트레이드오프·규모 지표·시스템 설계 등 깊이 있는
 * 기술 서술을 구분하여 기술 역량의 실질적 증거를 평가한다.
 */

export type TechDepthSignalType =
  | 'architecture_decision' // 아키텍처 선택 이유 서술
  | 'tradeoff_reasoning' // 트레이드오프·장단점 비교
  | 'scale_metric' // 규모·성능 수치 (TPS/QPS/latency 등)
  | 'system_design' // 시스템 설계·분산 시스템 언급
  | 'optimization_detail' // 최적화 구체적 방법론
  | 'debugging_depth' // 디버깅·장애 원인 분석 경험

export type TechSurfaceType =
  | 'buzzword_list' // "React, Vue, Spring 사용 경험"
  | 'vague_proficiency' // "XX에 대한 깊은 이해"

export interface TechDepthSignal {
  type: TechDepthSignalType
  excerpt: string
}

export interface TechSurfaceSignal {
  type: TechSurfaceType
  excerpt: string
}

export type TechDepthGrade = 'deep' | 'adequate' | 'surface' | 'none'

export interface ResumeTechDepthReport {
  depthSignals: TechDepthSignal[]
  surfaceSignals: TechSurfaceSignal[]
  depthScore: number // 0–100
  surfaceScore: number // 0–100 (높을수록 버즈워드 위주)
  grade: TechDepthGrade
  summary: string
  suggestions: string[]
}

// ---------------------------------------------------------------------------
// Deep signal patterns
// ---------------------------------------------------------------------------

interface DepthPattern {
  re: RegExp
  type: TechDepthSignalType
  weight: number
}

const DEPTH_PATTERNS: DepthPattern[] = [
  // Architecture decision
  {
    re: /(?:MSA|마이크로서비스|모놀리식)\s*(?:전환|도입|설계|선택|결정)/,
    type: 'architecture_decision',
    weight: 20,
  },
  {
    re: /(?:이벤트\s*드리븐|CQRS|이벤트\s*소싱|헥사고날|레이어드)\s*(?:아키텍처|패턴|설계)/,
    type: 'architecture_decision',
    weight: 20,
  },
  {
    re: /(?:도입|선택|채택)\s*이유|(?:기술|아키텍처)\s*선택\s*(?:근거|이유|배경)/,
    type: 'architecture_decision',
    weight: 15,
  },
  {
    re: /기존\s*(?:모놀리식|레거시|구조)\s*(?:한계|문제점|병목)\s*(?:파악|발견|분석)/,
    type: 'architecture_decision',
    weight: 15,
  },

  // Tradeoff reasoning
  {
    re: /(?:CAP\s*이론|일관성|가용성)\s*(?:트레이드오프|선택|우선순위)/,
    type: 'tradeoff_reasoning',
    weight: 20,
  },
  {
    re: /(?:강\s*일관성|최종\s*일관성|Eventually\s*Consistent)\s*(?:선택|적용|채택)/,
    type: 'tradeoff_reasoning',
    weight: 20,
  },
  {
    re: /(?:장단점|trade.off|트레이드오프)\s*(?:분석|비교|검토|고려)/,
    type: 'tradeoff_reasoning',
    weight: 15,
  },
  {
    re: /(?:성능|속도)\s*vs\s*(?:일관성|비용|개발\s*속도)|(?:정합성|확장성)\s*vs\s*(?:성능|비용)/,
    type: 'tradeoff_reasoning',
    weight: 20,
  },

  // Scale / performance metrics
  {
    re: /(?:[0-9,]+\s*(?:TPS|QPS|RPS|req\/s)|초당\s*[0-9,]+\s*(?:요청|트랜잭션|처리))/,
    type: 'scale_metric',
    weight: 25,
  },
  {
    re: /(?:p99|p95|p50)\s*(?:레이턴시|응답\s*시간|latency)\s*(?:[0-9]+\s*ms|마이크로초)/,
    type: 'scale_metric',
    weight: 25,
  },
  {
    re: /(?:월\s*[0-9,]+\s*(?:명|건|회)|일\s*[0-9,]+\s*(?:명|건|MAU|DAU))\s*(?:처리|서비스|운영)/,
    type: 'scale_metric',
    weight: 20,
  },
  {
    re: /(?:[0-9]+억|[0-9,]+만)\s*(?:건|행|row|레코드)\s*(?:처리|관리|저장|마이그레이션)/,
    type: 'scale_metric',
    weight: 20,
  },

  // System design
  {
    re: /(?:분산\s*(?:시스템|캐시|락|트랜잭션)|Distributed\s*(?:System|Cache|Lock))/,
    type: 'system_design',
    weight: 20,
  },
  {
    re: /(?:샤딩|파티셔닝|레플리케이션|복제)\s*(?:전략|설계|구현|적용)/,
    type: 'system_design',
    weight: 20,
  },
  {
    re: /(?:데드락|교착상태|race\s*condition|경쟁\s*조건)\s*(?:해결|방지|처리|분석)/,
    type: 'system_design',
    weight: 20,
  },
  {
    re: /(?:서킷\s*브레이커|Circuit\s*Breaker|배압|Backpressure|벌크헤드|Bulkhead)/,
    type: 'system_design',
    weight: 20,
  },

  // Optimization detail
  {
    re: /N\+1\s*.{0,15}(?:해결|최적화|발견|분석)/,
    type: 'optimization_detail',
    weight: 20,
  },
  {
    re: /(?:인덱스\s*전략|복합\s*인덱스|커버링\s*인덱스)\s*(?:설계|적용|분석)/,
    type: 'optimization_detail',
    weight: 20,
  },
  {
    re: /(?:GC\s*튜닝|메모리\s*누수|힙\s*덤프)\s*(?:분석|해결|최적화)/,
    type: 'optimization_detail',
    weight: 20,
  },
  {
    re: /(?:쿼리\s*실행\s*계획|EXPLAIN|슬로우\s*쿼리)\s*(?:분석|최적화|개선)/,
    type: 'optimization_detail',
    weight: 15,
  },

  // Debugging depth
  {
    re: /(?:스레드\s*덤프|heap\s*dump|flame\s*graph|프로파일링)\s*(?:분석|활용|작성)/,
    type: 'debugging_depth',
    weight: 20,
  },
  {
    re: /(?:장애\s*원인\s*분석|포스트모템|Post.mortem|RCA|근본\s*원인\s*분석)/,
    type: 'debugging_depth',
    weight: 20,
  },
  {
    re: /(?:프로덕션\s*이슈|장애|사고)\s*(?:원인\s*파악|디버깅|트래킹|해결\s*과정)/,
    type: 'debugging_depth',
    weight: 15,
  },
]

// ---------------------------------------------------------------------------
// Surface / buzzword patterns
// ---------------------------------------------------------------------------

interface SurfacePattern {
  re: RegExp
  type: TechSurfaceType
  penalty: number
}

const SURFACE_PATTERNS: SurfacePattern[] = [
  // Buzzword list without context
  {
    re: /(?:Java|Python|React|Vue|Spring|Django)\s*[,·/]\s*(?:Java|Python|React|Vue|Spring|Node|TypeScript|Go)\s*[,·/]/,
    type: 'buzzword_list',
    penalty: 10,
  },
  {
    re: /(?:기술\s*스택|사용\s*기술|활용\s*기술)\s*[:：]\s*(?:[A-Za-z가-힣]+\s*[,·/]\s*){3,}/,
    type: 'buzzword_list',
    penalty: 15,
  },

  // Vague proficiency
  {
    re: /(?:깊은|폭넓은|다양한)\s*(?:이해|경험|지식)\s*(?:보유|있음|있습니다|습니다)/,
    type: 'vague_proficiency',
    penalty: 10,
  },
  {
    re: /(?:능숙하게|잘\s*다룰\s*수\s*있는|자유롭게\s*활용)\s*(?:가능|합니다)/,
    type: 'vague_proficiency',
    penalty: 5,
  },
]

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeResumeTechDepth(text: string): ResumeTechDepthReport {
  const t = text ?? ''
  const depthSignals: TechDepthSignal[] = []
  const surfaceSignals: TechSurfaceSignal[] = []
  let depthRaw = 0
  let surfacePenalty = 0

  const seenDepthTypes = new Set<TechDepthSignalType>()

  for (const { re, type, weight } of DEPTH_PATTERNS) {
    const m = t.match(re)
    if (m) {
      depthSignals.push({ type, excerpt: m[0].slice(0, 70) })
      if (!seenDepthTypes.has(type)) {
        seenDepthTypes.add(type)
        depthRaw += weight
      }
    }
  }

  for (const { re, type, penalty } of SURFACE_PATTERNS) {
    const m = t.match(re)
    if (m) {
      surfaceSignals.push({ type, excerpt: m[0].slice(0, 60) })
      surfacePenalty += penalty
    }
  }

  const depthScore = Math.min(100, depthRaw)
  const surfaceScore = Math.min(100, surfacePenalty)

  let grade: TechDepthGrade
  if (depthScore >= 60) grade = 'deep'
  else if (depthScore >= 25) grade = 'adequate'
  else if (surfaceScore > depthScore) grade = 'surface'
  else grade = 'none'

  let summary: string
  if (grade === 'deep') {
    summary = '아키텍처 의사결정·성능 지표·트레이드오프 등 기술 깊이를 증명하는 서술이 풍부합니다.'
  } else if (grade === 'adequate') {
    summary = '일부 기술 깊이 신호가 있습니다. 더 많은 의사결정 근거와 수치를 추가하면 강해집니다.'
  } else if (grade === 'surface') {
    summary = '기술명 나열 위주입니다. 아키텍처 선택 이유, 성능 수치, 트레이드오프를 서술하세요.'
  } else {
    summary = '기술 역량 관련 내용이 감지되지 않았습니다.'
  }

  const suggestions: string[] = []
  if (!seenDepthTypes.has('scale_metric')) {
    suggestions.push('처리량(TPS/QPS)·지연시간(p99 latency)·사용자 규모 등 수치를 추가하세요.')
  }
  if (!seenDepthTypes.has('architecture_decision')) {
    suggestions.push('기술·아키텍처 선택 이유와 고려한 대안을 명시하세요.')
  }
  if (!seenDepthTypes.has('tradeoff_reasoning')) {
    suggestions.push('장단점 비교나 트레이드오프 분석 경험을 서술하세요.')
  }

  return { depthSignals, surfaceSignals, depthScore, surfaceScore, grade, summary, suggestions }
}
