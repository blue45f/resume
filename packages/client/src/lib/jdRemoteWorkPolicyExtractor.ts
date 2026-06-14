/**
 * JD 원격근무 정책 추출기 — 채용공고에서 재택/출근/하이브리드 정책을 감지한다.
 */

export type WorkArrangement = 'fully_remote' | 'hybrid' | 'on_site' | 'flexible' | 'unclear'

export type RemoteSignalType =
  | 'explicit_remote' // 명시적 원격/재택 언급
  | 'explicit_hybrid' // 명시적 하이브리드 언급
  | 'explicit_on_site' // 명시적 출근 언급
  | 'flexible_mention' // 자율/탄력 언급
  | 'location_requirement' // 지역 제한 (서울, 판교 등)
  | 'no_signal' // 근무 형태 언급 없음

export interface RemoteSignalMatch {
  type: RemoteSignalType
  excerpt: string
}

export type RemoteConfidence = 'high' | 'medium' | 'low'

export interface JdRemoteWorkReport {
  arrangement: WorkArrangement
  signals: RemoteSignalMatch[]
  officeWeeklyDays: number | null // hybrid 시 주 N일 출근 (감지된 경우)
  locationConstraint: string | null // 지역 제한 (예: "서울 강남구")
  confidence: RemoteConfidence
  summary: string
  tips: string[]
}

// ---------------------------------------------------------------------------
// Pattern sets
// ---------------------------------------------------------------------------

const REMOTE_PATTERNS = [
  /풀\s*리모트/,
  /완전\s*재택/,
  /100\s*%\s*재택/,
  /전면\s*재택/,
  /원격\s*근무/,
  /재택\s*근무\s*가능/,
  /fully\s*remote/i,
  /remote[\s-]first/i,
  /work\s*from\s*home/i,
  /wfh/i,
]

const HYBRID_PATTERNS = [
  /하이브리드/,
  /hybrid/i,
  /주\s*([1-5])\s*일\s*재택/,
  /재택\s*([1-5])\s*일/,
  /일부\s*재택/,
  /재택\s*(?:병행|혼합|혼용)/,
  /\bweeks?\s+on[-\s]?site\b/i,
]

const ON_SITE_PATTERNS = [
  /출근\s*필수/,
  /전면\s*출근/,
  /사무실\s*(?:출근|근무)/,
  /오피스\s*근무/,
  /재택\s*불가/,
  /on[\s-]?site/i,
  /in[\s-]?office/i,
  /on[\s-]?premise/i,
]

const FLEXIBLE_PATTERNS = [
  /자율\s*재택/,
  /탄력\s*근무지/,
  /유연\s*근무/,
  /근무지\s*자율/,
  /원하는\s*곳에서/,
]

const LOCATION_PATTERNS = [
  /(?:서울|판교|강남|분당|수원|부산|대구|인천|광주|대전|인근|근처)\s*(?:출근|사무실|소재)/,
  /(?:서울|판교|강남|분당)\s*소재/,
]

const HYBRID_DAYS_REMOTE_RE = /주\s*([1-5])\s*일\s*재택/

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractOfficeWeeklyDays(text: string): number | null {
  // "주 3일 재택" → 2일 출근
  const remoteMatch = text.match(HYBRID_DAYS_REMOTE_RE)
  if (remoteMatch) {
    const remoteDays = parseInt(remoteMatch[1], 10)
    return Math.max(1, 5 - remoteDays)
  }
  // "주 2일 출근"
  const siteMatch = text.match(/주\s*([1-5])\s*일\s*출근/)
  if (siteMatch) return parseInt(siteMatch[1], 10)
  return null
}

function extractLocation(text: string): string | null {
  const m = text.match(
    /([가-힣]{2,8}(?:\s*[가-힣]{1,4}구|\s*[가-힣]{1,4}시)?)\s*(?:소재|위치|인근|사무실)/
  )
  return m ? m[1].trim() : null
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function extractJdRemoteWorkPolicy(text: string): JdRemoteWorkReport {
  const t = (text ?? '').trim()
  const signals: RemoteSignalMatch[] = []

  let remoteScore = 0
  let hybridScore = 0
  let onSiteScore = 0
  let flexibleScore = 0

  const lines = t.split('\n')

  for (const line of lines) {
    const l = line.trim()
    if (!l) continue

    for (const re of REMOTE_PATTERNS) {
      if (re.test(l)) {
        remoteScore++
        signals.push({ type: 'explicit_remote', excerpt: l.slice(0, 50) })
        break
      }
    }
    for (const re of HYBRID_PATTERNS) {
      if (re.test(l)) {
        hybridScore++
        signals.push({ type: 'explicit_hybrid', excerpt: l.slice(0, 50) })
        break
      }
    }
    for (const re of ON_SITE_PATTERNS) {
      if (re.test(l)) {
        onSiteScore++
        signals.push({ type: 'explicit_on_site', excerpt: l.slice(0, 50) })
        break
      }
    }
    for (const re of FLEXIBLE_PATTERNS) {
      if (re.test(l)) {
        flexibleScore++
        signals.push({ type: 'flexible_mention', excerpt: l.slice(0, 50) })
        break
      }
    }
    for (const re of LOCATION_PATTERNS) {
      if (re.test(l)) {
        signals.push({ type: 'location_requirement', excerpt: l.slice(0, 50) })
        break
      }
    }
  }

  if (signals.length === 0) {
    signals.push({ type: 'no_signal', excerpt: '' })
  }

  // Determine arrangement
  let arrangement: WorkArrangement
  let confidence: RemoteConfidence

  const total = remoteScore + hybridScore + onSiteScore + flexibleScore

  if (total === 0) {
    arrangement = 'unclear'
    confidence = 'low'
  } else if (flexibleScore > 0 && hybridScore === 0 && onSiteScore === 0 && remoteScore === 0) {
    arrangement = 'flexible'
    confidence = 'medium'
  } else if (remoteScore > 0 && hybridScore === 0 && onSiteScore === 0) {
    arrangement = 'fully_remote'
    confidence = remoteScore >= 2 ? 'high' : 'medium'
  } else if (onSiteScore > 0 && hybridScore === 0 && remoteScore === 0) {
    arrangement = 'on_site'
    confidence = onSiteScore >= 2 ? 'high' : 'medium'
  } else if (hybridScore > 0 || (remoteScore > 0 && onSiteScore > 0)) {
    arrangement = 'hybrid'
    confidence = hybridScore >= 1 ? 'high' : 'medium'
  } else {
    arrangement = 'unclear'
    confidence = 'low'
  }

  const officeWeeklyDays = arrangement === 'hybrid' ? extractOfficeWeeklyDays(t) : null
  const locationConstraint = signals.some((s) => s.type === 'location_requirement')
    ? extractLocation(t)
    : null

  // Summary
  const LABEL: Record<WorkArrangement, string> = {
    fully_remote: '풀 리모트 (재택 근무)',
    hybrid: '하이브리드',
    on_site: '전면 출근',
    flexible: '자율 근무지',
    unclear: '근무 형태 미명시',
  }
  const CONFIDENCE_LABEL: Record<RemoteConfidence, string> = {
    high: '명확',
    medium: '추정',
    low: '불명확',
  }

  let summary = `${LABEL[arrangement]} (${CONFIDENCE_LABEL[confidence]})`
  if (arrangement === 'hybrid' && officeWeeklyDays !== null) {
    summary += ` — 주 ${officeWeeklyDays}일 출근`
  }
  if (locationConstraint) {
    summary += ` / 근무지: ${locationConstraint}`
  }

  // Tips
  const tips: string[] = []
  if (arrangement === 'unclear') {
    tips.push('공고에 근무 형태가 명시되지 않았습니다. 면접 시 직접 확인하세요.')
    tips.push('"주 몇 회 출근이 필요한가요?" 또는 "재택 근무가 가능한가요?"를 질문해 보세요.')
  } else if (arrangement === 'hybrid') {
    tips.push(
      officeWeeklyDays !== null
        ? `주 ${officeWeeklyDays}일 출근 기준으로 통근 거리를 확인하세요.`
        : '출근 빈도를 면접에서 재확인하세요 (고정 vs 팀 조율 방식).'
    )
    tips.push('하이브리드 정책이 고정인지, 팀/프로젝트마다 다른지 확인하세요.')
  } else if (arrangement === 'fully_remote') {
    tips.push('풀 리모트라도 온보딩/분기 오프사이트 출근이 있는지 확인하세요.')
    tips.push('시간대(timezone) 요구사항이 있는지 확인하세요.')
  } else if (arrangement === 'on_site') {
    tips.push('전면 출근 직무는 근무지 위치와 통근 시간을 꼭 확인하세요.')
  }

  return {
    arrangement,
    signals: signals.slice(0, 8),
    officeWeeklyDays,
    locationConstraint,
    confidence,
    summary,
    tips,
  }
}
