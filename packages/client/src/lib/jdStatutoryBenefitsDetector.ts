/**
 * JD 법정 복리후생 포장 감지기 — 법으로 보장된 항목(4대보험·연차·퇴직금 등)을
 * "복지"처럼 나열하는지 파악하여 실질 복지 수준 판단을 돕는다.
 */

export type StatutoryBenefitType =
  | 'four_insurances' // 4대보험
  | 'annual_leave' // 연차(법정)
  | 'severance' // 퇴직금
  | 'overtime_pay' // 연장·야간·휴일 수당
  | 'parental_leave' // 육아휴직(법정)
  | 'weekly_holiday' // 주휴수당
  | 'min_wage'; // 최저임금 준수

export type GenuineBenefitType =
  | 'meal' // 식대/중식 지원
  | 'self_development' // 자기계발/교육비
  | 'incentive' // 인센티브/성과급
  | 'equity' // 스톡옵션/우리사주
  | 'flexible' // 유연·재택 근무
  | 'refresh' // 리프레시/안식 휴가
  | 'snack' // 간식/사내 카페
  | 'event_support' // 경조사/명절 지원
  | 'health' // 건강검진(법정 외)/의료비
  | 'commute'; // 교통비/통근버스

export interface BenefitItem {
  type: StatutoryBenefitType | GenuineBenefitType;
  klass: 'statutory' | 'genuine';
  excerpt: string;
}

export type BenefitPadding = 'padded' | 'mixed' | 'genuine' | 'none';

export interface JdStatutoryBenefitsReport {
  padding: BenefitPadding;
  statutoryItems: BenefitItem[];
  genuineItems: BenefitItem[];
  statutoryCount: number;
  genuineCount: number;
  summary: string;
  tips: string[];
}

// ---------------------------------------------------------------------------
// Pattern sets
// ---------------------------------------------------------------------------

const STATUTORY_PATTERNS: Array<{ type: StatutoryBenefitType; re: RegExp }> = [
  { type: 'four_insurances', re: /(?:4대\s*보험|사대\s*보험|국민연금|건강보험|고용보험|산재보험)/ },
  { type: 'annual_leave', re: /(?:연차\s*(?:휴가)?|법정\s*휴가|월차)/ },
  { type: 'severance', re: /(?:퇴직금|퇴직\s*급여|퇴직\s*연금)/ },
  {
    type: 'overtime_pay',
    re: /(?:연장\s*근로\s*수당|야간\s*수당|휴일\s*근로\s*수당|초과\s*근무\s*수당)/,
  },
  { type: 'parental_leave', re: /(?:육아\s*휴직|출산\s*휴가|육아기\s*근로시간\s*단축)/ },
  { type: 'weekly_holiday', re: /(?:주휴\s*수당|주휴일)/ },
  { type: 'min_wage', re: /(?:최저\s*임금|최저\s*시급)\s*(?:준수|보장|이상)?/ },
];

const GENUINE_PATTERNS: Array<{ type: GenuineBenefitType; re: RegExp }> = [
  { type: 'meal', re: /(?:식대\s*지원|중식\s*제공|점심\s*제공|식비\s*지원|밥값)/ },
  {
    type: 'self_development',
    re: /(?:자기\s*계발(?:비)?|교육비\s*지원|도서\s*구입비|세미나\s*지원|컨퍼런스\s*지원)/,
  },
  { type: 'incentive', re: /(?:인센티브|성과급|상여금|프로핏\s*쉐어|profit\s*share)/i },
  { type: 'equity', re: /(?:스톡\s*옵션|stock\s*option|우리\s*사주|RSU|주식\s*보상)/i },
  { type: 'flexible', re: /(?:유연\s*근무|자율\s*출퇴근|재택\s*근무|시차\s*출퇴근|원격\s*근무)/ },
  { type: 'refresh', re: /(?:리프레시\s*휴가|안식\s*휴가|장기\s*근속\s*휴가|리프레쉬)/ },
  { type: 'snack', re: /(?:간식\s*(?:제공|무한)|사내\s*카페|스낵바|음료\s*무제한)/ },
  {
    type: 'event_support',
    re: /(?:경조사(?:비|\s*지원)|명절\s*(?:선물|상여|귀향비)|생일\s*(?:선물|축하금))/,
  },
  {
    type: 'health',
    re: /(?:종합\s*건강\s*검진|의료비\s*지원|단체\s*보험|실비\s*보험|가족\s*건강\s*검진)/,
  },
  { type: 'commute', re: /(?:교통비\s*지원|통근\s*버스|주차\s*지원|유류비\s*지원)/ },
];

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function detectJdStatutoryBenefits(text: string): JdStatutoryBenefitsReport {
  const t = (text ?? '').trim();
  const lines = t.split('\n').map((l) => l.trim());

  const statutoryItems: BenefitItem[] = [];
  const genuineItems: BenefitItem[] = [];
  const seenStatutory = new Set<StatutoryBenefitType>();
  const seenGenuine = new Set<GenuineBenefitType>();

  for (const line of lines) {
    if (!line) continue;
    for (const { type, re } of STATUTORY_PATTERNS) {
      if (!seenStatutory.has(type) && re.test(line)) {
        statutoryItems.push({ type, klass: 'statutory', excerpt: line.slice(0, 50) });
        seenStatutory.add(type);
      }
    }
    for (const { type, re } of GENUINE_PATTERNS) {
      if (!seenGenuine.has(type) && re.test(line)) {
        genuineItems.push({ type, klass: 'genuine', excerpt: line.slice(0, 50) });
        seenGenuine.add(type);
      }
    }
  }

  const statutoryCount = statutoryItems.length;
  const genuineCount = genuineItems.length;

  let padding: BenefitPadding;
  if (statutoryCount === 0 && genuineCount === 0) {
    padding = 'none';
  } else if (genuineCount >= 3) {
    padding = 'genuine';
  } else if (statutoryCount >= 2 && genuineCount <= 1) {
    padding = 'padded';
  } else {
    padding = 'mixed';
  }

  // Summary
  const PADDING_LABEL: Record<BenefitPadding, string> = {
    padded: `복지 목록이 법정 항목 위주입니다 (법정 ${statutoryCount} / 실질 ${genuineCount}).`,
    mixed: `법정 항목과 실질 복지가 섞여 있습니다 (법정 ${statutoryCount} / 실질 ${genuineCount}).`,
    genuine: `법정 항목 외 실질 복지가 충실합니다 (실질 ${genuineCount}건).`,
    none: '복지 관련 정보가 감지되지 않습니다.',
  };
  const summary = PADDING_LABEL[padding];

  // Tips
  const tips: string[] = [];
  if (padding === 'padded') {
    tips.push('4대보험·연차·퇴직금은 법으로 보장된 의무 사항이지 특별 복지가 아닙니다.');
    tips.push('식대·자기계발비·유연근무 등 실질 복지를 면접에서 구체적으로 확인하세요.');
  } else if (padding === 'mixed') {
    tips.push('법정 항목 외 실질 복지가 일부 있으나 추가 확인이 필요합니다.');
    tips.push('복지 예산·이용 빈도 등 운영 실태를 질문해 보세요.');
  } else if (padding === 'genuine') {
    tips.push('실질 복지가 잘 갖춰진 편입니다. 운영의 실제 활용도까지 확인하면 좋습니다.');
  } else {
    tips.push('복지 정보가 없습니다. 면접에서 복리후생 제도를 직접 문의하세요.');
  }
  if (statutoryCount > 0) {
    tips.push('법정 항목만으로 복지를 판단하지 말고 실질 혜택 위주로 비교하세요.');
  }

  return {
    padding,
    statutoryItems: statutoryItems.slice(0, 8),
    genuineItems: genuineItems.slice(0, 8),
    statutoryCount,
    genuineCount,
    summary,
    tips,
  };
}
