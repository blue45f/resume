/**
 * 이력서 자격증·인증 분석 모듈.
 *
 * 제공:
 * - analyzeResumeCertifications: 이력서에서 자격증·인증·어학 시험 감지
 *
 * 관련 타입: CertificationReport.
 */

export type CertCategory = 'it' | 'language' | 'business' | 'engineering' | 'cloud' | 'other'

export interface DetectedCert {
  name: string
  category: CertCategory
  tier: 'national' | 'global' | 'vendor'
}

export interface CertificationReport {
  certs: DetectedCert[]
  hasItCert: boolean
  hasLanguageCert: boolean
  hasCloudCert: boolean
  totalCount: number
  suggestion: string
}

// ---------------------------------------------------------------------------
// Certification patterns
// ---------------------------------------------------------------------------

interface CertDef {
  re: RegExp
  name: string
  category: CertCategory
  tier: DetectedCert['tier']
}

const CERT_PATTERNS: CertDef[] = [
  // Korean national IT certifications
  { re: /정보\s*처리\s*기사/, name: '정보처리기사', category: 'it', tier: 'national' },
  { re: /정보\s*처리\s*산업\s*기사/, name: '정보처리산업기사', category: 'it', tier: 'national' },
  {
    re: /정보\s*보안\s*기사|정보보안\s*기사/,
    name: '정보보안기사',
    category: 'it',
    tier: 'national',
  },
  { re: /네트워크\s*관리사/, name: '네트워크관리사', category: 'it', tier: 'national' },
  { re: /리눅스\s*마스터/, name: '리눅스마스터', category: 'it', tier: 'national' },
  {
    re: /데이터\s*분석\s*준전문가|ADsP/,
    name: 'ADsP (데이터분석 준전문가)',
    category: 'it',
    tier: 'national',
  },
  {
    re: /데이터\s*분석\s*전문가|ADP/,
    name: 'ADP (데이터분석 전문가)',
    category: 'it',
    tier: 'national',
  },
  { re: /SQL\s*개발자|SQLD/, name: 'SQLD', category: 'it', tier: 'national' },
  { re: /SQL\s*전문가|SQLP/, name: 'SQLP', category: 'it', tier: 'national' },
  { re: /컴퓨터\s*활용능력/, name: '컴퓨터활용능력', category: 'it', tier: 'national' },
  { re: /워드\s*프로세서|워드프로세서/, name: '워드프로세서', category: 'it', tier: 'national' },

  // Cloud certifications
  {
    re: /AWS\s*(?:SAA|SAP|DVA|SOA|DBS|MLS|ANS|SCS|PAS|CLF)|AWS\s*(?:Solutions?\s*Architect|Developer|SysOps|Advanced|Specialty)/i,
    name: 'AWS 인증',
    category: 'cloud',
    tier: 'vendor',
  },
  {
    re: /GCP|Google\s*Cloud\s*(?:Professional|Associate|Certified)/i,
    name: 'GCP 인증',
    category: 'cloud',
    tier: 'vendor',
  },
  {
    re: /Azure\s*(?:Administrator|Developer|Architect|AZ-\d{3})|AZ-900/i,
    name: 'Azure 인증',
    category: 'cloud',
    tier: 'vendor',
  },
  {
    re: /CKA\b|Certified\s*Kubernetes\s*Administrator/,
    name: 'CKA (Kubernetes)',
    category: 'cloud',
    tier: 'vendor',
  },
  {
    re: /CKAD\b|Certified\s*Kubernetes\s*Application\s*Developer/,
    name: 'CKAD',
    category: 'cloud',
    tier: 'vendor',
  },

  // Global IT certifications
  { re: /\bCISP\b|\bCISSP\b/, name: 'CISSP', category: 'it', tier: 'global' },
  { re: /\bCEH\b/, name: 'CEH', category: 'it', tier: 'global' },
  { re: /\bOCA\b|\bOCP\b|\bOCM\b/, name: 'Oracle 인증', category: 'it', tier: 'vendor' },
  { re: /\bRHCE\b|\bRHCSA\b/, name: 'Red Hat 인증', category: 'it', tier: 'vendor' },
  { re: /\bCCNA\b|\bCCNP\b|\bCCIE\b/, name: 'Cisco 인증', category: 'it', tier: 'vendor' },

  // Language certifications
  {
    re: /TOEIC\s*(?:\d{3,4}점?|Speaking\s*\d)?|토익\s*(?:\d{3,4})?/i,
    name: 'TOEIC',
    category: 'language',
    tier: 'global',
  },
  { re: /TOEFL\s*(?:\d{2,3}점?)?/i, name: 'TOEFL', category: 'language', tier: 'global' },
  {
    re: /OPIc\s*(?:AL|IH|IM\d?|IL|NH|NM|NL)?|오픽\s*(?:AL|IH|IM\d?)?/i,
    name: 'OPIc',
    category: 'language',
    tier: 'global',
  },
  {
    re: /JLPT\s*N?[1-5]|일본어\s*(?:능력|검정)\s*(?:N?[1-5]|[1-5]급)/,
    name: 'JLPT',
    category: 'language',
    tier: 'global',
  },
  {
    re: /HSK\s*\d급?|중국어\s*(?:능력|HSK)\s*\d/i,
    name: 'HSK',
    category: 'language',
    tier: 'global',
  },

  // Business / management
  {
    re: /\bPMP\b|Project\s*Management\s*Professional/,
    name: 'PMP',
    category: 'business',
    tier: 'global',
  },
  { re: /\bCPA\b|공인\s*회계사/, name: '공인회계사 (CPA)', category: 'business', tier: 'national' },
  { re: /\bCFA\b|금융\s*분석사/, name: 'CFA', category: 'business', tier: 'global' },
  { re: /세무사|공인세무사/, name: '세무사', category: 'business', tier: 'national' },
  { re: /변리사/, name: '변리사', category: 'business', tier: 'national' },

  // Engineering
  {
    re: /(?:전기|건축|기계|화공|토목|환경)\s*기사/,
    name: '기술사/기사 (공학)',
    category: 'engineering',
    tier: 'national',
  },
  {
    re: /(?:전기|건축|기계|화공|토목)\s*기술사/,
    name: '기술사 (공학)',
    category: 'engineering',
    tier: 'national',
  },
]

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

/**
 * 이력서에서 자격증·인증·어학 시험을 감지하고 보유 현황을 평가.
 */
export function analyzeResumeCertifications(text: string): CertificationReport {
  const t = text ?? ''

  const certs: DetectedCert[] = CERT_PATTERNS.filter(({ re }) => re.test(t)).map(
    ({ name, category, tier }) => ({ name, category, tier })
  )

  const hasItCert = certs.some((c) => c.category === 'it')
  const hasLanguageCert = certs.some((c) => c.category === 'language')
  const hasCloudCert = certs.some((c) => c.category === 'cloud')

  let suggestion: string
  if (certs.length === 0) {
    suggestion =
      '자격증·인증·어학 점수가 감지되지 않았습니다. IT 직종이라면 정보처리기사, 클라우드 자격증, OPIc 등을 기재하면 경쟁력이 높아집니다.'
  } else if (!hasLanguageCert && certs.length < 3) {
    suggestion = `${certs.length}개 자격증 감지됨. 외국어 점수(OPIc/TOEIC)를 추가하면 글로벌 포지션 지원 시 유리합니다.`
  } else if (!hasCloudCert && hasItCert) {
    suggestion = `${certs.length}개 자격증 감지됨. 클라우드 인증(AWS/GCP/Azure)을 보유 중이라면 기재하세요.`
  } else {
    suggestion = `${certs.length}개 자격증/인증이 포함되어 있습니다.`
  }

  return { certs, hasItCert, hasLanguageCert, hasCloudCert, totalCount: certs.length, suggestion }
}
