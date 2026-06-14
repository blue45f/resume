/**
 * 채용공고 회사 규모·단계 감지 모듈.
 *
 * 제공:
 * - detectCompanyStage: JD 텍스트에서 스타트업/중견기업/대기업/외국계/공기업 신호 감지
 *
 * 관련 타입: CompanyStage, CompanyStageReport.
 */

export type CompanyStage = 'startup' | 'scaleup' | 'enterprise' | 'foreign' | 'public' | 'unclear'

const STAGE_LABEL_KO: Record<CompanyStage, string> = {
  startup: '스타트업',
  scaleup: '성장기 스타트업/중견',
  enterprise: '대기업/그룹사',
  foreign: '외국계',
  public: '공공기관/공기업',
  unclear: '불명확',
}

// ---------------------------------------------------------------------------
// Signal patterns
// ---------------------------------------------------------------------------

interface StageSignal {
  stage: CompanyStage
  patterns: Array<{ re: RegExp; label: string }>
}

const STAGE_SIGNALS: StageSignal[] = [
  {
    stage: 'startup',
    patterns: [
      { re: /시리즈\s*[A-D]|Series\s*[A-D]/i, label: '시리즈 투자' },
      { re: /스타트업|startup/i, label: '스타트업 명시' },
      { re: /초기\s*멤버|창업\s*팀|co.founder/i, label: '초기 멤버' },
      {
        re: /데모\s*데이|accelerator|액셀러레이터|VC\s*투자|Y\s*Combinator/i,
        label: '스타트업 생태계',
      },
      { re: /린\s*스타트업|MVP|프리시드|Pre-seed|시드\s*투자/i, label: '초기 스타트업 신호' },
      { re: /빠른\s*성장.*(?:팀|조직)|flat\s*(?:조직|culture|hierarchy)/i, label: '스타트업 문화' },
    ],
  },
  {
    stage: 'scaleup',
    patterns: [
      { re: /시리즈\s*[EF]|Series\s*[EF]|프리\s*IPO|Pre-IPO/i, label: '성장기 투자' },
      { re: /유니콘|Unicorn|데카콘/i, label: '유니콘/데카콘' },
      { re: /중견\s*기업|코스닥\s*상장|KOSDAQ/i, label: '중견기업/코스닥' },
      {
        re: /토스|당근|쿠팡|배민|카카오\s*페이|네이버\s*클라우드|마켓컬리|무신사|야놀자|당근마켓/i,
        label: '국내 주요 스케일업',
      },
    ],
  },
  {
    stage: 'enterprise',
    patterns: [
      {
        re: /(?:삼성|현대|LG|SK|롯데|한화|포스코|CJ)\s*(?:그룹|전자|물산|화학|건설)?/,
        label: '국내 대기업 그룹',
      },
      { re: /코스피\s*상장|KOSPI|유가증권시장/i, label: '코스피 상장' },
      { re: /계열사|그룹사|대기업|지주\s*회사/i, label: '그룹사/대기업 명시' },
      { re: /공채|인적성\s*검사|하반기\s*채용|상반기\s*채용/i, label: '공채 제도' },
      {
        re: /(\d{1,3}[,]\d{3})\s*명\s*(?:이상|규모)|글로벌\s*\d+개국/,
        label: '대규모 인력/글로벌',
      },
    ],
  },
  {
    stage: 'foreign',
    patterns: [
      { re: /외국계|글로벌\s*기업|multinational|MNC/i, label: '외국계 명시' },
      {
        re: /(?:Google|Amazon|Microsoft|Meta|Apple|Netflix|Salesforce|SAP|Oracle|IBM|Intel|Qualcomm|NVIDIA)\s*Korea/i,
        label: '글로벌 빅테크 한국',
      },
      { re: /해외\s*(?:법인|본사|HQ)|본사\s*(?:미국|일본|유럽|싱가포르)/i, label: '해외 본사' },
      {
        re: /영어\s*(?:업무|면접|필수)|English\s*(?:proficiency|required|fluent)/i,
        label: '영어 업무 필수',
      },
    ],
  },
  {
    stage: 'public',
    patterns: [
      { re: /공공\s*기관|공기업|국가\s*직|지방\s*직/i, label: '공공기관/공기업' },
      { re: /NCS|직업\s*기초능력|국가직무능력표준/i, label: 'NCS 기반 채용' },
      { re: /(?:한국|국가|공공|정부)\s*(?:전산원|정보원|기술원|연구원)/, label: '공공 연구기관' },
      { re: /행정\s*공무원|공무원\s*시험|국가직\s*\d+급/i, label: '공무원 채용' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Tips per stage
// ---------------------------------------------------------------------------

const STAGE_TIPS: Record<CompanyStage, string[]> = {
  startup: [
    '스타트업 면접에서는 "불확실성 속 의사결정 경험"을 강조하세요.',
    '포트폴리오·GitHub보다 "빠른 학습·문제 해결" 스토리가 중요합니다.',
    '연봉보다 스톡옵션·지분·성장 가능성을 함께 협상하세요.',
  ],
  scaleup: [
    '스케일업은 "대규모 시스템 경험" + "빠른 실행력"을 동시에 원합니다.',
    '현직 재직자와 커피챗으로 문화를 미리 파악하는 게 유용합니다.',
    '데이터 기반 의사결정 경험을 수치로 구체화하세요.',
  ],
  enterprise: [
    '대기업은 팀플레이어·커뮤니케이션·규정 준수를 중요시합니다.',
    '직무 전문성과 함께 "협업·조율 경험"을 면접 스토리로 준비하세요.',
    '장기 커리어 비전과 해당 기업의 연계성을 설명할 수 있도록 준비하세요.',
  ],
  foreign: [
    '영어 면접 포맷(STAR 답변)으로 구조화된 답변을 준비하세요.',
    '글로벌 업무 경험·영어 커뮤니케이션 능력을 구체적으로 어필하세요.',
    '다양성·포용 문화에 대한 자신의 관점을 준비해두세요.',
  ],
  public: [
    'NCS 기반 직무적성검사(필기) 준비가 필수입니다.',
    '봉사·공익 지향점을 구체적인 경험으로 뒷받침하세요.',
    '취업 규칙·공직자 윤리 관련 질문에 대비하세요.',
  ],
  unclear: ['채용공고에서 회사 정보·조직 규모를 추가로 확인하세요.'],
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

export interface CompanyStageReport {
  stage: CompanyStage
  stageLabel: string
  signals: Array<{ stage: CompanyStage; label: string }>
  tips: string[]
  confidence: 'high' | 'medium' | 'low'
}

/**
 * JD 텍스트에서 회사 규모·단계를 감지하고 면접 준비 팁 제공.
 */
export function detectCompanyStage(text: string): CompanyStageReport {
  const t = text ?? ''

  if (!t.trim()) {
    return {
      stage: 'unclear',
      stageLabel: STAGE_LABEL_KO['unclear'],
      signals: [],
      tips: STAGE_TIPS['unclear'],
      confidence: 'low',
    }
  }

  const allSignals: Array<{ stage: CompanyStage; label: string }> = []

  for (const { stage, patterns } of STAGE_SIGNALS) {
    for (const { re, label } of patterns) {
      if (re.test(t)) {
        allSignals.push({ stage, label })
      }
    }
  }

  // Score each stage
  const stageCounts = Object.fromEntries(STAGE_SIGNALS.map((s) => [s.stage, 0])) as Record<
    CompanyStage,
    number
  >

  for (const sig of allSignals) {
    stageCounts[sig.stage]++
  }

  const sorted = (Object.entries(stageCounts) as [CompanyStage, number][]).sort(
    (a, b) => b[1] - a[1]
  )

  const topStage = sorted[0][0]
  const topCount = sorted[0][1]

  const stage: CompanyStage = topCount === 0 ? 'unclear' : topStage
  const confidence: CompanyStageReport['confidence'] =
    topCount >= 2 ? 'high' : topCount === 1 ? 'medium' : 'low'

  return {
    stage,
    stageLabel: STAGE_LABEL_KO[stage],
    signals: allSignals.filter((s) => s.stage === stage),
    tips: STAGE_TIPS[stage].slice(0, 3),
    confidence,
  }
}
