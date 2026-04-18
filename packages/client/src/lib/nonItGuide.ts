import type { Resume } from '@/types/resume';

export type NonItCategory =
  | 'sales'
  | 'marketing'
  | 'finance'
  | 'hr'
  | 'legal'
  | 'medical'
  | 'education'
  | 'government'
  | 'service'
  | 'manufacturing'
  | 'logistics'
  | 'creative'
  | 'trade'
  | 'other-it';

export interface CategoryGuide {
  label: string;
  emoji: string;
  achievementTemplates: string[];
  recommendedCertifications: string[];
  coverLetterTopics: {
    title: string;
    prompt: string;
    sample: string;
  }[];
  interviewFocus: string[];
  ncs?: string;
}

export const NON_IT_GUIDES: Record<NonItCategory, CategoryGuide> = {
  sales: {
    label: '영업/세일즈',
    emoji: '💼',
    achievementTemplates: [
      '분기 목표 대비 매출 [000]% 달성 ([금액] 기여)',
      '신규 고객사 [00]곳 개척, 전년 대비 계약 체결 [00]% 증가',
      '기존 고객 재계약률 [00]% → [00]% 개선 ([숫자]개월 내)',
      '평균 거래 주기 [00]일 → [00]일 단축 (파이프라인 관리 개선)',
      '최대 단일 계약 [금액] 수주 — 전사 상위 [00]% 실적',
    ],
    recommendedCertifications: [
      '유통관리사 2급',
      '판매사',
      'CRM 전문가',
      '세일즈포스 Admin',
      '마케팅 기획자',
    ],
    coverLetterTopics: [
      {
        title: '성장과정',
        prompt: '영업 직무에 필요한 대인관계·설득 역량이 자란 경험 1가지',
        sample:
          '대학 축제 부스 운영팀장으로 일하며, 매출 목표를 제시하고 팀원을 동기 부여한 경험이...',
      },
      {
        title: '지원동기',
        prompt: '이 회사 제품/서비스를 왜 자신이 팔고 싶은지',
        sample: '귀사의 [제품명]을 실제로 사용해보며 시장에서의 차별점을 체감했고...',
      },
      {
        title: '입사 후 포부',
        prompt: '3년·5년 후 목표 (구체적 숫자 포함)',
        sample: '입사 후 1년 이내 담당 지역 매출 [00]% 성장을 목표로...',
      },
    ],
    interviewFocus: [
      'STAR — 어려운 고객 설득 사례',
      '경쟁사 제품 대비 우리 제품의 약점을 어떻게 극복?',
      '매출 목표가 낙담될 정도일 때 동기 부여 방법',
    ],
  },
  marketing: {
    label: '마케팅',
    emoji: '📣',
    achievementTemplates: [
      '퍼포먼스 캠페인 ROAS [000]% 달성 (예산 [금액])',
      '월 평균 CPA [금액] → [금액]으로 [00]% 절감',
      'SNS 팔로워 [0000]명 → [0000]명 ([00]%↑) 6개월',
      '브랜드 인지도 조사 Top of Mind [00]% → [00]% 상승',
      '오가닉 트래픽 월 [000]K → [000]K ([00]%↑) / SEO',
    ],
    recommendedCertifications: [
      'GAIQ (Google Ads)',
      'Meta Blueprint',
      '소셜미디어 마케팅 자격증',
      '컨텐츠 마케팅 자격증',
      '데이터분석 준전문가 (ADsP)',
    ],
    coverLetterTopics: [
      {
        title: '지원동기',
        prompt: '이 브랜드/제품이 매력적인 이유 (소비자 관점)',
        sample: '귀사의 [브랜드]의 ‘[캐치프레이즈]’는 [타깃층]에게 정확히 박히는 메시지...',
      },
      {
        title: '성격의 장단점',
        prompt: '마케팅 직무와 연결된 장단점',
        sample: '장점: 숫자와 감성의 균형 — [사례]. 단점: 완벽주의로 타이밍을 놓친 적이 있으나...',
      },
      {
        title: '입사 후 포부',
        prompt: '첫 캠페인 아이디어 또는 개선 포인트',
        sample: '입사 후 현재 [채널]의 CPC 를 [00]% 낮추기 위한 A/B 테스트 프레임워크...',
      },
    ],
    interviewFocus: [
      '최근 인상적이었던 캠페인 1개와 그 이유',
      '우리 브랜드가 놓치고 있다고 생각하는 채널은?',
      '성과 부진 캠페인의 원인 분석 프로세스',
    ],
  },
  finance: {
    label: '회계/재무',
    emoji: '📊',
    achievementTemplates: [
      '월 결산 소요 시간 [00]일 → [00]일 단축 ([00]%↓)',
      '예산 편성 정확도 [00]% → [00]% 개선 (예측 오차 축소)',
      '원가 절감 프로젝트로 연간 [금액] 비용 절감',
      '세무 조사 무사고 [00]년 / 자금조달 [금액] 유치',
      'ERP (SAP/Oracle) 도입 주도, 수기 작업 [00]% 자동화',
    ],
    recommendedCertifications: [
      '공인회계사 (CPA)',
      '세무사',
      '재경관리사',
      'AFPK / CFP',
      'FAT / TAT',
      '전산세무 1·2급',
    ],
    coverLetterTopics: [
      {
        title: '성격의 장단점',
        prompt: '세밀함과 책임감 — 회계/재무 적합 근거',
        sample: '장점: 숫자의 불일치를 끝까지 추적 — [사례]. 단점: 속도보다 정확성에 치우쳐...',
      },
      {
        title: '지원동기',
        prompt: '이 회사의 재무/회계팀에서 기여하고 싶은 영역',
        sample:
          '귀사의 해외 자회사 관리 구조에 관심이 있어, 국제회계기준 적용 경험으로 기여하고...',
      },
    ],
    interviewFocus: ['IFRS와 K-GAAP 주요 차이', '감가상각 방법 선택 기준', '세무조사 대응 경험'],
  },
  hr: {
    label: 'HR/인사',
    emoji: '🧑‍💼',
    achievementTemplates: [
      '연간 채용 [00]명, 평균 채용 소요일 [00]일 → [00]일 단축',
      '이직률 [00]% → [00]% 개선 (온보딩/리텐션 프로그램)',
      '전사 교육 이수율 [00]% → [00]% 상승',
      '인사평가 제도 개선 — 360도 피드백 도입, 만족도 [00]% 상승',
      '복리후생 개편으로 직원 만족도 조사 [00]점 → [00]점 (5점 척도)',
    ],
    recommendedCertifications: [
      '공인노무사',
      'PHR / SPHR',
      'CDP (경력개발 전문가)',
      '인사관리사',
      '직업상담사 2급',
    ],
    coverLetterTopics: [
      {
        title: '성장과정',
        prompt: '사람과 조직에 대한 관심이 자란 계기',
        sample: '학회 임원으로 갈등을 중재한 경험 이후 "사람을 움직이는 구조" 에 관심이...',
      },
      {
        title: '입사 후 포부',
        prompt: '이 회사 HR 에서 풀고 싶은 문제',
        sample: '귀사의 신입 채용 프로세스를 분석해보니 [단계]에서 지원자 이탈률이 높아...',
      },
    ],
    interviewFocus: [
      '근로기준법 상 해고 요건',
      '노사협의회 vs 노동조합 차이',
      '성과평가에서 공정성 확보 방법',
    ],
  },
  legal: {
    label: '법률/법무',
    emoji: '⚖️',
    achievementTemplates: [
      '계약서 표준 템플릿 [00]종 제정, 검토 소요일 [00]일 → [00]일 단축',
      '법무 리스크 자가진단 체크리스트 도입, 계약 클레임 [00]% 감소',
      '소송 [00]건 중 [00]건 승소 / 화해 ([00]% 승률)',
      '개인정보보호 컴플라이언스 감사 무지적 [00]회',
    ],
    recommendedCertifications: [
      '변호사',
      '변리사',
      '법무사',
      '공인노무사',
      'CPPG (개인정보보호 전문가)',
    ],
    coverLetterTopics: [
      {
        title: '지원동기',
        prompt: '사내변호사/법무 업무의 매력 + 회사 선택 이유',
        sample: '사내 법무는 법리 해석을 넘어 비즈니스 파트너 역할이 중요해...',
      },
    ],
    interviewFocus: [
      '최근 주목한 판례 1건과 그 의미',
      '계약서 검토 시 놓치기 쉬운 포인트',
      '개인정보 유출 사고 대응 절차',
    ],
  },
  medical: {
    label: '의료/보건',
    emoji: '🏥',
    achievementTemplates: [
      '환자 [000]명/주 진료, 만족도 [00]점 (5점 척도)',
      '병동 감염률 [00]% → [00]% 감소 (감염관리 프로토콜)',
      '의료기기 사용법 교육 [00]회, 신규 직원 온보딩 단축',
      '연구 논문 [0]편 (SCI [0]편) / 학회 발표 [0]회',
    ],
    recommendedCertifications: [
      '의사면허',
      '간호사면허',
      '임상병리사면허',
      '응급구조사 1급',
      '감염관리 전문간호사',
      '보건교육사',
    ],
    coverLetterTopics: [
      {
        title: '지원동기',
        prompt: '이 병원/기관의 어떤 점에 끌렸는가',
        sample: '귀 병원의 [전문분야] 센터가 주도하는 [연구/프로그램]에 참여해...',
      },
    ],
    interviewFocus: ['환자 낙상 사고 대응', '코드블루 상황 대처', '동료와의 의료 판단 이견'],
  },
  education: {
    label: '교육/교사',
    emoji: '📚',
    achievementTemplates: [
      '담임 학급 학업성취도 [00]% → [00]% 향상 (1년)',
      '학부모 만족도 조사 [00]점 → [00]점 (5점 척도)',
      '교내 자율동아리 창설, 참여 학생 [00]명',
      '수업자료 [00]종 제작, 타 교사 [00]명 공유 활용',
    ],
    recommendedCertifications: [
      '중등/초등 정교사 2급',
      '상담교사',
      '사서교사',
      '한국어교원 2급',
      '에듀테크 활용 지도사',
    ],
    coverLetterTopics: [
      {
        title: '교직관',
        prompt: '자신이 지향하는 교사상',
        sample: '제가 존경하는 은사님처럼 학생 한 명 한 명의 이름과 관심사를 기억하며...',
      },
      {
        title: '입사 후 포부',
        prompt: '이 학교에서 기여하고 싶은 것',
        sample: '귀교의 [특성화 프로그램]에 참여해 [구체 계획]을 제안하고 싶습니다.',
      },
    ],
    interviewFocus: ['학급 갈등 중재 사례', '학부모 민원 대응', '수업 공개 준비 프로세스'],
  },
  government: {
    label: '공기업/공무원',
    emoji: '🏛️',
    achievementTemplates: [
      'NCS 직무역량 기반 사업 [00]건 기획, 예산 [금액] 집행',
      '지역 민원 처리 소요일 [00]일 → [00]일 단축',
      '정책 연구 보고서 [0]건, 국정감사 대응 자료 [00]건 작성',
      '시민 만족도 조사 [00]점 → [00]점 (10점 척도)',
    ],
    recommendedCertifications: [
      '한국사능력검정시험 1급',
      'TOEIC [000]점 이상',
      '컴퓨터활용능력 1급',
      '정보처리기사',
      '기술사 (해당 분야)',
    ],
    coverLetterTopics: [
      {
        title: '지원동기',
        prompt: '왜 공기업/공무원인가 + 기관 선택 이유',
        sample:
          '민간이 메우지 못하는 [공공서비스] 영역에 기여하고 싶어, 특히 귀 기관의 [사업]에...',
      },
      {
        title: '직무수행계획',
        prompt: 'NCS 직무기술서 기반 3년/5년 계획',
        sample: '[직렬]의 필수 능력단위 중 [단위명]에 우선 역량을 집중, 첫 1년에는 OJT 를 통해...',
      },
    ],
    interviewFocus: [
      '청렴·공정성 관련 질문 (이해충돌방지법)',
      '국민 중심 행정의 의미',
      '해당 기관 최근 사업 1가지와 본인 의견',
    ],
    ncs: 'NCS 홈페이지 www.ncs.go.kr 에서 해당 직렬의 능력단위·능력단위요소를 확인해 직무기술서를 작성하세요. 면접 질문의 60% 이상이 NCS 기반입니다.',
  },
  service: {
    label: '서비스/외식/호텔',
    emoji: '🤝',
    achievementTemplates: [
      'NPS (고객 추천 지수) [0]점 → [0]점 (3개월)',
      '불만 민원 일평균 [0]건 → [0]건, 재방문율 [00]% 상승',
      '팀원 [00]명 교육, 서비스 매뉴얼 [00]종 개정',
      '일 평균 테이블 회전율 [0]회 → [0]회 / 객단가 [금액] → [금액]',
    ],
    recommendedCertifications: [
      '서비스경영 자격증',
      '조리기능사 (한·중·양식)',
      '호텔경영사',
      '커피바리스타 2급',
      'CS Leaders',
    ],
    coverLetterTopics: [
      {
        title: '성장과정',
        prompt: '서비스 마인드가 형성된 계기',
        sample: '학비를 벌며 카페에서 일하던 중 단골손님의 이름을 외워 대접하는 경험에서...',
      },
    ],
    interviewFocus: ['진상 고객 대응 사례', '동료와 속도가 맞지 않을 때', '매장 위생 관리'],
  },
  manufacturing: {
    label: '제조/생산/품질',
    emoji: '🏭',
    achievementTemplates: [
      '생산 라인 OEE [00]% → [00]% 개선 (6 Sigma)',
      '불량률 PPM [0000] → [000] 감소 (SPC 도입)',
      '설비 고장율 MTBF [00] → [00] 시간 개선',
      '연간 원가 [금액] 절감 / 납기 준수율 [00]%',
    ],
    recommendedCertifications: [
      '품질경영기사',
      '생산관리기사',
      '전기·기계기사',
      '6 Sigma Green/Black Belt',
      'CSSBB',
    ],
    coverLetterTopics: [
      {
        title: '지원동기',
        prompt: '이 공장/제품의 제조공정에서 기여하고 싶은 점',
        sample: '귀사의 [공정]은 업계 대비 [장점]이 있고, 제 [전공/경험]이 이를 고도화하는...',
      },
    ],
    interviewFocus: ['5M1E 개선 사례', 'FMEA 경험', '생산 긴급 이슈 대응 경험'],
  },
  logistics: {
    label: '물류/SCM',
    emoji: '🚚',
    achievementTemplates: [
      '창고 재고 회전율 [0] → [0] 개선',
      '리드타임 평균 [0]일 → [0]일 단축',
      '운송비 월 [금액] → [금액] ([00]%↓)',
      '재고 정확도 [00]% → [00]% 개선 (RFID/WMS)',
    ],
    recommendedCertifications: [
      '물류관리사',
      '유통관리사',
      '원산지관리사',
      'CPIM / CSCP',
      '국제무역사 1급',
    ],
    coverLetterTopics: [
      {
        title: '입사 후 포부',
        prompt: '이 회사의 SCM 에서 개선할 포인트',
        sample: '귀사의 [지역] 물류 허브는 [현상황] — 이를 [제안]으로 개선해...',
      },
    ],
    interviewFocus: ['SKU 폭증 시 재고 관리', '최종 납기 지연 대응', 'ERP 시스템 사용 경험'],
  },
  creative: {
    label: '디자인/크리에이터',
    emoji: '🎨',
    achievementTemplates: [
      '브랜드 리뉴얼 프로젝트 주도, SNS 반응 [00]% 상승',
      'UX 리서치 기반 개편으로 CVR [00]% → [00]% 상승',
      '영상 콘텐츠 조회수 누적 [000]만, 평균 시청 완료율 [00]%',
      '공모전 [00]회 수상 / 전시 [0]회 참여',
    ],
    recommendedCertifications: [
      '컬러리스트 산업기사',
      'GTQ (그래픽기술자격)',
      'Adobe Certified Professional',
      '시각디자인 산업기사',
      'UX 디자이너 자격증',
    ],
    coverLetterTopics: [
      {
        title: '지원동기',
        prompt: '이 브랜드의 비주얼/톤에 공감하는 이유',
        sample: '귀사의 [제품] 패키지를 본 순간 [감정]을 느꼈고, 이것이 저의 지향점과...',
      },
    ],
    interviewFocus: ['포트폴리오 중 1개 작품 심층', '클라이언트 수정 요청 대응', '트렌드 수집법'],
  },
  trade: {
    label: '무역/해외영업',
    emoji: '🌏',
    achievementTemplates: [
      '신규 해외 바이어 [00]곳 개발, 수출 [금액] 체결',
      '무역클레임 [00]% 감소 (계약서 개선)',
      '환율 헤지 전략으로 환차손 [금액] → [금액] 축소',
      '해외 박람회 [00]회 참가, 상담 건수 [000]건',
    ],
    recommendedCertifications: [
      '국제무역사 1급',
      '원산지관리사',
      'IBT (국제비즈니스영어)',
      'TOEIC [900]+ / OPIc AL',
      'JPT / HSK 고급',
    ],
    coverLetterTopics: [
      {
        title: '지원동기',
        prompt: '해외 경험 + 이 회사의 수출 구조에 기여할 점',
        sample: '교환학생 기간 [국가]의 유통 구조를 현장에서 조사한 경험이 있고...',
      },
    ],
    interviewFocus: [
      'INCOTERMS 2020 주요 조건',
      'L/C vs T/T 거래 장단점',
      '영어/중국어 비즈니스 회화',
    ],
  },
  'other-it': {
    label: 'IT 외 기타',
    emoji: '💡',
    achievementTemplates: [
      '담당 업무 프로세스 개선으로 소요 시간 [00]% 단축',
      '팀 KPI 달성률 [00]% → [00]%',
      '신규 프로젝트 [00]건 기획·실행',
    ],
    recommendedCertifications: [
      '컴퓨터활용능력 1급',
      'MOS Master',
      '직무 관련 국가기술자격 (해당 분야)',
      '한국사능력검정시험 2급+',
      'TOEIC [700]+ / OPIc IM',
    ],
    coverLetterTopics: [
      {
        title: '지원동기',
        prompt: '이 회사·직무에 끌린 이유',
        sample: '귀사의 [가치/제품]이 제 [경험/관심사]과 닿아...',
      },
    ],
    interviewFocus: ['직무 관련 용어 지식', '협업 사례 (STAR)', '본인만의 차별점'],
  },
};

export const NON_IT_CATEGORY_KEYS = Object.keys(NON_IT_GUIDES) as NonItCategory[];

/**
 * 이력서 내용으로부터 카테고리를 휴리스틱 추정
 * — 경력·기술 텍스트에서 직군 키워드를 매칭.
 */
export function detectNonItCategory(resume: Resume): NonItCategory | null {
  const haystack = [
    resume.title,
    resume.personalInfo.summary,
    ...resume.experiences.map((e) => `${e.position} ${e.department ?? ''} ${e.description}`),
    ...resume.skills.map((s) => `${s.category} ${s.items}`),
  ]
    .join(' ')
    .toLowerCase();

  const signals: Record<NonItCategory, string[]> = {
    sales: ['영업', '세일즈', 'sales', 'b2b', '수주', '계약', 'kpi', '매출'],
    marketing: ['마케팅', '퍼포먼스', 'cpa', 'roas', 'sns', '브랜드', 'content'],
    finance: ['회계', '재무', '경리', 'cpa', '결산', '세무', 'ifrs'],
    hr: ['인사', 'hr', 'hrd', '채용', '노무', '평가', '조직개발'],
    legal: ['법무', '변호사', '계약서', '컴플라이언스', '소송'],
    medical: ['간호', '의료', '병원', '보건', '진료', '환자', '의사'],
    education: ['교사', '강사', '교육', '학원', '학생', '수업'],
    government: ['공기업', '공무원', 'ncs', '공단', '공사', '행정'],
    service: ['서비스', '호텔', '외식', '바리스타', 'cs', '매장'],
    manufacturing: ['제조', '생산', '품질', 'qc', '공장', 'plc', '설비'],
    logistics: ['물류', 'scm', '재고', '창고', '유통', '배송'],
    creative: ['디자이너', '크리에이터', '브랜드', '영상', 'ux', '디자인'],
    trade: ['무역', '수출', '바이어', '해외영업', 'l/c', 'incoterms'],
    'other-it': [],
  };

  let best: { cat: NonItCategory; score: number } | null = null;
  for (const [cat, words] of Object.entries(signals) as [NonItCategory, string[]][]) {
    const score = words.reduce((s, w) => (haystack.includes(w) ? s + 1 : s), 0);
    if (score > 0 && (!best || score > best.score)) best = { cat, score };
  }
  return best?.cat ?? null;
}
