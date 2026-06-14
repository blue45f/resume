import type { JobApplication } from './api'

export type CompanyConcentrationLevel = 'watch' | 'high' | 'severe'

export interface CompanyConcentrationRisk {
  company: string
  count: number
  activeCount: number
  responseCount: number
  level: CompanyConcentrationLevel
  detail: string
}

export interface DuplicateApplicationRisk {
  company: string
  position: string
  count: number
  ids: string[]
}

export interface ApplicationConcentrationRiskSummary {
  risks: CompanyConcentrationRisk[]
  duplicates: DuplicateApplicationRisk[]
  summary: string
}

const TERMINAL_STATUSES = new Set(['offer', 'rejected', 'withdrawn'])
const RESPONSE_STATUSES = new Set([
  'interview',
  'interviewing',
  'technical',
  'onsite',
  'final',
  'offer',
])

const LEVEL_WEIGHT: Record<CompanyConcentrationLevel, number> = {
  severe: 3,
  high: 2,
  watch: 1,
}

interface CompanyBucket {
  company: string
  count: number
  activeCount: number
  responseCount: number
}

interface DuplicateBucket {
  company: string
  position: string
  count: number
  ids: string[]
}

function normalizeText(value?: string | null): string {
  return (value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
}

function getDisplayText(value: string | undefined | null, fallback: string): string {
  return (value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ') || fallback
}

function getConcentrationLevel(count: number): CompanyConcentrationLevel | null {
  if (count >= 8) return 'severe'
  if (count >= 5) return 'high'
  if (count >= 3) return 'watch'
  return null
}

function getRiskDetail(
  risk: Pick<CompanyConcentrationRisk, 'level' | 'activeCount' | 'responseCount'>
): string {
  if (risk.level === 'severe') {
    return '동일 회사 반복 지원이 과도합니다. 역할 적합도와 내부 추천/담당자 접점을 먼저 점검하세요.'
  }

  if (risk.level === 'high') {
    return '동일 회사 비중이 높습니다. 새 포지션 추가 전 기존 지원의 응답률과 직무 차이를 확인하세요.'
  }

  if (risk.responseCount === 0 && risk.activeCount >= 2) {
    return '아직 응답 신호가 없습니다. 추가 지원보다 맞춤 이력서와 네트워킹 접점을 먼저 보강하세요.'
  }

  return '동일 회사에 여러 건이 누적됐습니다. 유사 공고 중복 여부와 우선순위를 점검하세요.'
}

function buildSummary(
  risks: CompanyConcentrationRisk[],
  duplicates: DuplicateApplicationRisk[]
): string {
  const severeOrHigh = risks.find((risk) => risk.level === 'severe' || risk.level === 'high')

  if (severeOrHigh) {
    return `${severeOrHigh.company}에 ${severeOrHigh.count}건이 집중되어 있습니다. 같은 회사 추가 지원 전 직무 적합도, 추천 경로, 이전 응답 신호를 먼저 확인하세요.`
  }

  if (risks.length > 0) {
    const firstRisk = risks[0]
    return `${firstRisk.company} 지원이 ${firstRisk.count}건 누적됐습니다. 회사별 집중도를 주간 계획에서 관리하세요.`
  }

  if (duplicates.length > 0) {
    const firstDuplicate = duplicates[0]
    return `${firstDuplicate.company} ${firstDuplicate.position} 중복 지원 가능성이 있습니다. 공고 URL과 지원일을 확인하세요.`
  }

  return '지원이 회사별로 분산되어 있습니다. 현재 포트폴리오는 특정 회사에 과도하게 쏠리지 않았습니다.'
}

export function buildApplicationConcentrationRisks(
  applications: JobApplication[]
): ApplicationConcentrationRiskSummary {
  const companyBuckets = new Map<string, CompanyBucket>()
  const duplicateBuckets = new Map<string, DuplicateBucket>()

  applications.forEach((application, index) => {
    const companyKey = normalizeText(application.company)
    if (!companyKey) return

    const companyBucket = companyBuckets.get(companyKey) ?? {
      company: getDisplayText(application.company, '회사 미상'),
      count: 0,
      activeCount: 0,
      responseCount: 0,
    }
    const statusKey = normalizeText(application.status)

    companyBucket.count += 1
    if (!TERMINAL_STATUSES.has(statusKey)) companyBucket.activeCount += 1
    if (RESPONSE_STATUSES.has(statusKey)) companyBucket.responseCount += 1
    companyBuckets.set(companyKey, companyBucket)

    const positionKey = normalizeText(application.position)
    if (!positionKey) return

    const duplicateKey = `${companyKey}::${positionKey}`
    const duplicateBucket = duplicateBuckets.get(duplicateKey) ?? {
      company: companyBucket.company,
      position: getDisplayText(application.position, '직무 미상'),
      count: 0,
      ids: [],
    }

    duplicateBucket.count += 1
    duplicateBucket.ids.push(String(application.id ?? `${companyKey}-${positionKey}-${index}`))
    duplicateBuckets.set(duplicateKey, duplicateBucket)
  })

  const risks = Array.from(companyBuckets.values())
    .map((bucket) => {
      const level = getConcentrationLevel(bucket.count)
      if (!level) return null

      const risk: CompanyConcentrationRisk = {
        ...bucket,
        level,
        detail: '',
      }
      risk.detail = getRiskDetail(risk)
      return risk
    })
    .filter((risk): risk is CompanyConcentrationRisk => Boolean(risk))
    .sort((a, b) => LEVEL_WEIGHT[b.level] - LEVEL_WEIGHT[a.level] || b.count - a.count)

  const duplicates = Array.from(duplicateBuckets.values())
    .filter((bucket) => bucket.count >= 2)
    .sort((a, b) => b.count - a.count || a.company.localeCompare(b.company, 'ko'))

  return {
    risks,
    duplicates,
    summary: buildSummary(risks, duplicates),
  }
}
