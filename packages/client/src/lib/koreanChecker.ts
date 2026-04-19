import type { Resume } from '@/types/resume';

export interface KoreanIssue {
  /** 원문 일부 (context 포함) */
  context: string;
  /** 발견된 오류 단어 */
  wrong: string;
  /** 제안 */
  suggestion: string;
  /** 설명 */
  reason: string;
  severity: 'error' | 'warning' | 'info';
  /** 어느 섹션에서 발견? */
  section: string;
  /** 섹션 텍스트 내 매치 시작 위치 (UI 하이라이트용) */
  offset: number;
  /** 매치 길이 */
  length: number;
}

export interface KoreanCheckResult {
  issues: KoreanIssue[];
  /** 문체 일관성 — 'formal'(합니다체) | 'polite'(해요체) | 'mixed' */
  toneMix: {
    formal: number;
    polite: number;
    dominant: 'formal' | 'polite' | 'mixed' | 'none';
  };
  /** 전체 문장 수 */
  totalSentences: number;
  /** 심각도별 요약 카운트 */
  summary: { error: number; warning: number; info: number };
  /**
   * 0~100 품질 점수 — error=−8, warning=−3, info=−1, 문체혼용 -5, 소수점 반올림.
   * 섹션 분량(전체 문자 수) 을 고려해 밀도 기반 penalty 적용.
   */
  score: number;
}

/**
 * 한국 이력서에 자주 나오는 맞춤법·문체 오류 교정 규칙.
 * '틀린표현' -> [제안, 이유, severity] 로 매핑.
 */
const RULES: Array<{
  pattern: RegExp;
  wrong: string;
  suggestion: string;
  reason: string;
  severity: 'error' | 'warning' | 'info';
}> = [
  // ── 맞춤법 (맞춤법이 완전히 틀림) ────────────────────────
  {
    pattern: /됬/g,
    wrong: '됬',
    suggestion: '됐',
    reason: '"되었"의 줄임말은 "됐"입니다. (예: "배포됐습니다")',
    severity: 'error',
  },
  {
    pattern: /되요(?!\S)/g,
    wrong: '되요',
    suggestion: '돼요',
    reason: '"되어요"의 줄임은 "돼요"입니다.',
    severity: 'error',
  },
  {
    pattern: /되서/g,
    wrong: '되서',
    suggestion: '돼서',
    reason: '"되어서"의 줄임은 "돼서"입니다.',
    severity: 'error',
  },
  {
    pattern: /안되는/g,
    wrong: '안되는',
    suggestion: '안 되는',
    reason: '부정어 "안"은 띄어 씁니다.',
    severity: 'warning',
  },
  {
    pattern: /뵈요(?!\S)/g,
    wrong: '뵈요',
    suggestion: '봬요',
    reason: '"뵈어요"의 줄임은 "봬요"입니다.',
    severity: 'error',
  },
  {
    pattern: /바램/g,
    wrong: '바램',
    suggestion: '바람',
    reason: '동사 "바라다"의 명사형은 "바람"입니다.',
    severity: 'error',
  },
  // (중복 제거 — "금새" 규칙은 아래 "추가 자주 틀리는 맞춤법" 블록으로 통합)
  {
    pattern: /오랫만/g,
    wrong: '오랫만',
    suggestion: '오랜만',
    reason: '"오래" + "만"은 "오랜만에"가 맞습니다.',
    severity: 'error',
  },
  {
    pattern: /몇일/g,
    wrong: '몇일',
    suggestion: '며칠',
    reason: '"얼마간의 날"은 "며칠"이 맞습니다.',
    severity: 'error',
  },
  {
    pattern: /문안하/g,
    wrong: '문안하',
    suggestion: '무난하',
    reason: '"특별한 어려움이 없다"는 "무난하다"입니다.',
    severity: 'error',
  },
  {
    pattern: /역활/g,
    wrong: '역활',
    suggestion: '역할',
    reason: '"맡은 임무"는 "역할"이 맞습니다.',
    severity: 'error',
  },
  {
    pattern: /결재(?=[\s을를이가])/g,
    wrong: '결재',
    suggestion: '결제',
    reason: '돈 지불은 "결제", 서류 승인은 "결재"입니다.',
    severity: 'warning',
  },
  // ── 이력서 특화 약한 표현 ────────────────────────────
  {
    pattern: /담당하였/g,
    wrong: '담당하였',
    suggestion: '주도했',
    reason: '"담당"은 수동적. 주도·실행·리딩 같은 강한 표현 권장.',
    severity: 'info',
  },
  {
    pattern: /최선을 다했/g,
    wrong: '최선을 다했',
    suggestion: '구체적 성과로 표현',
    reason: '"최선" 추상 표현보다 수치·사례로 성과를 증명하세요.',
    severity: 'warning',
  },
  {
    pattern: /열심히 했/g,
    wrong: '열심히 했',
    suggestion: '무엇을 어떻게 했는지 구체화',
    reason: '"열심히"는 평가자가 검증 불가. 구체 행동 + 결과로.',
    severity: 'warning',
  },
  {
    pattern: /노력하였/g,
    wrong: '노력하였',
    suggestion: '주도·제안·구현 등 동작 동사',
    reason: '"노력"은 결과가 불명확. 결과 동사로 교체.',
    severity: 'info',
  },
  // ── 띄어쓰기 / 기타 ────────────────────────────────
  {
    pattern: /할수있/g,
    wrong: '할수있',
    suggestion: '할 수 있',
    reason: '의존명사 "수" 앞뒤 띄어쓰기.',
    severity: 'warning',
  },
  {
    pattern: /할것이/g,
    wrong: '할것이',
    suggestion: '할 것이',
    reason: '의존명사 "것" 앞 띄어쓰기.',
    severity: 'warning',
  },
  // ── 추가 자주 틀리는 맞춤법 (확장) ──────────────────────
  {
    pattern: /어의없/g,
    wrong: '어의없',
    suggestion: '어이없',
    reason: '"어이가 없다"가 맞는 표현입니다.',
    severity: 'error',
  },
  {
    pattern: /금새/g,
    wrong: '금새',
    suggestion: '금세',
    reason: '"지금 바로"의 뜻은 "금세"가 맞습니다.',
    severity: 'error',
  },
  {
    pattern: /왠만/g,
    wrong: '왠만',
    suggestion: '웬만',
    reason: '"어지간한"의 뜻은 "웬만"이 맞습니다.',
    severity: 'error',
  },
  {
    // "웬지"는 비표준 — "왠지"(왜인지의 줄임)가 맞습니다.
    pattern: /웬지/g,
    wrong: '웬지',
    suggestion: '왠지',
    reason: '"왜인지"의 줄임은 "왠지"입니다.',
    severity: 'error',
  },
  {
    pattern: /눈꼽/g,
    wrong: '눈꼽',
    suggestion: '눈곱',
    reason: '표준어는 "눈곱"입니다.',
    severity: 'error',
  },
  {
    pattern: /뒷통수/g,
    wrong: '뒷통수',
    suggestion: '뒤통수',
    reason: '표준어는 "뒤통수"입니다.',
    severity: 'error',
  },
  {
    pattern: /건내/g,
    wrong: '건내',
    suggestion: '건네',
    reason: '"건네다"가 맞는 표현입니다.',
    severity: 'error',
  },
  {
    pattern: /설겆이/g,
    wrong: '설겆이',
    suggestion: '설거지',
    reason: '표준어는 "설거지"입니다.',
    severity: 'error',
  },
  {
    pattern: /예기(?=[가는을를해])/g,
    wrong: '예기',
    suggestion: '얘기',
    reason: '"이야기"의 줄임은 "얘기"입니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])개재/g,
    wrong: '개재',
    suggestion: '게재',
    reason: '"신문·잡지에 싣다"는 "게재(揭載)"입니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])일일히/g,
    wrong: '일일히',
    suggestion: '일일이',
    reason: '표준어는 "일일이"입니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])깨끗히/g,
    wrong: '깨끗히',
    suggestion: '깨끗이',
    reason: '"-이"로 끝나는 부사 — "깨끗이"가 맞습니다.',
    severity: 'error',
  },
  {
    pattern: /희안/g,
    wrong: '희안',
    suggestion: '희한',
    reason: '"매우 드물거나 기이하다"는 "희한"입니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])치루/g,
    wrong: '치루',
    suggestion: '치르',
    reason: '"어떤 일을 겪어내다"는 "치르다"입니다.',
    severity: 'error',
  },
  {
    pattern: /폭팔/g,
    wrong: '폭팔',
    suggestion: '폭발',
    reason: '표준어는 "폭발(爆發)"입니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])어떻해/g,
    wrong: '어떻해',
    suggestion: '어떻게 해',
    reason: '"어떻게 해"의 줄임은 쓰지 않습니다.',
    severity: 'error',
  },
  {
    pattern: /이 뿐만 아니라/g,
    wrong: '이 뿐만 아니라',
    suggestion: '이뿐만 아니라',
    reason: '"뿐"은 조사, 붙여 씁니다.',
    severity: 'warning',
  },
  // ── 조사/어미 오류 ────────────────────────────────
  {
    pattern: /([^ ])로서([\s을를이가])/g,
    wrong: '로서',
    suggestion: '로써 (수단/방법일 때)',
    reason: '자격은 "로서", 수단·도구는 "로써". 문맥 확인 필요.',
    severity: 'info',
  },
  {
    // "맞추" 가 일상적으로 "조립·정렬" 의미로 쓰이는 경우가 많아 — 정답/답을 앞에서 찾은 경우에만 힌트
    pattern: /(?:정답|답을)\s*맞추/g,
    wrong: '정답을 맞추',
    suggestion: '정답을 맞히',
    reason: '정답을 말하면 "맞히다". 부품을 끼우면 "맞추다".',
    severity: 'info',
  },
  // ── 외래어/영문 한글 표기 (자주 틀림) ────────────────
  {
    pattern: /컨텐츠/g,
    wrong: '컨텐츠',
    suggestion: '콘텐츠',
    reason: '외래어 표기법: contents → "콘텐츠".',
    severity: 'error',
  },
  {
    pattern: /네비게이션/g,
    wrong: '네비게이션',
    suggestion: '내비게이션',
    reason: '외래어 표기법: navigation → "내비게이션".',
    severity: 'error',
  },
  {
    pattern: /어플리케이션/g,
    wrong: '어플리케이션',
    suggestion: '애플리케이션',
    reason: '외래어 표기법: application → "애플리케이션".',
    severity: 'error',
  },
  {
    pattern: /스케쥴/g,
    wrong: '스케쥴',
    suggestion: '스케줄',
    reason: '외래어 표기법: schedule → "스케줄".',
    severity: 'error',
  },
  {
    pattern: /메세지/g,
    wrong: '메세지',
    suggestion: '메시지',
    reason: '외래어 표기법: message → "메시지".',
    severity: 'error',
  },
  {
    pattern: /리더쉽/g,
    wrong: '리더쉽',
    suggestion: '리더십',
    reason: '외래어 표기법: leadership → "리더십".',
    severity: 'error',
  },
  {
    pattern: /멤버쉽/g,
    wrong: '멤버쉽',
    suggestion: '멤버십',
    reason: '외래어 표기법: membership → "멤버십".',
    severity: 'error',
  },
  {
    pattern: /파트너쉽/g,
    wrong: '파트너쉽',
    suggestion: '파트너십',
    reason: '외래어 표기법: partnership → "파트너십".',
    severity: 'error',
  },
  {
    pattern: /워크샵/g,
    wrong: '워크샵',
    suggestion: '워크숍',
    reason: '외래어 표기법: workshop → "워크숍".',
    severity: 'error',
  },
  {
    pattern: /팀웍(?!크)/g,
    wrong: '팀웍',
    suggestion: '팀워크',
    reason: '외래어 표기법: teamwork → "팀워크".',
    severity: 'error',
  },
  {
    pattern: /프로포즈/g,
    wrong: '프로포즈',
    suggestion: '프러포즈',
    reason: '외래어 표기법: propose → "프러포즈".',
    severity: 'error',
  },
  {
    pattern: /악세사리/g,
    wrong: '악세사리',
    suggestion: '액세서리',
    reason: '외래어 표기법: accessory → "액세서리".',
    severity: 'error',
  },
  {
    pattern: /까페/g,
    wrong: '까페',
    suggestion: '카페',
    reason: '표준어는 "카페"입니다.',
    severity: 'error',
  },
  {
    pattern: /비지니스/g,
    wrong: '비지니스',
    suggestion: '비즈니스',
    reason: '외래어 표기법: business → "비즈니스".',
    severity: 'error',
  },
  // ── 이력서 특화 추가 ──────────────────────────────
  {
    pattern: /책임지/g,
    wrong: '책임지',
    suggestion: '주도·총괄·운영',
    reason: '"책임" 은 수동적. 주도성 있는 동사 권장.',
    severity: 'info',
  },
  {
    pattern: /많은 것을 배웠/g,
    wrong: '많은 것을 배웠',
    suggestion: '구체적 배움 (예: "테스트 자동화를 익혔습니다")',
    reason: '"많은 것"은 추상적. 무엇을 배웠는지 구체화.',
    severity: 'warning',
  },
  {
    pattern: /다양한 경험/g,
    wrong: '다양한 경험',
    suggestion: '구체적 경험 목록',
    reason: '"다양한"은 모호. 구체 목록으로 대체.',
    severity: 'warning',
  },
  {
    pattern: /보람있는/g,
    wrong: '보람있는',
    suggestion: '보람 있는',
    reason: '"있는"은 띄어 씁니다.',
    severity: 'warning',
  },
  {
    pattern: /함께 일하는/g,
    wrong: '함께 일하는',
    suggestion: '협업한',
    reason: '"함께 일하다" 추상적. 성과 기반 표현 권장.',
    severity: 'info',
  },
  {
    pattern: /신경써/g,
    wrong: '신경써',
    suggestion: '신경 써',
    reason: '동사 "쓰다" 앞은 띄어 씁니다.',
    severity: 'warning',
  },
  // ── 자주 틀리는 맞춤법 (추가 확장) ──────────────────────────
  {
    pattern: /괜찬/g,
    wrong: '괜찬',
    suggestion: '괜찮',
    reason: '표준어는 "괜찮다"입니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])있다가/g,
    wrong: '있다가',
    suggestion: '이따가',
    reason: '"조금 뒤에"의 뜻은 "이따가"입니다. ("있다가"는 머물다 + 가 의미).',
    severity: 'info',
  },
  {
    pattern: /설레였/g,
    wrong: '설레였',
    suggestion: '설렜',
    reason: '"설레다"의 과거형은 "설렜다"입니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![음가나와도])낳(?=다|았|은|는)/g,
    wrong: '낳다',
    suggestion: '낫다 (병이 나음) / 낳다 (출산)',
    reason: '"병이 낫다"는 낫다, "아이를 낳다"는 낳다. 문맥 확인.',
    severity: 'info',
  },
  // (중복 제거 — 왠만 규칙은 위 블록으로 통합, \s 접두사 없는 패턴이 더 포괄적)
  {
    pattern: /맞추어/g,
    wrong: '맞추어',
    suggestion: '맞춰',
    reason: '"맞추어"의 줄임은 "맞춰"입니다 (구어체).',
    severity: 'info',
  },
  {
    pattern: /(?<![가-힣])몇번/g,
    wrong: '몇번',
    suggestion: '몇 번',
    reason: '"번"은 의존명사 — 띄어 씁니다.',
    severity: 'warning',
  },
  {
    pattern: /(?<![가-힣])몇가지/g,
    wrong: '몇가지',
    suggestion: '몇 가지',
    reason: '"가지"는 의존명사 — 띄어 씁니다.',
    severity: 'warning',
  },
  {
    pattern: /한번에/g,
    wrong: '한번에',
    suggestion: '한 번에 (횟수) / 한번 (시험삼아)',
    reason: '횟수면 "한 번", 시도/대충이면 "한번". 문맥 확인.',
    severity: 'info',
  },
  // ── 이력서·자기소개서 특화 약한 표현 (추가) ────────────────
  {
    pattern: /성격은\s*[^다.]*(활발|외향|적극)/g,
    wrong: '성격 묘사 (활발/외향/적극)',
    suggestion: '구체적 행동 사례',
    reason: '성격 형용사는 검증 불가 — "팀 갈등을 중재한 경험"처럼 사례로.',
    severity: 'info',
  },
  {
    pattern: /끈기있/g,
    wrong: '끈기있',
    suggestion: '끈기 있',
    reason: '형용사 "있다" 앞은 띄어 씁니다.',
    severity: 'warning',
  },
  {
    pattern: /\b참여했(?:습니다|어요)/g,
    wrong: '참여했',
    suggestion: '기여·주도·설계·구현 등 역할 동사',
    reason: '"참여" 만으론 기여도 불명확 — 구체 역할을 드러내세요.',
    severity: 'info',
  },
  {
    pattern: /\b도움을\s?드렸/g,
    wrong: '도움을 드렸',
    suggestion: '지원·해결·개선 등 구체 행동 동사',
    reason: '"도움" 은 모호 — 구체적 기여를 드러내세요.',
    severity: 'info',
  },
  {
    pattern: /임에도\s불구하고/g,
    wrong: '임에도 불구하고',
    suggestion: '이지만 / ~에도',
    reason: '문장이 장황해짐 — 간결하게.',
    severity: 'info',
  },
  {
    pattern: /~에\s*있어서?/g,
    wrong: '~에 있어(서)',
    suggestion: '~에서 / ~에 대해',
    reason: '번역투 — 자연스러운 한국어로.',
    severity: 'info',
  },
  // ── 부사 "-이/-히" 헷갈리는 것들 ─────────────────────────
  {
    pattern: /(?<![가-힣])간간히/g,
    wrong: '간간히',
    suggestion: '간간이',
    reason: '"-이"로 끝나는 부사 — "간간이"가 맞습니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])번번히/g,
    wrong: '번번히',
    suggestion: '번번이',
    reason: '표준어는 "번번이"입니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])나즈막/g,
    wrong: '나즈막',
    suggestion: '나지막',
    reason: '표준어는 "나지막하다"입니다.',
    severity: 'error',
  },
  {
    pattern: /솔직히\s/g,
    wrong: '솔직히',
    suggestion: '솔직히 (맞음)',
    reason: '확인: "솔직히"가 표준어. "솔직이" 는 오류.',
    severity: 'info',
  },
  // ── 이력서에서 자주 보는 비표준 경어 ─────────────────────
  {
    pattern: /있으시/g,
    wrong: '있으시',
    suggestion: '계시',
    reason: '사람에 대한 높임은 "계시다"입니다. ("있으시다" 는 물건용)',
    severity: 'info',
  },
  // ── IT·비즈니스 맥락 맞춤법 ──────────────────────────────
  {
    pattern: /런칭/g,
    wrong: '런칭',
    suggestion: '론칭',
    reason: '외래어 표기법: launch → "론칭".',
    severity: 'error',
  },
  {
    pattern: /악셀/g,
    wrong: '악셀',
    suggestion: '액셀',
    reason: '외래어 표기법: accelerator → "액셀".',
    severity: 'error',
  },
  {
    pattern: /까르텔/g,
    wrong: '까르텔',
    suggestion: '카르텔',
    reason: '외래어 표기법: cartel → "카르텔".',
    severity: 'error',
  },
  {
    pattern: /타겟/g,
    wrong: '타겟',
    suggestion: '타깃',
    reason: '외래어 표기법: target → "타깃".',
    severity: 'error',
  },
  {
    pattern: /데이타/g,
    wrong: '데이타',
    suggestion: '데이터',
    reason: '외래어 표기법: data → "데이터".',
    severity: 'error',
  },
  {
    pattern: /시그너처/g,
    wrong: '시그너처',
    suggestion: '시그니처',
    reason: '외래어 표기법: signature → "시그니처".',
    severity: 'error',
  },
  // ── 자주 헷갈리는 맞춤법 (3차 확장) ────────────────────
  {
    // "가구지/나무구지" 같은 오매치 회피 + 문장 시작 위치에서도 매치
    pattern: /(?<![가-힣])구지/g,
    wrong: '구지',
    suggestion: '굳이',
    reason: '"일부러·반드시"의 뜻은 "굳이"입니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])곰곰히/g,
    wrong: '곰곰히',
    suggestion: '곰곰이',
    reason: '"-이"로 끝나는 부사 — "곰곰이"가 맞습니다.',
    severity: 'error',
  },
  {
    pattern: /따듯이/g,
    wrong: '따듯이',
    suggestion: '따뜻이',
    reason: '표준어는 "따뜻이"입니다.',
    severity: 'error',
  },
  {
    pattern: /짜집기/g,
    wrong: '짜집기',
    suggestion: '짜깁기',
    reason: '"이것저것 끌어 맞추기"는 "짜깁기"입니다.',
    severity: 'error',
  },
  {
    pattern: /제작년/g,
    wrong: '제작년',
    suggestion: '재작년',
    reason: '"지난해의 전해"는 "재작년(再昨年)"입니다.',
    severity: 'error',
  },
  {
    pattern: /부주(?=[금을를함])/g,
    wrong: '부주',
    suggestion: '부조',
    reason: '경조사비는 "부조(扶助)"가 맞습니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])통채로/g,
    wrong: '통채로',
    suggestion: '통째로',
    reason: '표준어는 "통째로"입니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])덥썩/g,
    wrong: '덥썩',
    suggestion: '덥석',
    reason: '표준어는 "덥석"입니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])아뭏든/g,
    wrong: '아뭏든',
    suggestion: '아무튼',
    reason: '표준어는 "아무튼"입니다.',
    severity: 'error',
  },
  {
    pattern: /빈털털이/g,
    wrong: '빈털털이',
    suggestion: '빈털터리',
    reason: '표준어는 "빈털터리"입니다.',
    severity: 'error',
  },
  // ── 구두점·공백 정리 (복붙 후 자주 남는 잔재) ──────────────
  {
    pattern: /!{2,}/g,
    wrong: '!!',
    suggestion: '!',
    reason: '이력서·자기소개서에서 느낌표 반복은 과장된 인상을 줍니다.',
    severity: 'warning',
  },
  {
    pattern: /\?{2,}/g,
    wrong: '??',
    suggestion: '?',
    reason: '물음표 반복은 비격식 — 공식 문서에서는 단일 사용.',
    severity: 'warning',
  },
  {
    pattern: /\.{3,}(?!\.)/g,
    wrong: '...',
    suggestion: '…',
    reason: '3개 이상의 점은 말줄임표 "…" (U+2026) 로 통일합니다.',
    severity: 'info',
  },
  {
    pattern: / {2,}(?=\S)/g,
    wrong: '  (공백 2개 이상)',
    suggestion: ' (공백 1개)',
    reason: '연속된 공백은 한 칸으로 통일합니다. (복붙 잔재)',
    severity: 'info',
  },
  {
    pattern: /\u3000/g, // Full-width space (U+3000) — ESLint no-irregular-whitespace 회피 위해 이스케이프
    wrong: '[전각공백]',
    suggestion: ' ',
    reason: '전각 공백(U+3000)을 일반 공백으로 통일합니다.',
    severity: 'warning',
  },
  // ── 추가 이력서 빈출 오표현 ──────────────────────────────
  {
    pattern: /(?<![가-힣])얼만큼/g,
    wrong: '얼만큼',
    suggestion: '얼마큼',
    reason: '"얼마큼"이 표준어입니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])왠일/g,
    wrong: '왠일',
    suggestion: '웬일',
    reason: '"어찌 된 일"의 뜻은 "웬일"입니다.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])틈틈히/g,
    wrong: '틈틈히',
    suggestion: '틈틈이',
    reason: '부사는 "틈틈이"입니다. (~히는 한자어에 주로 붙음)',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])갯수/g,
    wrong: '갯수',
    suggestion: '개수',
    reason: '한자어 앞에는 사이시옷을 넣지 않습니다. "개수(個數)".',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])꼭지점/g,
    wrong: '꼭지점',
    suggestion: '꼭짓점',
    reason: '표준어는 "꼭짓점"입니다 (사이시옷 포함).',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])윗어른/g,
    wrong: '윗어른',
    suggestion: '웃어른',
    reason: '"웃-"으로 시작하는 몇몇 단어: "웃어른·웃돈·웃비". "윗-"은 아래와 짝이 있을 때만.',
    severity: 'error',
  },
  {
    pattern: /(?<![가-힣])하므로써/g,
    wrong: '하므로써',
    suggestion: '함으로써',
    reason: '수단·방법은 "-ㅁ으로써". "-므로"는 이유(연결어미).',
    severity: 'warning',
  },
  {
    pattern: /(?<![가-힣])체근/g,
    wrong: '체근',
    suggestion: '최근',
    reason: '오타로 추정됩니다. "최근" 을 의도한 것으로 보입니다.',
    severity: 'warning',
  },
  {
    pattern: /(?<![가-힣])않되/g,
    wrong: '않되',
    suggestion: '안 되',
    reason: '부정은 "안", "않-"은 용언 활용. "안 된다"가 맞습니다.',
    severity: 'error',
  },
];

export function checkKorean(resume: Resume): KoreanCheckResult {
  const issues: KoreanIssue[] = [];
  let formalCount = 0;
  let politeCount = 0;
  let totalSentences = 0;
  let totalChars = 0;

  const sections: Array<{ name: string; text: string }> = [
    { name: '자기소개', text: resume.personalInfo.summary || '' },
    ...resume.experiences.map((e, i) => ({
      name: `경력 ${i + 1} - ${e.company || '무제'}`,
      text: `${stripHtml(e.description || '')} ${stripHtml(e.achievements || '')}`,
    })),
    ...resume.projects.map((p, i) => ({
      name: `프로젝트 ${i + 1} - ${p.name || '무제'}`,
      text: stripHtml(p.description || ''),
    })),
    ...resume.educations.map((e, i) => ({
      name: `학력 ${i + 1} - ${e.school || '무제'}`,
      text: stripHtml(e.description || ''),
    })),
    ...(resume.certifications ?? []).map((c, i) => ({
      name: `자격증 ${i + 1} - ${c.name || '무제'}`,
      text: stripHtml(c.description || ''),
    })),
    ...(resume.awards ?? []).map((a, i) => ({
      name: `수상 ${i + 1} - ${a.name || '무제'}`,
      text: stripHtml(a.description || ''),
    })),
    ...(resume.activities ?? []).map((a, i) => ({
      name: `활동 ${i + 1} - ${a.name || '무제'}`,
      text: stripHtml(a.description || ''),
    })),
  ];

  for (const { name, text } of sections) {
    if (!text) continue;
    const stats = analyzeSectionText(text, name, issues);
    totalChars += text.length;
    totalSentences += stats.sentenceCount;
    formalCount += stats.formalCount;
    politeCount += stats.politeCount;
  }

  let dominant: KoreanCheckResult['toneMix']['dominant'] = 'none';
  const total = formalCount + politeCount;
  if (total > 0) {
    const fRatio = formalCount / total;
    if (fRatio > 0.8) dominant = 'formal';
    else if (fRatio < 0.2) dominant = 'polite';
    else dominant = 'mixed';
  }

  // 문체 혼용이면 이슈로 추가
  if (dominant === 'mixed' && total > 3) {
    issues.push({
      context: `합니다체 ${formalCount}문장 · 해요체 ${politeCount}문장`,
      wrong: '문체 혼용',
      suggestion: '한 가지로 통일',
      reason: '이력서는 보통 "합니다체"로 통일합니다. 해요체와 섞이면 비전문적으로 읽힙니다.',
      severity: 'warning',
      section: '전체',
      offset: 0,
      length: 0,
    });
  }

  // 심각도 요약 + 점수 계산
  const summary = { error: 0, warning: 0, info: 0 };
  for (const iss of issues) summary[iss.severity]++;
  const score = computeScore(summary, totalChars, dominant === 'mixed');

  return {
    issues,
    toneMix: { formal: formalCount, polite: politeCount, dominant },
    totalSentences,
    summary,
    score,
  };
}

/**
 * 한 섹션(임의 텍스트)을 검사해 issues 배열에 push + 문장 통계 반환.
 * checkKorean() 이 내부에서 섹션마다 호출하고, checkText() 가 임의 텍스트에 노출.
 */
function analyzeSectionText(
  text: string,
  sectionName: string,
  issues: KoreanIssue[],
): { sentenceCount: number; formalCount: number; politeCount: number } {
  // 규칙 기반 단어 치환
  for (const rule of RULES) {
    const matches = text.matchAll(rule.pattern);
    for (const m of matches) {
      const idx = m.index ?? 0;
      const matchLength = m[0].length;
      const context = text.slice(Math.max(0, idx - 15), Math.min(text.length, idx + 20));
      issues.push({
        context: cleanContext(context),
        wrong: rule.wrong,
        suggestion: rule.suggestion,
        reason: rule.reason,
        severity: rule.severity,
        section: sectionName,
        offset: idx,
        length: matchLength,
      });
    }
  }

  // 문장 단위 분석 (문체·긴문장·수동태)
  const sentences = text.split(/[.!?]|\n/).filter((s) => s.trim().length > 5);
  let formalCount = 0;
  let politeCount = 0;
  let runningOffset = 0;
  for (const s of sentences) {
    const trimmed = s.trim();
    if (/습니다[.!?]?\s*$|합니다[.!?]?\s*$|입니다[.!?]?\s*$/.test(trimmed)) formalCount++;
    if (/해요[.!?]?\s*$|에요[.!?]?\s*$|예요[.!?]?\s*$/.test(trimmed)) politeCount++;

    if (trimmed.length > 80) {
      const idx = text.indexOf(trimmed, runningOffset);
      issues.push({
        context: cleanContext(trimmed.slice(0, 40) + '...'),
        wrong: `긴 문장 (${trimmed.length}자)`,
        suggestion: '문장 분리',
        reason: '문장이 80자를 넘으면 가독성이 떨어집니다. 2~3문장으로 분리하세요.',
        severity: 'info',
        section: sectionName,
        offset: idx >= 0 ? idx : 0,
        length: trimmed.length,
      });
    }

    if (/되어진|지게\s?되었|지게\s?된/.test(trimmed)) {
      const m = trimmed.match(/되어진|지게\s?되었|지게\s?된/);
      const idx = text.indexOf(trimmed, runningOffset);
      issues.push({
        context: cleanContext(trimmed.slice(0, 40)),
        wrong: m?.[0] ?? '수동태',
        suggestion: '능동태 (~하였다, ~했다)',
        reason: '이중 수동태 — 한국어에서 피해야 할 번역투. 능동 표현이 자연스럽습니다.',
        severity: 'warning',
        section: sectionName,
        offset: idx >= 0 ? idx : 0,
        length: m?.[0].length ?? 0,
      });
    }

    runningOffset = Math.max(runningOffset, text.indexOf(trimmed, runningOffset) + trimmed.length);
  }

  // 반복 접속사
  for (const rep of ['그리고', '또한', '그래서', '그런데']) {
    const count = (text.match(new RegExp(rep, 'g')) ?? []).length;
    if (count >= 3) {
      const firstIdx = text.indexOf(rep);
      issues.push({
        context: cleanContext(text.slice(Math.max(0, firstIdx - 10), firstIdx + 20)),
        wrong: `"${rep}" 반복 (${count}회)`,
        suggestion: '접속사 다양화 또는 생략',
        reason: '같은 접속사가 반복되면 단조롭습니다. 문맥에 따라 제거하거나 다른 표현으로.',
        severity: 'info',
        section: sectionName,
        offset: firstIdx,
        length: rep.length,
      });
    }
  }

  // 헷지(hedging) 과다 — "것 같다" 류가 3회 이상이면 자신감 부족 인상
  const hedgePatterns = [/것\s*같습니다/g, /것\s*같다/g, /수도\s*있습니다/g];
  let hedgeTotal = 0;
  for (const p of hedgePatterns) hedgeTotal += (text.match(p) ?? []).length;
  if (hedgeTotal >= 3) {
    issues.push({
      context: `"것 같다·수도 있다" 류 ${hedgeTotal}회`,
      wrong: '과도한 헷지 표현',
      suggestion: '단정적 표현 (~했습니다, ~입니다)',
      reason:
        '"것 같다·수도 있다" 가 반복되면 자신감 없는 인상 — 이력서는 단정적 표현이 설득력을 높입니다.',
      severity: 'info',
      section: sectionName,
      offset: 0,
      length: 0,
    });
  }

  return { sentenceCount: sentences.length, formalCount, politeCount };
}

/**
 * Resume 이 아닌 임의 텍스트(커버레터·자소서 단편 등) 를 검사.
 * checkKorean 과 동일한 KoreanCheckResult 형태를 반환.
 */
export function checkText(text: string, sectionName = '본문'): KoreanCheckResult {
  const issues: KoreanIssue[] = [];
  const stats = analyzeSectionText(text ?? '', sectionName, issues);
  const totalChars = (text ?? '').length;

  let dominant: KoreanCheckResult['toneMix']['dominant'] = 'none';
  const total = stats.formalCount + stats.politeCount;
  if (total > 0) {
    const fRatio = stats.formalCount / total;
    if (fRatio > 0.8) dominant = 'formal';
    else if (fRatio < 0.2) dominant = 'polite';
    else dominant = 'mixed';
  }
  if (dominant === 'mixed' && total > 3) {
    issues.push({
      context: `합니다체 ${stats.formalCount}문장 · 해요체 ${stats.politeCount}문장`,
      wrong: '문체 혼용',
      suggestion: '한 가지로 통일',
      reason: '글 전체가 "합니다체" 또는 "해요체" 중 하나로 통일되어야 합니다.',
      severity: 'warning',
      section: sectionName,
      offset: 0,
      length: 0,
    });
  }

  const summary = { error: 0, warning: 0, info: 0 };
  for (const iss of issues) summary[iss.severity]++;
  const score = computeScore(summary, totalChars, dominant === 'mixed');

  return {
    issues,
    toneMix: { formal: stats.formalCount, polite: stats.politeCount, dominant },
    totalSentences: stats.sentenceCount,
    summary,
    score,
  };
}

/**
 * 문자열에 모든 맞춤법 규칙을 적용해 자동 수정본을 반환.
 * @param text - 원문
 * @param severity - 'error'만 수정 (기본) 또는 'all' — warning/info 의 경우 suggestion 이 힌트성이어서 기본 제외
 * @returns { fixed: 수정된 문자열, changes: 변경 내역 }
 */
export function autoFixText(
  text: string,
  severity: 'error' | 'all' = 'error',
): { fixed: string; changes: Array<{ from: string; to: string }> } {
  let fixed = text;
  const changes: Array<{ from: string; to: string }> = [];
  for (const rule of RULES) {
    if (severity === 'error' && rule.severity !== 'error') continue;
    // 힌트성 제안(치환 문자열이 설명문/선택지 포함) 은 자동 치환 안 함
    if (isHintSuggestion(rule.suggestion)) continue;
    if (rule.pattern.test(fixed)) {
      const before = fixed;
      // g 플래그 유지를 위해 재생성
      fixed = fixed.replace(new RegExp(rule.pattern.source, rule.pattern.flags), rule.suggestion);
      if (before !== fixed) changes.push({ from: rule.wrong, to: rule.suggestion });
    }
  }
  return { fixed, changes };
}

/** 제안 문자열이 힌트/설명인지 (→·괄호·"권장"·"구체" 등 포함) — 자동치환 금지 */
function isHintSuggestion(s: string): boolean {
  return /[→(/]|권장|구체|이내|\s등\s|문맥/.test(s);
}

/**
 * 품질 점수 계산 — 분량(totalChars)을 고려한 밀도 기반 penalty.
 * - 기본 100점
 * - error=−8, warning=−3, info=−1
 * - 문체 혼용 추가 −5
 * - 1000자당 penalty 상한 25 적용 (짧은 글에서도 과도하지 않도록)
 */
function computeScore(
  summary: { error: number; warning: number; info: number },
  totalChars: number,
  toneMixed: boolean,
): number {
  const raw = summary.error * 8 + summary.warning * 3 + summary.info + (toneMixed ? 5 : 0);
  const cap = Math.max(10, Math.min(100, Math.round((totalChars / 1000) * 25 + 25)));
  const penalty = Math.min(raw, cap);
  return Math.max(0, Math.min(100, 100 - penalty));
}

/** 외부 확장 (테스트·진단용) — 현재 등록된 규칙 수 */
export const KOREAN_RULE_COUNT = RULES.length;

/**
 * 규칙 메타데이터 — admin/dev 도구에서 "몇 개 규칙이 등록되어 있고 어떤 분포인지" 파악.
 */
export interface RuleMetadata {
  total: number;
  bySeverity: { error: number; warning: number; info: number };
  /** 중복 wrong 이 있으면 UX 가 혼란스러워지므로 추적 */
  duplicateWrongs: string[];
}
export function getRuleMetadata(): RuleMetadata {
  const bySeverity = { error: 0, warning: 0, info: 0 };
  const seen = new Map<string, number>();
  for (const r of RULES) {
    bySeverity[r.severity]++;
    seen.set(r.wrong, (seen.get(r.wrong) ?? 0) + 1);
  }
  const duplicateWrongs = [...seen.entries()].filter(([, n]) => n > 1).map(([w]) => w);
  return { total: RULES.length, bySeverity, duplicateWrongs };
}

/**
 * 모든 규칙의 기본적인 안전성 검증 — dev 모드에서 호출해 추가된 규칙이
 * 빈 필드나 잘못된 정규식을 가지지 않는지 확인.
 * 실패 시 문제 있는 규칙 인덱스 + 이유 목록 반환.
 */
export interface RuleValidationIssue {
  index: number;
  wrong: string;
  problem: string;
}
/**
 * 모듈 스모크 테스트 — 클라이언트에 test runner 가 없어 내장 self-check 로 대체.
 * 알려진 입력/출력 쌍이 실제로 감지되는지 확인. dev 도구/CI smoke 로 호출.
 */
export interface SelfCheckCase {
  input: string;
  expectedWrong: string;
  description: string;
}
export interface SelfCheckResult {
  passed: number;
  failed: Array<SelfCheckCase & { foundWrongs: string[] }>;
  total: number;
}
const SELF_CHECK_CASES: SelfCheckCase[] = [
  { input: '이 부분이 됬다.', expectedWrong: '됬', description: '되었→됐' },
  { input: '컨텐츠 관리', expectedWrong: '컨텐츠', description: '외래어 콘텐츠' },
  { input: '열심히 했습니다.', expectedWrong: '열심히 했', description: '약한 표현' },
  { input: '!!', expectedWrong: '!!', description: '느낌표 반복' },
  { input: '스케쥴을 조정', expectedWrong: '스케쥴', description: '외래어 스케줄' },
  { input: '괜찬습니다.', expectedWrong: '괜찬', description: '괜찮' },
  { input: '구지 말씀드리면', expectedWrong: '구지', description: '굳이 (문장시작)' },
  { input: '역활을 맡아', expectedWrong: '역활', description: '역할' },
  // 문장시작 lookbehind regression 방지
  { input: '깨끗히 정리했다', expectedWrong: '깨끗히', description: '깨끗이 (문장시작)' },
  { input: '일일히 체크', expectedWrong: '일일히', description: '일일이 (문장시작)' },
  { input: '어떻해 해야 하나', expectedWrong: '어떻해', description: '어떻게 해 (문장시작)' },
  { input: '몇번 시도', expectedWrong: '몇번', description: '몇 번 (문장시작)' },
];
export function runSelfCheck(): SelfCheckResult {
  const failed: SelfCheckResult['failed'] = [];
  let passed = 0;
  for (const tc of SELF_CHECK_CASES) {
    const result = checkText(tc.input);
    const foundWrongs = result.issues.map((i) => i.wrong);
    if (foundWrongs.includes(tc.expectedWrong)) {
      passed++;
    } else {
      failed.push({ ...tc, foundWrongs });
    }
  }
  return { passed, failed, total: SELF_CHECK_CASES.length };
}

export function validateRules(): RuleValidationIssue[] {
  const issues: RuleValidationIssue[] = [];
  RULES.forEach((r, i) => {
    if (!r.wrong?.trim()) {
      issues.push({ index: i, wrong: r.wrong ?? '', problem: 'wrong 이 비어있음' });
    }
    // suggestion 이 공백 1칸일 수 있음(전각공백→일반공백 류) → length === 0 만 체크
    if (r.suggestion === undefined || r.suggestion === null || r.suggestion.length === 0) {
      issues.push({ index: i, wrong: r.wrong, problem: 'suggestion 이 비어있음' });
    }
    if (!r.reason?.trim()) {
      issues.push({ index: i, wrong: r.wrong, problem: 'reason 이 비어있음' });
    }
    if (!r.pattern.global) {
      issues.push({ index: i, wrong: r.wrong, problem: "pattern 에 'g' 플래그 없음" });
    }
    // 자기 치환 루프 방지: wrong === suggestion (은 사실상 no-op)
    if (r.wrong === r.suggestion) {
      issues.push({ index: i, wrong: r.wrong, problem: 'wrong === suggestion (no-op 규칙)' });
    }
  });
  return issues;
}

/**
 * 자동 수정 전/후 결과 비교 — 개선 성과 리포트용.
 * - fixed: 이전엔 있었지만 이제 사라진 이슈 (개선 성공)
 * - introduced: 수정 과정에서 새로 생긴 이슈 (퇴행)
 * - scoreDelta: 점수 변화 (양수 = 개선)
 */
export interface KoreanCompareResult {
  fixed: KoreanIssue[];
  introduced: KoreanIssue[];
  remaining: number;
  scoreDelta: number;
  beforeScore: number;
  afterScore: number;
}
export function compareKoreanResults(
  before: KoreanCheckResult,
  after: KoreanCheckResult,
): KoreanCompareResult {
  const key = (i: KoreanIssue) => `${i.section}::${i.wrong}::${i.offset}`;
  const beforeKeys = new Map(before.issues.map((i) => [key(i), i]));
  const afterKeys = new Map(after.issues.map((i) => [key(i), i]));
  const fixed: KoreanIssue[] = [];
  const introduced: KoreanIssue[] = [];
  for (const [k, i] of beforeKeys) if (!afterKeys.has(k)) fixed.push(i);
  for (const [k, i] of afterKeys) if (!beforeKeys.has(k)) introduced.push(i);
  return {
    fixed,
    introduced,
    remaining: after.issues.length,
    scoreDelta: after.score - before.score,
    beforeScore: before.score,
    afterScore: after.score,
  };
}

/**
 * 이슈 목록을 Markdown 표로 직렬화 — 코치·동료에게 피드백 공유용.
 * 이모지 접두사로 심각도를 시각화 (GitHub 등 일반 Markdown 뷰어 호환).
 */
export function exportIssuesAsMarkdown(
  issues: KoreanIssue[],
  title = '한국어 맞춤법 감수 결과',
): string {
  if (issues.length === 0) return `# ${title}\n\n✓ 감지된 이슈 없음\n`;
  const ICON: Record<KoreanIssue['severity'], string> = {
    error: '❌',
    warning: '⚠️',
    info: '💡',
  };
  const header = '| 섹션 | 심각도 | 틀린 표현 | 제안 | 이유 |\n|---|---|---|---|---|';
  const rows = issues
    .map(
      (i) =>
        `| ${escapePipe(i.section)} | ${ICON[i.severity]} | \`${escapePipe(
          i.wrong,
        )}\` | **${escapePipe(i.suggestion)}** | ${escapePipe(i.reason)} |`,
    )
    .join('\n');
  return `# ${title}\n\n총 ${issues.length}건\n\n${header}\n${rows}\n`;
}

/**
 * 이슈 목록을 CSV 로 직렬화 — 스프레드시트 분석·대량 교정 검토용.
 * RFC 4180 규약에 따라 쌍따옴표·쉼표·개행 이스케이프.
 */
export function exportIssuesAsCsv(issues: KoreanIssue[]): string {
  const header = 'section,severity,wrong,suggestion,reason,offset,length';
  const rows = issues.map((i) =>
    [i.section, i.severity, i.wrong, i.suggestion, i.reason, i.offset, i.length]
      .map((v) => csvEscape(String(v)))
      .join(','),
  );
  return [header, ...rows].join('\n');
}

function escapePipe(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * 결과를 보고 가장 임팩트 큰 개선 3가지를 산출.
 * UI 에서 "먼저 이것부터 고치세요" 식 상단 배너로 렌더링.
 */
export interface ImprovementTip {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}
export function computeImprovementTips(result: KoreanCheckResult): ImprovementTip[] {
  const tips: ImprovementTip[] = [];
  const { summary, toneMix, score } = result;

  if (summary.error > 0) {
    tips.push({
      title: `명백한 오타 ${summary.error}건 먼저 수정`,
      description: '맞춤법 오타는 "자동 수정" 버튼으로 한 번에 교정 가능합니다.',
      priority: 'high',
    });
  }
  if (toneMix.dominant === 'mixed') {
    tips.push({
      title: `문체 통일 필요 (합니다체 ${toneMix.formal} · 해요체 ${toneMix.polite})`,
      description: '이력서는 보통 "합니다체"로 통일합니다. 해요체와 섞이면 비전문적으로 읽힙니다.',
      priority: 'high',
    });
  }
  if (summary.warning > 0 && tips.length < 3) {
    tips.push({
      title: `경고 ${summary.warning}건 검토 권장`,
      description: '띄어쓰기·약한 표현·긴 문장 등 — 취업 경쟁력 강화를 위해 점검이 필요합니다.',
      priority: 'medium',
    });
  }
  if (summary.info >= 5 && tips.length < 3) {
    tips.push({
      title: `스타일 제안 ${summary.info}건`,
      description: '구체적 동사·수치화 등 — 여유가 있을 때 반영하면 더 설득력 있는 글이 됩니다.',
      priority: 'low',
    });
  }
  if (tips.length === 0 && score >= 90) {
    tips.push({
      title: '훌륭합니다 — 추가 조치 불필요',
      description: `${score}점의 깔끔한 문체. 그대로 제출해도 좋은 상태입니다.`,
      priority: 'low',
    });
  }
  return tips.slice(0, 3);
}

/** 섹션별로 이슈 묶기 — UI 에서 collapsible 그룹 렌더링용 */
export function groupIssuesBySection(issues: KoreanIssue[]): Record<string, KoreanIssue[]> {
  const groups: Record<string, KoreanIssue[]> = {};
  for (const iss of issues) {
    (groups[iss.section] ||= []).push(iss);
  }
  return groups;
}

/** 심각도별로 이슈 필터 */
export function issuesBySeverity(
  issues: KoreanIssue[],
  severity: KoreanIssue['severity'],
): KoreanIssue[] {
  return issues.filter((i) => i.severity === severity);
}

/** 명확한 error 가 하나라도 있는지 빠른 체크 */
export function hasKoreanErrors(result: KoreanCheckResult): boolean {
  return result.summary.error > 0;
}

/**
 * 심각도(error→warning→info) → 섹션명 → offset 순으로 정렬.
 * UI 리스트에서 상단에 중요한 이슈가 먼저 오도록.
 */
const SEVERITY_ORDER: Record<KoreanIssue['severity'], number> = {
  error: 0,
  warning: 1,
  info: 2,
};
export function sortKoreanIssues(issues: KoreanIssue[]): KoreanIssue[] {
  return [...issues].sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (s !== 0) return s;
    const sec = a.section.localeCompare(b.section);
    if (sec !== 0) return sec;
    return a.offset - b.offset;
  });
}

/**
 * 단일 이슈 기반 부분 치환 — 인터랙티브 UI(제안 버튼 클릭) 용.
 * offset/length 기반 정확한 slice 치환이라 autoFixText 의 전역 정규식과 달리
 * 다른 동일 단어 발생은 건드리지 않음.
 */
export function fixIssueInText(text: string, issue: KoreanIssue): string {
  if (issue.length <= 0 || isHintSuggestion(issue.suggestion)) return text;
  return text.slice(0, issue.offset) + issue.suggestion + text.slice(issue.offset + issue.length);
}

/**
 * 같은 (wrong, section) 조합이 반복되는 이슈를 중복 제거.
 * UI 가 너무 많은 동일 항목을 보여주지 않도록 — count 필드로 빈도 노출.
 */
export interface DedupedKoreanIssue extends KoreanIssue {
  count: number;
}
export function dedupIssues(issues: KoreanIssue[]): DedupedKoreanIssue[] {
  const seen = new Map<string, DedupedKoreanIssue>();
  for (const iss of issues) {
    const key = `${iss.section}::${iss.wrong}`;
    const prev = seen.get(key);
    if (prev) {
      prev.count++;
    } else {
      seen.set(key, { ...iss, count: 1 });
    }
  }
  return [...seen.values()];
}

/**
 * 가장 자주 틀리는 표현 TOP N — 섹션 구분 없이 wrong 기준 집계.
 * UI 에서 "자주 틀리는 표현 Top 3" 학습 힌트로 노출하면 반복 오타 교정 효과 ↑.
 */
export interface TopWrongPattern {
  wrong: string;
  suggestion: string;
  count: number;
  severity: KoreanIssue['severity'];
}
export function getTopWrongPatterns(issues: KoreanIssue[], topN = 3): TopWrongPattern[] {
  const map = new Map<string, TopWrongPattern>();
  for (const iss of issues) {
    const prev = map.get(iss.wrong);
    if (prev) prev.count++;
    else
      map.set(iss.wrong, {
        wrong: iss.wrong,
        suggestion: iss.suggestion,
        count: 1,
        severity: iss.severity,
      });
  }
  return [...map.values()]
    .filter((p) => p.count >= 2) // 단발성은 제외 — 반복 오타만 학습 가치 있음
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/** Resume 전체 필드에 대해 자동 수정 적용 */
export function autoFixResume(
  resume: Resume,
  severity: 'error' | 'all' = 'error',
): { resume: Resume; totalChanges: number } {
  let totalChanges = 0;
  const apply = (s: string): string => {
    if (!s) return s;
    const { fixed, changes } = autoFixText(s, severity);
    totalChanges += changes.length;
    return fixed;
  };
  return {
    resume: {
      ...resume,
      personalInfo: { ...resume.personalInfo, summary: apply(resume.personalInfo.summary || '') },
      experiences: resume.experiences.map((e) => ({
        ...e,
        description: apply(e.description || ''),
        achievements: apply(e.achievements || ''),
      })),
      projects: resume.projects.map((p) => ({ ...p, description: apply(p.description || '') })),
      educations: resume.educations.map((e) => ({
        ...e,
        description: apply(e.description || ''),
      })),
      certifications: (resume.certifications ?? []).map((c) => ({
        ...c,
        description: apply(c.description || ''),
      })),
      awards: (resume.awards ?? []).map((a) => ({
        ...a,
        description: apply(a.description || ''),
      })),
      activities: (resume.activities ?? []).map((a) => ({
        ...a,
        description: apply(a.description || ''),
      })),
    },
    totalChanges,
  };
}

/**
 * 문장 종결 어미 다양성 분석 — 이력서·자소서에서 같은 어미만 반복하면
 * 단조롭고 AI 생성물처럼 보임. 상위 종결어미와 집중도(Herfindahl)를 계산.
 *
 * monotonyScore: 0~100. 100 에 가까울수록 한두 어미에 집중되어 단조로움.
 * dominantEndings: 빈도 상위 어미 최대 5개.
 */
export interface SentenceEndingAnalysis {
  total: number;
  dominantEndings: Array<{ ending: string; count: number; percent: number }>;
  monotonyScore: number;
  suggestion: string;
}

const ENDING_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: '했습니다', regex: /(했|됐|받았|만들었|썼|봤|갔|왔|냈)습니다(?=[.!?。\s]|$)/ },
  { label: '합니다', regex: /(합|됩|드립|봅|갑|옵)니다(?=[.!?。\s]|$)/ },
  { label: '입니다', regex: /입니다(?=[.!?。\s]|$)/ },
  { label: '있습니다', regex: /있습니다(?=[.!?。\s]|$)/ },
  { label: '없습니다', regex: /없습니다(?=[.!?。\s]|$)/ },
  { label: '됩니다', regex: /됩니다(?=[.!?。\s]|$)/ },
  { label: '~다.', regex: /[가-힣]다(?=[.!?。\s]|$)/ },
  { label: '했다', regex: /(했|됐|갔|왔|봤|받았)다(?=[.!?。\s]|$)/ },
  { label: '해요', regex: /해요(?=[.!?。\s]|$)/ },
  { label: '~요.', regex: /[가-힣]요(?=[.!?。\s]|$)/ },
];

export function analyzeSentenceEndings(text: string): SentenceEndingAnalysis {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) {
    return { total: 0, dominantEndings: [], monotonyScore: 0, suggestion: '' };
  }
  const sentences = clean.split(/[.!?。]+/).filter((s) => s.trim().length > 0);
  const counts = new Map<string, number>();
  let matched = 0;
  for (const s of sentences) {
    const trimmed = s.trim();
    for (const { label, regex } of ENDING_PATTERNS) {
      if (regex.test(trimmed + '.')) {
        counts.set(label, (counts.get(label) ?? 0) + 1);
        matched++;
        break;
      }
    }
  }
  const total = matched;
  const entries = [...counts.entries()]
    .map(([ending, count]) => ({ ending, count, percent: total ? (count * 100) / total : 0 }))
    .sort((a, b) => b.count - a.count);
  const top5 = entries.slice(0, 5);

  // Herfindahl-Hirschman index — 0~10000 기준, %² 합계. 단일 어미면 10000.
  let hhi = 0;
  for (const e of entries) hhi += e.percent * e.percent;
  const monotonyScore = Math.min(100, Math.round(hhi / 100));

  let suggestion = '';
  if (total < 5) {
    suggestion = '분석을 위한 문장이 부족합니다 (5 문장 이상 권장).';
  } else if (monotonyScore >= 60) {
    const dom = top5[0];
    suggestion = `"${dom.ending}" 어미에 ${dom.percent.toFixed(0)}% 집중되어 단조롭습니다. 종결어미를 2~3 종류로 변주해 보세요.`;
  } else if (monotonyScore >= 40) {
    suggestion = '종결어미 분포가 약간 편중되어 있습니다. 상위 어미 비중을 낮춰 보세요.';
  } else {
    suggestion = '종결어미 분포가 자연스럽습니다.';
  }

  return { total, dominantEndings: top5, monotonyScore, suggestion };
}

/**
 * 어휘 다양성 (Type-Token Ratio) — 중복 단어 비율이 높으면 어휘 빈약.
 * 한글 단어만 2자 이상 추출해 TTR 계산.
 */
export interface LexicalDiversityAnalysis {
  tokenCount: number;
  uniqueCount: number;
  ttr: number; // 0~1, 1 에 가까울수록 다양
  level: 'low' | 'medium' | 'high';
  suggestion: string;
}

export function analyzeLexicalDiversity(text: string): LexicalDiversityAnalysis {
  const tokens = (text ?? '').match(/[가-힣]{2,}/g) ?? [];
  const tokenCount = tokens.length;
  if (tokenCount === 0) {
    return {
      tokenCount: 0,
      uniqueCount: 0,
      ttr: 0,
      level: 'low',
      suggestion: '분석할 한글 단어가 없습니다.',
    };
  }
  const uniqueCount = new Set(tokens).size;
  const ttr = uniqueCount / tokenCount;
  let level: LexicalDiversityAnalysis['level'];
  let suggestion: string;
  if (tokenCount < 30) {
    level = 'medium';
    suggestion = '단어가 적어 분석이 제한적입니다.';
  } else if (ttr >= 0.6) {
    level = 'high';
    suggestion = '어휘가 풍부합니다.';
  } else if (ttr >= 0.4) {
    level = 'medium';
    suggestion = '반복 표현이 다소 있습니다. 동의어·유의어로 변주해 보세요.';
  } else {
    level = 'low';
    suggestion = '같은 단어가 자주 반복됩니다. 주요 명사·동사를 2~3 가지로 다양화하세요.';
  }
  return { tokenCount, uniqueCount, ttr: Math.round(ttr * 1000) / 1000, level, suggestion };
}

/**
 * 근접 반복어 검출 — 같은 2자 이상 한글 단어가 windowChars 내에서 재등장하면
 * 중언부언 후보로 리포트. 이력서에서 "~을 수행하여 ~수행했고 ~수행했다"같은 반복 감지.
 */
export interface RedundancyHit {
  word: string;
  firstIndex: number;
  secondIndex: number;
  distance: number;
}
export interface RedundancyAnalysis {
  hits: RedundancyHit[];
  worst: RedundancyHit | null;
  suggestion: string;
}

export function analyzeRedundancy(text: string, windowChars = 40): RedundancyAnalysis {
  const clean = (text ?? '').replace(/\s+/g, ' ');
  if (!clean) return { hits: [], worst: null, suggestion: '' };
  // 조사/어미로 주로 쓰이는 짧은 단어는 제외 대상 — 2자 이상만 캡처
  const re = /[가-힣]{2,}/g;
  const positions: Array<{ word: string; idx: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    positions.push({ word: m[0], idx: m.index });
  }
  const STOPWORDS = new Set([
    '그리고',
    '그래서',
    '또한',
    '하지만',
    '그러나',
    '있습',
    '없습',
    '있다',
    '없다',
    '입니',
    '합니',
    '됩니',
    '대한',
    '통해',
    '대해',
    '많은',
    '좋은',
    '다양',
    '여러',
  ]);
  const hits: RedundancyHit[] = [];
  const seenPair = new Set<string>();
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];
      const distance = b.idx - a.idx;
      if (distance > windowChars) break;
      if (a.word !== b.word) continue;
      if (STOPWORDS.has(a.word)) continue;
      const pairKey = `${a.idx}|${b.idx}|${a.word}`;
      if (seenPair.has(pairKey)) continue;
      seenPair.add(pairKey);
      hits.push({ word: a.word, firstIndex: a.idx, secondIndex: b.idx, distance });
    }
  }
  hits.sort((a, b) => a.distance - b.distance);
  const worst = hits[0] ?? null;
  let suggestion = '';
  if (!worst) suggestion = '근접 반복어가 발견되지 않았습니다.';
  else if (hits.length >= 5)
    suggestion = `"${worst.word}" 등 근접 반복어가 ${hits.length}건 감지되었습니다. 동의어로 변주하거나 문장을 줄여 보세요.`;
  else
    suggestion = `근접 반복어 ${hits.length}건 — 특히 "${worst.word}" (${worst.distance}자 간격) 를 확인해 보세요.`;
  return { hits: hits.slice(0, 20), worst, suggestion };
}

/**
 * 가독성 분석 — 평균 문장 길이, 평균 단어 길이, 문장 수 기반 단순 점수.
 * 이력서·자소서에 적정: 평균 35~60자, 단어 3자 이내.
 */
export interface ReadabilityAnalysis {
  sentenceCount: number;
  avgSentenceLength: number;
  maxSentenceLength: number;
  avgWordLength: number;
  readabilityScore: number; // 0~100, 높을수록 읽기 편함
  level: 'easy' | 'ok' | 'hard';
  suggestion: string;
}

export function analyzeReadability(text: string): ReadabilityAnalysis {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) {
    return {
      sentenceCount: 0,
      avgSentenceLength: 0,
      maxSentenceLength: 0,
      avgWordLength: 0,
      readabilityScore: 0,
      level: 'ok',
      suggestion: '분석할 본문이 없습니다.',
    };
  }
  const sentences = clean.split(/[.!?。]+/).filter((s) => s.trim().length > 0);
  const sentenceLens = sentences.map((s) => s.trim().length);
  const sentenceCount = sentenceLens.length || 1;
  const avgSentenceLength = Math.round(sentenceLens.reduce((a, b) => a + b, 0) / sentenceCount);
  const maxSentenceLength = sentenceLens.reduce((a, b) => (b > a ? b : a), 0);
  const words = clean.match(/[가-힣A-Za-z0-9]+/g) ?? [];
  const avgWordLength = words.length
    ? Math.round((words.reduce((a, w) => a + w.length, 0) / words.length) * 10) / 10
    : 0;
  // score: penalize very long sentences
  let score = 100;
  if (avgSentenceLength > 80) score -= 35;
  else if (avgSentenceLength > 60) score -= 20;
  else if (avgSentenceLength > 45) score -= 10;
  if (maxSentenceLength > 150) score -= 15;
  else if (maxSentenceLength > 100) score -= 8;
  if (avgWordLength > 4) score -= 10;
  score = Math.max(0, score);
  const level: ReadabilityAnalysis['level'] = score >= 75 ? 'easy' : score >= 55 ? 'ok' : 'hard';
  const suggestion =
    level === 'easy'
      ? '가독성이 좋습니다.'
      : level === 'ok'
        ? '문장 길이를 조금 더 짧게 다듬으면 더 읽기 편해집니다.'
        : '문장이 너무 깁니다. 한 문장당 한 가지 메시지를 유지하세요.';
  return {
    sentenceCount,
    avgSentenceLength,
    maxSentenceLength,
    avgWordLength,
    readabilityScore: score,
    level,
    suggestion,
  };
}

/**
 * 수치/정량 지표 분석 — 좋은 이력서는 숫자로 성과를 증명한다.
 * 퍼센트(%)·횟수·기간·금액·순위 등 수량 표현을 세어 정량화 레벨을 평가.
 */
export interface QuantificationAnalysis {
  total: number;
  percents: number; // N%
  numerics: number; // 일반 숫자 (10, 100, 1,000)
  periods: number; // N년/N개월/N주
  currencies: number; // 원/달러/만원/억
  rankings: number; // 1위, 상위 N%
  level: 'none' | 'low' | 'medium' | 'high';
  suggestion: string;
}

export function analyzeQuantification(text: string): QuantificationAnalysis {
  const t = text ?? '';
  const percents = (t.match(/\d+(?:\.\d+)?\s*%/g) ?? []).length;
  const periods = (t.match(/\d+\s*(년|개월|달|주|일간|시간)/g) ?? []).length;
  const currencies = (t.match(/\d[\d,]*\s*(원|만원|억원|억|천만|달러|\$)/g) ?? []).length;
  const rankings = (t.match(/(상위|TOP|톱|Top)\s*\d+|\d+위|1등/g) ?? []).length;
  // 일반 숫자 — 위에서 매칭된 것 제외하려 전체 count 에서 빼기 어려우니 간단히 전체 숫자 카운트
  const allNumbers = (t.match(/\d+/g) ?? []).length;
  const numerics = Math.max(0, allNumbers - percents - periods - currencies - rankings);
  const total = percents + numerics + periods + currencies + rankings;
  let level: QuantificationAnalysis['level'];
  if (total === 0) level = 'none';
  else if (total < 2) level = 'low';
  else if (total < 5) level = 'medium';
  else level = 'high';
  const suggestion =
    level === 'none'
      ? '수치 지표가 전혀 없습니다. "향상", "개선" 대신 "20% 향상", "3개월 단축" 같은 구체 수치로 표현하세요.'
      : level === 'low'
        ? '수치 지표가 부족합니다. 퍼센트·기간·횟수·금액 등으로 성과를 정량화하세요.'
        : level === 'medium'
          ? '수치 지표가 적정 수준입니다. 핵심 성과에 숫자를 더 넣어 차별화해 보세요.'
          : '정량적 성과 표현이 풍부합니다.';
  return { total, percents, numerics, periods, currencies, rankings, level, suggestion };
}

/**
 * 액션 동사 분석 — 이력서는 강한 동사(주도·구현·달성)로 시작하는 bullet이 효과적.
 * 한국어 이력서 맥락에서 '강한' 동사와 '약한' 동사 비율을 계산.
 */
export interface ActionVerbAnalysis {
  strong: number;
  weak: number;
  ratio: number; // strong / (strong + weak)
  level: 'low' | 'medium' | 'high';
  suggestion: string;
  topStrong: string[];
  topWeak: string[];
}

const STRONG_VERBS = [
  '주도',
  '설계',
  '구현',
  '개발',
  '달성',
  '개선',
  '최적화',
  '구축',
  '런칭',
  '출시',
  '리딩',
  '제안',
  '기획',
  '발굴',
  '창출',
  '성장',
  '확장',
  '배포',
  '분석',
  '도입',
  '정립',
  '혁신',
  '단축',
  '절감',
  '증가',
];
const WEAK_VERBS = [
  '담당',
  '참여',
  '수행',
  '도움',
  '함께',
  '협업했',
  '했습니다',
  '되었',
  '맡았',
  '배웠',
  '겪었',
];

export function analyzeActionVerbs(text: string): ActionVerbAnalysis {
  const t = text ?? '';
  const countStrong: Record<string, number> = {};
  const countWeak: Record<string, number> = {};
  for (const v of STRONG_VERBS) {
    const matches = t.match(new RegExp(v, 'g'));
    if (matches) countStrong[v] = matches.length;
  }
  for (const v of WEAK_VERBS) {
    const matches = t.match(new RegExp(v, 'g'));
    if (matches) countWeak[v] = matches.length;
  }
  const strong = Object.values(countStrong).reduce((a, b) => a + b, 0);
  const weak = Object.values(countWeak).reduce((a, b) => a + b, 0);
  const total = strong + weak;
  const ratio = total === 0 ? 0 : Math.round((strong / total) * 100) / 100;
  let level: ActionVerbAnalysis['level'];
  if (total < 3) level = 'medium';
  else if (ratio >= 0.7) level = 'high';
  else if (ratio >= 0.4) level = 'medium';
  else level = 'low';
  const suggestion =
    total < 3
      ? '동사 표현이 적어 분석이 제한적입니다. 경력 bullet 을 추가하세요.'
      : level === 'high'
        ? '강한 액션 동사 비율이 우수합니다.'
        : level === 'medium'
          ? '약한 동사("담당", "수행") 를 강한 동사("주도", "구현") 로 바꿔 보세요.'
          : '약한 동사가 너무 많습니다. 성과 중심으로 다시 써 주세요.';
  const topStrong = Object.entries(countStrong)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([v]) => v);
  const topWeak = Object.entries(countWeak)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([v]) => v);
  return { strong, weak, ratio, level, suggestion, topStrong, topWeak };
}

/**
 * 자소서·이력서에서 자주 쓰이는 진부한 표현 검출.
 * 남들과 구별되지 않는 상투구는 차별성을 떨어뜨림. 심사자가 지겹게 본 표현 모음.
 */
export interface ClicheHit {
  phrase: string;
  index: number;
  reason: string;
}
export interface ClicheAnalysis {
  hits: ClicheHit[];
  count: number;
  level: 'none' | 'few' | 'many';
  suggestion: string;
}

const CLICHES: Array<{ re: RegExp; phrase: string; reason: string }> = [
  {
    re: /노력하는 자세/g,
    phrase: '노력하는 자세',
    reason: '누구나 쓰는 상투구. 구체 행동으로 증명.',
  },
  {
    re: /성실하[게나다]/g,
    phrase: '성실하게/성실하다',
    reason: '추상 표현. 근거 사례로 보여주세요.',
  },
  { re: /최선을 다[해하]/g, phrase: '최선을 다해/다하', reason: '검증 불가. 수치·결과로 증명.' },
  { re: /열정[을이 ]/g, phrase: '열정', reason: '평가자가 지겹게 보는 단어. 구체 에피소드로.' },
  { re: /꿈꿔[왔오]/g, phrase: '꿈꿔왔', reason: '감성 어조. 비즈니스 문서엔 구체 계획을.' },
  {
    re: /귀사에 [지적]원/g,
    phrase: '귀사에 지원/적원',
    reason: '격식 과잉. "OO에 지원합니다" 간결히.',
  },
  {
    re: /입니[다.][^"]*저는/g,
    phrase: '…입니다 저는',
    reason: '"저는"으로 문장을 반복 시작하는 습관.',
  },
  { re: /있어서는 안 될/g, phrase: '있어서는 안 될', reason: '과장 표현. 더 구체적으로.' },
  { re: /남다른 [열정각오]/g, phrase: '남다른 열정/각오', reason: '누구나 "남다른". 사실로 증명.' },
  { re: /(?:커다란|큰) 보람/g, phrase: '커다란 보람', reason: '상투적 감정 표현. 실제 결과로.' },
  { re: /시너지 [효창]/g, phrase: '시너지 효과/창출', reason: '버즈워드. 구체 프로세스로.' },
  { re: /(?<![가-힣])창의적[인이다]/g, phrase: '창의적인', reason: '자기평가 단어. 예시 제공.' },
  { re: /체계적으로/g, phrase: '체계적으로', reason: '자기평가. 프로세스·도구 명시.' },
  { re: /적극적[인이으]/g, phrase: '적극적인', reason: '자기평가. 행동 사례로.' },
  { re: /열심히 [노공]/g, phrase: '열심히 노력/공부', reason: '검증 불가. 구체 활동으로.' },
  { re: /[다되]는 데 있어/g, phrase: '~함에 있어', reason: '번역체. 불필요한 격식.' },
  { re: /함에 있어/g, phrase: '함에 있어', reason: '일본어 번역투. "~할 때" 로.' },
  { re: /~에 대한 책임감/g, phrase: '~에 대한 책임감', reason: '추상 표현. 책임진 구체 업무로.' },
  {
    re: /서로 도와[가주]/g,
    phrase: '서로 도와가며/주며',
    reason: '협업 상투구. 역할 분담 구체화.',
  },
  {
    re: /(?<![가-힣])성과를 [창내]/g,
    phrase: '성과를 창출/냈',
    reason: '추상 동사. 수치 포함한 성과.',
  },
];

export function detectCliches(text: string): ClicheAnalysis {
  const t = text ?? '';
  const hits: ClicheHit[] = [];
  for (const c of CLICHES) {
    let m: RegExpExecArray | null;
    const re = new RegExp(c.re.source, 'g');
    while ((m = re.exec(t))) {
      hits.push({ phrase: c.phrase, index: m.index, reason: c.reason });
    }
  }
  hits.sort((a, b) => a.index - b.index);
  const count = hits.length;
  let level: ClicheAnalysis['level'];
  let suggestion: string;
  if (count === 0) {
    level = 'none';
    suggestion = '상투적 표현이 없습니다.';
  } else if (count <= 2) {
    level = 'few';
    suggestion = `상투적 표현 ${count}건 — 구체 에피소드나 수치로 바꿔 보세요.`;
  } else {
    level = 'many';
    suggestion = `상투적 표현이 ${count}건으로 많습니다. 심사자 눈에 익은 관용구 대신 고유한 경험을 드러내세요.`;
  }
  return { hits: hits.slice(0, 30), count, level, suggestion };
}

/**
 * 문장 시작 반복 — "저는/제가" 등 같은 단어로 시작하는 문장이 연속되면 단조로움.
 * 이력서·자소서에서 특히 자주 발생. 상위 3개 시작 단어 빈도 반환.
 */
export interface SentenceStartAnalysis {
  totalSentences: number;
  topStarts: Array<{ word: string; count: number; percent: number }>;
  repeatedStartRatio: number; // 0~1, 1 이면 모두 같은 단어로 시작
  suggestion: string;
}

export function analyzeSentenceStarts(text: string): SentenceStartAnalysis {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return { totalSentences: 0, topStarts: [], repeatedStartRatio: 0, suggestion: '' };
  const sentences = clean.split(/[.!?。]+/).filter((s) => s.trim().length > 0);
  const counts = new Map<string, number>();
  for (const s of sentences) {
    const trimmed = s.trim();
    const firstWord = trimmed.match(/^[가-힣A-Za-z]+/)?.[0];
    if (!firstWord) continue;
    counts.set(firstWord, (counts.get(firstWord) ?? 0) + 1);
  }
  const total = sentences.length;
  const entries = [...counts.entries()]
    .map(([word, count]) => ({ word, count, percent: total ? (count * 100) / total : 0 }))
    .sort((a, b) => b.count - a.count);
  const topStarts = entries.slice(0, 3);
  const repeatedStartRatio = topStarts[0] ? topStarts[0].count / total : 0;
  let suggestion = '';
  if (total < 5) suggestion = '분석을 위한 문장이 부족합니다.';
  else if (repeatedStartRatio > 0.4)
    suggestion = `문장의 ${Math.round(repeatedStartRatio * 100)}% 가 "${topStarts[0].word}" 로 시작합니다. 시작을 변주하세요.`;
  else if (repeatedStartRatio > 0.25)
    suggestion = `"${topStarts[0].word}" 로 시작하는 문장이 ${topStarts[0].count}개입니다. 일부를 재구성해 보세요.`;
  else suggestion = '문장 시작이 자연스럽게 분산되어 있습니다.';
  return {
    totalSentences: total,
    topStarts,
    repeatedStartRatio: Math.round(repeatedStartRatio * 1000) / 1000,
    suggestion,
  };
}

/**
 * 수동태 남용 검출 — 이력서는 능동태 "~했다/했습니다" 가 원칙. 수동태("되었다/이루어졌다")
 * 가 많으면 주체성이 흐려지고 성과 주인이 불분명해짐.
 */
export interface PassiveVoiceAnalysis {
  passiveCount: number;
  activeCount: number;
  ratio: number; // passive / (passive + active), 낮을수록 좋음
  level: 'low' | 'medium' | 'high';
  examples: Array<{ phrase: string; index: number }>;
  suggestion: string;
}

const PASSIVE_PATTERNS: RegExp[] = [
  /이루어지(?:었|게 되)/g,
  /되어지(?:었|게 되)/g,
  /되어졌/g,
  /지어지(?:었|게 되)/g,
  /(?<![가-힣])되었(?:다|습니다|으며)/g,
  /(?<![가-힣])시켜지/g,
  /만들어지(?:었|게 되)/g,
];
const ACTIVE_PATTERNS: RegExp[] = [
  /(?:했|주도했|구현했|달성했|개선했|만들었|진행했|완료했|배포했|설계했)(?:다|습니다|으며)/g,
];

export function analyzePassiveVoice(text: string): PassiveVoiceAnalysis {
  const t = text ?? '';
  const examples: PassiveVoiceAnalysis['examples'] = [];
  let passiveCount = 0;
  for (const re of PASSIVE_PATTERNS) {
    const src = new RegExp(re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = src.exec(t))) {
      passiveCount++;
      if (examples.length < 10) examples.push({ phrase: m[0], index: m.index });
    }
  }
  let activeCount = 0;
  for (const re of ACTIVE_PATTERNS) {
    const src = new RegExp(re.source, 'g');
    activeCount += (t.match(src) ?? []).length;
  }
  const total = passiveCount + activeCount;
  const ratio = total === 0 ? 0 : Math.round((passiveCount / total) * 100) / 100;
  let level: PassiveVoiceAnalysis['level'];
  if (total < 3) level = 'medium';
  else if (ratio >= 0.35) level = 'high';
  else if (ratio >= 0.15) level = 'medium';
  else level = 'low';
  const suggestion =
    total < 3
      ? '분석을 위한 용언이 부족합니다.'
      : level === 'low'
        ? '능동태 비율이 우수합니다.'
        : level === 'medium'
          ? `수동태 ${passiveCount}건 — 일부는 능동태로 전환해 주체를 드러내세요.`
          : `수동태 비율이 ${Math.round(ratio * 100)}% 로 높습니다. "되었다" → "했다/주도했다" 처럼 능동형으로 바꾸세요.`;
  return { passiveCount, activeCount, ratio, level, examples: examples.slice(0, 5), suggestion };
}

/**
 * bullet 평행구조 — 줄 단위 목록에서 종결어미가 섞이면 (습니다/했음/-ㅁ/다.) 인상이 떨어짐.
 * 줄바꿈 · "- " · "• " 시작 줄을 추출해 어미 분포를 계산.
 */
export interface ParallelismAnalysis {
  lines: number;
  styles: Array<{ style: string; count: number; percent: number }>;
  consistency: number; // 0~100, 주류 어미 비율 × 100
  suggestion: string;
}

export function analyzeParallelism(text: string): ParallelismAnalysis {
  const t = text ?? '';
  const candidates = t
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-·•*\s\d.)]+/, '').trim())
    .filter((l) => l.length >= 5);
  const counts = new Map<string, number>();
  const classifiers: Array<{ label: string; re: RegExp }> = [
    { label: '합니다체', re: /(했|합|입|됩|있|없)습니다[.!?]?\s*$/ },
    { label: '다./했다', re: /[가-힣]다[.!?]?\s*$/ },
    { label: '-함/-했음', re: /(함|했음|됨|임|있음|없음)[.!?]?\s*$/ },
    { label: '-기', re: /기[.!?]?\s*$/ },
    { label: '해요체', re: /해요[.!?]?\s*$/ },
  ];
  for (const line of candidates) {
    let matched = false;
    for (const c of classifiers) {
      if (c.re.test(line)) {
        counts.set(c.label, (counts.get(c.label) ?? 0) + 1);
        matched = true;
        break;
      }
    }
    if (!matched) counts.set('기타', (counts.get('기타') ?? 0) + 1);
  }
  const total = candidates.length || 1;
  const styles = [...counts.entries()]
    .map(([style, count]) => ({ style, count, percent: (count * 100) / total }))
    .sort((a, b) => b.count - a.count);
  const top = styles[0];
  const consistency = top ? Math.round(top.percent) : 0;
  let suggestion = '';
  if (candidates.length < 3) suggestion = '목록 항목이 부족해 분석이 제한적입니다.';
  else if (consistency >= 85) suggestion = `목록 어미가 "${top.style}" 로 일관됩니다.`;
  else if (consistency >= 65)
    suggestion = `주로 "${top.style}" 이지만 다른 어미가 섞여 있습니다. 통일을 권장합니다.`;
  else
    suggestion = `어미가 ${styles.length} 가지로 뒤섞여 있습니다. 하나로 통일하세요 (예: 모두 "-했음" 또는 모두 "합니다").`;
  return { lines: candidates.length, styles: styles.slice(0, 5), consistency, suggestion };
}

/**
 * 길이 분석 — 자소서·입사지원서는 보통 500~2000 자 범위 제한.
 * 입력이 target 범위를 벗어나면 경고. 공백 포함/제외 2가지 기준 모두 제공.
 */
export interface LengthAnalysis {
  charsWithSpaces: number;
  charsWithoutSpaces: number;
  words: number;
  paragraphs: number;
  target?: { min?: number; max?: number };
  status: 'under' | 'ok' | 'over' | 'no-target';
  suggestion: string;
}

export function analyzeLength(
  text: string,
  target?: { min?: number; max?: number },
): LengthAnalysis {
  const t = text ?? '';
  const charsWithSpaces = t.length;
  const charsWithoutSpaces = t.replace(/\s+/g, '').length;
  const words = (t.match(/[가-힣A-Za-z0-9]+/g) ?? []).length;
  const paragraphs = t
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;
  let status: LengthAnalysis['status'] = 'no-target';
  let suggestion = '';
  const effective = charsWithSpaces;
  if (target) {
    if (target.min !== undefined && effective < target.min) {
      status = 'under';
      suggestion = `목표 최소치 ${target.min}자 대비 ${target.min - effective}자 부족합니다.`;
    } else if (target.max !== undefined && effective > target.max) {
      status = 'over';
      suggestion = `목표 최대치 ${target.max}자를 ${effective - target.max}자 초과했습니다.`;
    } else {
      status = 'ok';
      suggestion = `목표 범위 내 (${effective}자).`;
    }
  } else {
    suggestion = `현재 ${effective}자 (공백 제외 ${charsWithoutSpaces}자, ${words}단어, ${paragraphs}문단).`;
  }
  return { charsWithSpaces, charsWithoutSpaces, words, paragraphs, target, status, suggestion };
}

/**
 * 핵심 키워드 추출 — 한글 2자↑ 명사·전문용어를 빈도 기반 상위 N 개 반환.
 * 조사/접속사/불용어 제거. 태그 클라우드·이력서 키워드 배지에 활용.
 */
export interface ExtractedKeyword {
  word: string;
  count: number;
  weight: number; // TF 상대 가중치 (0~1)
}

const KEYWORD_STOPWORDS = new Set([
  '그리고',
  '그래서',
  '하지만',
  '그러나',
  '따라서',
  '하여',
  '있습',
  '없습',
  '있어',
  '없어',
  '입니',
  '합니',
  '됩니',
  '것과',
  '것을',
  '것이',
  '것은',
  '대한',
  '위해',
  '통해',
  '대해',
  '하지',
  '에서',
  '으로',
  '에게',
  '까지',
  '부터',
  '보다',
  '처럼',
  '마저',
  '역시',
  '또한',
  '많은',
  '다양',
  '여러',
  '모든',
  '저는',
  '제가',
  '우리',
  '사람',
  '경우',
  '때문',
  '정도',
  '이상',
  '이하',
  '관련',
]);

export function extractKeywords(text: string, topN = 15): ExtractedKeyword[] {
  const t = (text ?? '').replace(/\s+/g, ' ');
  if (!t.trim()) return [];
  // 한글 2자 이상 + 영문 3자 이상 단어 수집
  const tokens = t.match(/[가-힣]{2,}|[A-Za-z][A-Za-z0-9+#.-]{2,}/g)?.map((s) => s.trim()) ?? [];
  const freq = new Map<string, number>();
  for (const tk of tokens) {
    const lower = /[A-Za-z]/.test(tk) ? tk : tk; // 한글은 casing 없음
    if (KEYWORD_STOPWORDS.has(lower)) continue;
    // 조사 제거 heuristic: 3글자 이상 한글 단어 끝 1글자 '을/를/이/가/은/는/의/에/로/와/과'
    let normalized = lower;
    if (/[가-힣]{3,}/.test(normalized)) {
      normalized = normalized.replace(/[을를이가은는의에서로와과및]$/, '') || normalized;
    }
    if (normalized.length < 2) continue;
    if (KEYWORD_STOPWORDS.has(normalized)) continue;
    freq.set(normalized, (freq.get(normalized) ?? 0) + 1);
  }
  const entries = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] ?? 1;
  return entries
    .slice(0, topN)
    .map(([word, count]) => ({ word, count, weight: Math.round((count / max) * 100) / 100 }));
}

/**
 * 약한 동사 → 강한 대안 매핑. 이력서 bullet 리라이트 힌트.
 */
const WEAK_TO_STRONG: Record<string, string[]> = {
  담당: ['주도', '책임', '총괄'],
  참여: ['기여', '제안', '실행'],
  수행: ['구현', '완수', '실행'],
  도움: ['지원', '서포트', '협력'],
  했습니다: ['구축했습니다', '구현했습니다', '달성했습니다'],
  맡았: ['주도했', '총괄했', '책임졌'],
  배웠: ['습득했', '체득했', '내재화했'],
  겪었: ['경험했', '돌파했', '학습했'],
  진행: ['주도', '기획·실행', '추진'],
  노력: ['실행', '달성', '추진'],
};

export interface VerbReplacementSuggestion {
  weak: string;
  index: number;
  alternatives: string[];
}

export function suggestVerbReplacements(text: string): VerbReplacementSuggestion[] {
  const t = text ?? '';
  const results: VerbReplacementSuggestion[] = [];
  for (const [weak, alts] of Object.entries(WEAK_TO_STRONG)) {
    const re = new RegExp(weak, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      results.push({ weak, index: m.index, alternatives: alts });
    }
  }
  results.sort((a, b) => a.index - b.index);
  return results.slice(0, 40);
}

/**
 * N-gram 반복 구절 검출 — 2~3단어 구절이 2회 이상 반복되면 리포트.
 * analyzeRedundancy(단일 단어) 와 상보 — 다단어 상투적 표현 발견 시 주목할 만한 신호.
 */
export interface RepeatedPhrase {
  phrase: string;
  count: number;
  n: 2 | 3;
}

export function detectRepeatedPhrases(text: string, minCount = 2): RepeatedPhrase[] {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return [];
  // 한글 어절·영문 토큰 시퀀스 추출
  const tokens = t.match(/[가-힣A-Za-z0-9]+/g) ?? [];
  if (tokens.length < 4) return [];
  const counts = new Map<string, { count: number; n: 2 | 3 }>();
  for (const n of [2, 3] as const) {
    for (let i = 0; i + n <= tokens.length; i++) {
      const slice = tokens.slice(i, i + n);
      // 너무 짧은 조각 제외 (단어 1글자만 연속)
      if (slice.some((s) => s.length < 2)) continue;
      const key = slice.join(' ');
      const prev = counts.get(key);
      counts.set(key, { count: (prev?.count ?? 0) + 1, n });
    }
  }
  const hits: RepeatedPhrase[] = [];
  for (const [phrase, { count, n }] of counts.entries()) {
    if (count >= minCount) hits.push({ phrase, count, n });
  }
  // 긴 구절 우선, 빈도 높은 순
  hits.sort((a, b) => (b.n - a.n) * 10 + (b.count - a.count));
  // 짧은 구절이 더 긴 구절에 포함되어 있으면 제거 (예: "나는 학교" vs "나는 학교 갔" 있으면 후자만 유지)
  const filtered: RepeatedPhrase[] = [];
  for (const h of hits) {
    const swallowed = filtered.some((f) => f.n > h.n && f.phrase.includes(h.phrase));
    if (!swallowed) filtered.push(h);
  }
  return filtered.slice(0, 15);
}

/**
 * 이력서·자소서 ↔ 채용공고(JD) 키워드 매칭 점수.
 * 양쪽에서 상위 키워드를 추출해 중복·누락·고유 키워드를 분류. 0~100 match %.
 */
export interface JDMatchResult {
  score: number;
  matched: string[];
  missing: string[]; // JD 에만 있는 키워드
  onlyInResume: string[]; // 이력서에만 있는 키워드
  suggestion: string;
}

export function computeJDMatch(resumeText: string, jdText: string, topN = 30): JDMatchResult {
  if (!resumeText || !jdText) {
    return {
      score: 0,
      matched: [],
      missing: [],
      onlyInResume: [],
      suggestion: '이력서 또는 공고 본문이 비어 있습니다.',
    };
  }
  const resumeKw = new Set(extractKeywords(resumeText, topN * 2).map((k) => k.word));
  const jdKws = extractKeywords(jdText, topN);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const kw of jdKws) {
    if (resumeKw.has(kw.word)) matched.push(kw.word);
    else missing.push(kw.word);
  }
  const onlyInResume = [...resumeKw].filter((w) => !jdKws.some((j) => j.word === w)).slice(0, 10);
  const score = jdKws.length > 0 ? Math.round((matched.length / jdKws.length) * 100) : 0;
  let suggestion = '';
  if (jdKws.length < 3) suggestion = '공고 본문이 너무 짧아 분석이 제한적입니다.';
  else if (score >= 75) suggestion = '공고 키워드 적합도가 우수합니다.';
  else if (score >= 50)
    suggestion = `적합도 ${score}% — 공고의 "${missing.slice(0, 3).join(', ')}" 키워드를 이력서에 추가 반영해 보세요.`;
  else
    suggestion = `적합도가 ${score}% 로 낮습니다. 공고 핵심 키워드를 이력서 문장에 녹여 내세요: ${missing.slice(0, 5).join(', ')}`;
  return { score, matched, missing: missing.slice(0, 15), onlyInResume, suggestion };
}

/**
 * 비격식 표현 검출 — 이모티콘, 초성체(ㅎㅎㅋㅋㅠ), 줄임말(존맛/갑분싸/JMT), 구어체
 * 인삿말('안녕하세요!') 과잉 등을 포착. 공식 문서(이력서·자소서)에 부적합한 표현 신호.
 */
export interface InformalHit {
  category: 'emoticon' | 'chosung' | 'slang' | 'casual' | 'exclaim';
  phrase: string;
  index: number;
  reason: string;
}
export interface InformalAnalysis {
  hits: InformalHit[];
  count: number;
  level: 'none' | 'few' | 'many';
  suggestion: string;
}

const INFORMAL_PATTERNS: Array<{ re: RegExp; category: InformalHit['category']; reason: string }> =
  [
    {
      re: /[😀-🙏🌀-🗿🚀-🛿🤀-🧿]/gu,
      category: 'emoticon',
      reason: '이모지(이모티콘)는 공식 문서에 부적합합니다.',
    },
    {
      re: /[ㅋㅎㅠㅜㅗㅎ]{2,}/g,
      category: 'chosung',
      reason: '초성체(ㅋㅋ/ㅎㅎ/ㅠㅠ)는 비격식 표현입니다.',
    },
    {
      re: /(?<![가-힣])ㄱㅅ(?![가-힣])/g,
      category: 'chosung',
      reason: '"감사"는 줄이지 않고 전체로 표기.',
    },
    {
      re: /(?<![가-힣])존맛|JMT|존좋|개좋/g,
      category: 'slang',
      reason: '은어·속어는 공식 문서에 부적합.',
    },
    {
      re: /(?<![가-힣])갑분싸|ㅇㅋ|오키|ㄴㄴ/g,
      category: 'slang',
      reason: '줄임·유행어는 제거하세요.',
    },
    {
      re: /(?<![가-힣])인싸|아싸|스펙|꿀|개이득/g,
      category: 'slang',
      reason: '구어체 속어는 공식 문서에 부적합.',
    },
    {
      re: /(?<![가-힣])근데(?![가-힣])/g,
      category: 'casual',
      reason: '"근데" 대신 "그런데"를 쓰세요.',
    },
    {
      re: /(?<![가-힣])했던거(?![가-힣])/g,
      category: 'casual',
      reason: '"했던 것"처럼 띄어 쓰고 구체화.',
    },
    { re: /!{2,}|\?{2,}/g, category: 'exclaim', reason: '느낌표·물음표 반복은 비공식 느낌.' },
    {
      re: /(?<![가-힣])뭔가|되게|엄청|너무너무/g,
      category: 'casual',
      reason: '구어체 강조어. 객관적 표현으로.',
    },
  ];

export function detectInformalLanguage(text: string): InformalAnalysis {
  const t = text ?? '';
  const hits: InformalHit[] = [];
  for (const p of INFORMAL_PATTERNS) {
    const re = new RegExp(p.re.source, p.re.flags.includes('g') ? p.re.flags : p.re.flags + 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      hits.push({ category: p.category, phrase: m[0], index: m.index, reason: p.reason });
      if (hits.length > 50) break;
    }
    if (hits.length > 50) break;
  }
  hits.sort((a, b) => a.index - b.index);
  const count = hits.length;
  let level: InformalAnalysis['level'];
  let suggestion: string;
  if (count === 0) {
    level = 'none';
    suggestion = '비격식 표현이 없습니다.';
  } else if (count <= 2) {
    level = 'few';
    suggestion = `비격식 표현 ${count}건 — "${hits[0].phrase}" 등을 공식 표현으로 교체하세요.`;
  } else {
    level = 'many';
    suggestion = `비격식 표현이 ${count}건으로 많습니다. 공식 문서 톤으로 전면 재작성을 권장합니다.`;
  }
  return { hits: hits.slice(0, 30), count, level, suggestion };
}

/**
 * 모든 분석기를 합쳐 한 번에 호출하는 통합 리포트.
 * 실사용 컴포넌트에서 여러 함수 호출 대신 한 번의 호출로 품질 스코어·지표 전부 가져올 수 있음.
 */
export interface KoreanQualityReport {
  check: KoreanCheckResult;
  endings: SentenceEndingAnalysis;
  lexical: LexicalDiversityAnalysis;
  redundancy: RedundancyAnalysis;
  readability: ReadabilityAnalysis;
  quantification: QuantificationAnalysis;
  actionVerbs: ActionVerbAnalysis;
  cliches: ClicheAnalysis;
  sentenceStarts: SentenceStartAnalysis;
  passive: PassiveVoiceAnalysis;
  parallelism: ParallelismAnalysis;
  informal: InformalAnalysis;
  /** 0~100 가중치 평균 — UI 배지에 바로 사용 가능 */
  overallScore: number;
}

export function generateQualityReport(text: string, sectionName = '본문'): KoreanQualityReport {
  const check = checkText(text, sectionName);
  const endings = analyzeSentenceEndings(text);
  const lexical = analyzeLexicalDiversity(text);
  const redundancy = analyzeRedundancy(text);
  const readability = analyzeReadability(text);
  const quantification = analyzeQuantification(text);
  const actionVerbs = analyzeActionVerbs(text);
  const cliches = detectCliches(text);
  const sentenceStarts = analyzeSentenceStarts(text);
  const passive = analyzePassiveVoice(text);
  const parallelism = analyzeParallelism(text);
  const informal = detectInformalLanguage(text);
  // 가중 평균: 맞춤법 22 + 가독성 13 + 어휘 7 + 어미 7 + 반복 7
  //           + 정량 7 + 동사 7 + 상투구 5 + 시작 5 + 수동 7 + 평행 5 + 비격식 8 = 100
  const ttrScore = Math.round(lexical.ttr * 100);
  const monotonyScore = 100 - endings.monotonyScore;
  const redundancyScore = Math.max(0, 100 - redundancy.hits.length * 10);
  const quantScore =
    quantification.level === 'high'
      ? 100
      : quantification.level === 'medium'
        ? 70
        : quantification.level === 'low'
          ? 40
          : 10;
  const verbScore = actionVerbs.strong + actionVerbs.weak < 3 ? 60 : actionVerbs.ratio * 100;
  const clicheScore = Math.max(0, 100 - cliches.count * 12);
  const startScore = Math.max(0, 100 - Math.round(sentenceStarts.repeatedStartRatio * 100));
  const passiveScore = passive.level === 'low' ? 100 : passive.level === 'medium' ? 70 : 35;
  const parallelismScore = parallelism.consistency;
  const informalScore = Math.max(0, 100 - informal.count * 15);
  const overallScore = Math.round(
    check.score * 0.22 +
      readability.readabilityScore * 0.13 +
      ttrScore * 0.07 +
      monotonyScore * 0.07 +
      redundancyScore * 0.07 +
      quantScore * 0.07 +
      verbScore * 0.07 +
      clicheScore * 0.05 +
      startScore * 0.05 +
      passiveScore * 0.07 +
      parallelismScore * 0.05 +
      informalScore * 0.08,
  );
  return {
    check,
    endings,
    lexical,
    redundancy,
    readability,
    quantification,
    actionVerbs,
    cliches,
    sentenceStarts,
    passive,
    parallelism,
    informal,
    overallScore,
  };
}

/**
 * 품질 리포트를 Markdown 형식 문자열로 내보내기 (공유·PDF 용).
 * 팀원·멘토에게 피드백 요청 시 바로 붙여 넣을 수 있는 요약본.
 */
export function exportQualityReportMarkdown(text: string, sectionName = '본문'): string {
  const r = generateQualityReport(text, sectionName);
  const lines: string[] = [];
  lines.push(`# ${sectionName} 한국어 품질 리포트`);
  lines.push('');
  lines.push(`**종합 점수**: ${r.overallScore}점 / 100`);
  lines.push('');
  lines.push('## 지표 상세');
  lines.push('');
  lines.push(
    `- **맞춤법 점수**: ${r.check.score}점 (오류 ${r.check.summary.error}, 경고 ${r.check.summary.warning}, 제안 ${r.check.summary.info})`,
  );
  lines.push(
    `- **가독성 점수**: ${r.readability.readabilityScore}점 (${r.readability.level}, 평균 ${r.readability.avgSentenceLength}자/문장)`,
  );
  lines.push(
    `- **어휘 다양성**: ${Math.round(r.lexical.ttr * 100)}% (${r.lexical.uniqueCount}/${r.lexical.tokenCount}, ${r.lexical.level})`,
  );
  lines.push(
    `- **종결어미 변주**: ${100 - r.endings.monotonyScore}점 (상위 ${r.endings.dominantEndings[0]?.ending ?? '-'} ${r.endings.dominantEndings[0]?.percent?.toFixed(0) ?? 0}%)`,
  );
  lines.push(
    `- **근접 반복어**: ${r.redundancy.hits.length}건${r.redundancy.worst ? ` (worst: "${r.redundancy.worst.word}" ${r.redundancy.worst.distance}자 간격)` : ''}`,
  );
  lines.push(
    `- **정량 지표**: ${r.quantification.total}건 (${r.quantification.level}) — %${r.quantification.percents}, 기간${r.quantification.periods}, 금액${r.quantification.currencies}`,
  );
  lines.push(
    `- **액션 동사**: 강 ${r.actionVerbs.strong} / 약 ${r.actionVerbs.weak} (비율 ${Math.round(r.actionVerbs.ratio * 100)}%, ${r.actionVerbs.level})`,
  );
  lines.push(`- **상투적 표현**: ${r.cliches.count}건 (${r.cliches.level})`);
  lines.push(
    `- **문장 시작 반복**: 상위 "${r.sentenceStarts.topStarts[0]?.word ?? '-'}" ${r.sentenceStarts.topStarts[0]?.count ?? 0}회 (${Math.round(r.sentenceStarts.repeatedStartRatio * 100)}%)`,
  );
  lines.push(
    `- **수동태 비율**: ${Math.round(r.passive.ratio * 100)}% (수동 ${r.passive.passiveCount} / 능동 ${r.passive.activeCount}, ${r.passive.level})`,
  );
  lines.push(
    `- **bullet 평행구조**: ${r.parallelism.consistency}% 일관 (${r.parallelism.lines}줄 분석, 주류 "${r.parallelism.styles[0]?.style ?? '-'}")`,
  );
  lines.push(`- **비격식 표현**: ${r.informal.count}건 (${r.informal.level})`);
  lines.push('');
  if (r.actionVerbs.topStrong.length) {
    lines.push(`**강한 동사 상위**: ${r.actionVerbs.topStrong.join(', ')}`);
  }
  if (r.actionVerbs.topWeak.length) {
    lines.push(`**약한 동사 상위**: ${r.actionVerbs.topWeak.join(', ')}`);
  }
  lines.push('');
  lines.push('## 개선 제안');
  lines.push('');
  const tips: string[] = [];
  if (r.readability.suggestion) tips.push(`- ${r.readability.suggestion}`);
  if (r.lexical.suggestion) tips.push(`- ${r.lexical.suggestion}`);
  if (r.endings.suggestion) tips.push(`- ${r.endings.suggestion}`);
  if (r.redundancy.suggestion) tips.push(`- ${r.redundancy.suggestion}`);
  if (r.quantification.suggestion) tips.push(`- ${r.quantification.suggestion}`);
  if (r.cliches.suggestion) tips.push(`- ${r.cliches.suggestion}`);
  if (r.sentenceStarts.suggestion) tips.push(`- ${r.sentenceStarts.suggestion}`);
  if (r.passive.suggestion) tips.push(`- ${r.passive.suggestion}`);
  if (r.parallelism.suggestion) tips.push(`- ${r.parallelism.suggestion}`);
  if (r.informal.suggestion) tips.push(`- ${r.informal.suggestion}`);
  if (r.actionVerbs.suggestion) tips.push(`- ${r.actionVerbs.suggestion}`);
  lines.push(tips.length ? tips.join('\n') : '- 개선 포인트가 없습니다. 훌륭합니다!');
  return lines.join('\n');
}

/**
 * 품질 리포트를 구조화된 JSON 문자열로 내보내기.
 * API·LLM 컨텍스트·DB 저장용 — 타입 안정성 유지 + 히트 위치까지 직렬화.
 */
export function exportQualityReportJson(text: string, sectionName = '본문'): string {
  const r = generateQualityReport(text, sectionName);
  return JSON.stringify(
    { section: sectionName, generatedAt: new Date().toISOString(), report: r },
    null,
    2,
  );
}

/**
 * 품질 리포트에서 가장 효용이 높은 개선 작업 Top-K 를 우선순위로 반환.
 * 각 analyzer 의 sub-score 손실 × 가중치 = impact. 사용자가 가장 빨리 점수를 올릴 수 있는 액션 안내.
 */
export interface PrioritizedAction {
  dimension: string;
  impact: number; // 전체 overallScore 에서 이 차원이 끌어내린 점수 (0~가중치*100/100)
  currentScore: number; // 0~100
  targetSuggestion: string;
}

export function prioritizeImprovements(report: KoreanQualityReport, topK = 3): PrioritizedAction[] {
  const dimensions: Array<{
    dimension: string;
    weight: number;
    score: number;
    suggestion: string;
  }> = [
    {
      dimension: '맞춤법',
      weight: 0.22,
      score: report.check.score,
      suggestion: '맞춤법·띄어쓰기 오류를 먼저 고치세요.',
    },
    {
      dimension: '가독성',
      weight: 0.13,
      score: report.readability.readabilityScore,
      suggestion: report.readability.suggestion,
    },
    {
      dimension: '어휘 다양성',
      weight: 0.07,
      score: Math.round(report.lexical.ttr * 100),
      suggestion: report.lexical.suggestion,
    },
    {
      dimension: '어미 변주',
      weight: 0.07,
      score: 100 - report.endings.monotonyScore,
      suggestion: report.endings.suggestion,
    },
    {
      dimension: '반복어',
      weight: 0.07,
      score: Math.max(0, 100 - report.redundancy.hits.length * 10),
      suggestion: report.redundancy.suggestion,
    },
    {
      dimension: '정량 지표',
      weight: 0.07,
      score:
        report.quantification.level === 'high'
          ? 100
          : report.quantification.level === 'medium'
            ? 70
            : report.quantification.level === 'low'
              ? 40
              : 10,
      suggestion: report.quantification.suggestion,
    },
    {
      dimension: '액션 동사',
      weight: 0.07,
      score:
        report.actionVerbs.strong + report.actionVerbs.weak < 3
          ? 60
          : Math.round(report.actionVerbs.ratio * 100),
      suggestion: report.actionVerbs.suggestion,
    },
    {
      dimension: '상투구',
      weight: 0.05,
      score: Math.max(0, 100 - report.cliches.count * 12),
      suggestion: report.cliches.suggestion,
    },
    {
      dimension: '문장 시작 변주',
      weight: 0.05,
      score: Math.max(0, 100 - Math.round(report.sentenceStarts.repeatedStartRatio * 100)),
      suggestion: report.sentenceStarts.suggestion,
    },
    {
      dimension: '수동태',
      weight: 0.07,
      score: report.passive.level === 'low' ? 100 : report.passive.level === 'medium' ? 70 : 35,
      suggestion: report.passive.suggestion,
    },
    {
      dimension: '평행구조',
      weight: 0.05,
      score: report.parallelism.consistency,
      suggestion: report.parallelism.suggestion,
    },
    {
      dimension: '비격식',
      weight: 0.08,
      score: Math.max(0, 100 - report.informal.count * 15),
      suggestion: report.informal.suggestion,
    },
  ];
  const ranked = dimensions
    .map((d) => ({
      dimension: d.dimension,
      impact: Math.round((100 - d.score) * d.weight),
      currentScore: d.score,
      targetSuggestion: d.suggestion || '',
    }))
    .filter((d) => d.impact > 0 && d.targetSuggestion)
    .sort((a, b) => b.impact - a.impact);
  return ranked.slice(0, topK);
}

/**
 * 두 QualityReport 간 차원별 점수 변화를 비교 — "자동수정 전후" / "초안 v1 vs v2"
 * 같은 before/after 흐름에서 무엇이 개선·퇴행했는지 시각화에 사용.
 */
export interface ReportDelta {
  dimension: string;
  before: number;
  after: number;
  diff: number; // after - before
}
export interface ReportComparison {
  overallBefore: number;
  overallAfter: number;
  overallDiff: number;
  dimensions: ReportDelta[];
  topImprovements: ReportDelta[]; // diff > 0 내림차순
  topRegressions: ReportDelta[]; // diff < 0 오름차순 (더 큰 하락 먼저)
  summary: string;
}

function scoreOf(r: KoreanQualityReport): Array<{ dimension: string; score: number }> {
  return [
    { dimension: '맞춤법', score: r.check.score },
    { dimension: '가독성', score: r.readability.readabilityScore },
    { dimension: '어휘 다양성', score: Math.round(r.lexical.ttr * 100) },
    { dimension: '어미 변주', score: 100 - r.endings.monotonyScore },
    { dimension: '반복어', score: Math.max(0, 100 - r.redundancy.hits.length * 10) },
    {
      dimension: '정량 지표',
      score:
        r.quantification.level === 'high'
          ? 100
          : r.quantification.level === 'medium'
            ? 70
            : r.quantification.level === 'low'
              ? 40
              : 10,
    },
    {
      dimension: '액션 동사',
      score:
        r.actionVerbs.strong + r.actionVerbs.weak < 3 ? 60 : Math.round(r.actionVerbs.ratio * 100),
    },
    { dimension: '상투구', score: Math.max(0, 100 - r.cliches.count * 12) },
    {
      dimension: '문장 시작 변주',
      score: Math.max(0, 100 - Math.round(r.sentenceStarts.repeatedStartRatio * 100)),
    },
    {
      dimension: '수동태',
      score: r.passive.level === 'low' ? 100 : r.passive.level === 'medium' ? 70 : 35,
    },
    { dimension: '평행구조', score: r.parallelism.consistency },
    { dimension: '비격식', score: Math.max(0, 100 - r.informal.count * 15) },
  ];
}

export function compareReports(
  before: KoreanQualityReport,
  after: KoreanQualityReport,
): ReportComparison {
  const b = scoreOf(before);
  const a = scoreOf(after);
  const dimensions: ReportDelta[] = b.map((row, i) => ({
    dimension: row.dimension,
    before: row.score,
    after: a[i].score,
    diff: a[i].score - row.score,
  }));
  const topImprovements = dimensions
    .filter((d) => d.diff > 0)
    .sort((a1, b1) => b1.diff - a1.diff)
    .slice(0, 3);
  const topRegressions = dimensions
    .filter((d) => d.diff < 0)
    .sort((a1, b1) => a1.diff - b1.diff)
    .slice(0, 3);
  const overallDiff = after.overallScore - before.overallScore;
  const summary =
    overallDiff > 0
      ? `종합 점수 +${overallDiff}점 향상 (${before.overallScore} → ${after.overallScore})`
      : overallDiff < 0
        ? `종합 점수 ${overallDiff}점 하락 (${before.overallScore} → ${after.overallScore})`
        : `종합 점수 동일 (${after.overallScore}점)`;
  return {
    overallBefore: before.overallScore,
    overallAfter: after.overallScore,
    overallDiff,
    dimensions,
    topImprovements,
    topRegressions,
    summary,
  };
}

/**
 * 안전한 autoFix 적용 + before/after 리포트 동시 생성.
 * "자동수정을 적용하면 내 글이 얼마나 좋아지는지" 를 한 함수 호출로 보여줌.
 */
export interface SafeAutoFixResult {
  fixedText: string;
  changes: Array<{ from: string; to: string }>;
  before: KoreanQualityReport;
  after: KoreanQualityReport;
  comparison: ReportComparison;
}
export function applySafeAutoFix(text: string, sectionName = '본문'): SafeAutoFixResult {
  const before = generateQualityReport(text, sectionName);
  const { fixed, changes } = autoFixText(text, 'error');
  const after = generateQualityReport(fixed, sectionName);
  const comparison = compareReports(before, after);
  return { fixedText: fixed, changes, before, after, comparison };
}

/**
 * 단어 조회 — 주어진 단어가 맞춤법 규칙에 걸리면 해당 규칙의 설명·제안을 반환.
 * 에디터·툴팁에서 특정 단어에 대한 학습용 설명을 표시할 때 사용.
 */
export interface WordExplanation {
  matched: boolean;
  wrong?: string;
  suggestion?: string;
  reason?: string;
  severity?: 'error' | 'warning' | 'info';
}

export function explainWrongWord(word: string): WordExplanation {
  const w = (word ?? '').trim();
  if (!w) return { matched: false };
  for (const rule of RULES) {
    const re = new RegExp(rule.pattern.source);
    if (re.test(w)) {
      return {
        matched: true,
        wrong: rule.wrong,
        suggestion: rule.suggestion,
        reason: rule.reason,
        severity: rule.severity,
      };
    }
  }
  return { matched: false };
}

/**
 * 종합 점수 → 등급 변환. A+ ~ F. UI 배지·차트 축에 활용.
 */
export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
export interface GradeInfo {
  grade: Grade;
  tier: '탁월' | '우수' | '양호' | '보통' | '미흡' | '부족' | '낙제';
  color: 'green' | 'blue' | 'teal' | 'amber' | 'orange' | 'red' | 'gray';
}
export function gradeFromScore(score: number): GradeInfo {
  if (score >= 95) return { grade: 'A+', tier: '탁월', color: 'green' };
  if (score >= 85) return { grade: 'A', tier: '우수', color: 'green' };
  if (score >= 75) return { grade: 'B+', tier: '양호', color: 'blue' };
  if (score >= 65) return { grade: 'B', tier: '양호', color: 'teal' };
  if (score >= 50) return { grade: 'C', tier: '보통', color: 'amber' };
  if (score >= 35) return { grade: 'D', tier: '미흡', color: 'orange' };
  return { grade: 'F', tier: '낙제', color: 'red' };
}

/**
 * 리포트의 12 차원별 점수를 공개 API 로 노출. prioritizeImprovements 와 compareReports
 * 내부에서 쓰이던 scoreOf 를 같은 기준으로 외부 사용자도 접근 가능하게 함 (레이더 차트 등).
 */
export interface DimensionScore {
  dimension: string;
  score: number;
}
export function getDimensionScores(report: KoreanQualityReport): DimensionScore[] {
  return scoreOf(report);
}

/**
 * 예상 읽기 시간 — 한국어 평균 독해 속도 ~300 자/분 기준.
 * 구직자·심사자가 글의 부담감을 가늠할 수 있게 돕는다.
 */
export interface ReadingTimeEstimate {
  chars: number;
  words: number;
  minutes: number; // 분 단위 (0.5 반올림)
  label: string; // '30초 이내' | '약 2분' 등
}
export function estimateReadingTime(text: string, charsPerMinute = 300): ReadingTimeEstimate {
  const clean = (text ?? '').replace(/\s+/g, '');
  const chars = clean.length;
  const words = (text ?? '').match(/[가-힣A-Za-z0-9]+/g)?.length ?? 0;
  const rawMinutes = chars / charsPerMinute;
  const minutes = Math.max(0, Math.round(rawMinutes * 2) / 2); // 0.5 step
  const label =
    chars === 0
      ? '본문 없음'
      : rawMinutes < 0.5
        ? '30초 이내'
        : minutes < 1
          ? '약 30초'
          : minutes < 2
            ? '약 1분'
            : `약 ${Math.round(minutes)}분`;
  return { chars, words, minutes, label };
}

/**
 * 날짜 포맷 일관성 검사 — 이력서·자소서 전반에서 2023.01 / 2023-01-05 / 2023/01/05 / 2023년 1월
 * 등 섞이면 전문성이 떨어져 보임. 포맷별 빈도를 계산해 2종 이상이면 경고.
 */
export interface DateFormatHit {
  format: 'dot' | 'hyphen' | 'slash' | 'korean' | 'other';
  sample: string;
  index: number;
}
export interface DateConsistencyAnalysis {
  hits: DateFormatHit[];
  formatCounts: Record<DateFormatHit['format'], number>;
  distinctFormats: number;
  dominantFormat: DateFormatHit['format'] | null;
  consistent: boolean;
  suggestion: string;
}

const DATE_PATTERNS: Array<{ re: RegExp; format: DateFormatHit['format'] }> = [
  { re: /\b\d{4}\.(0?[1-9]|1[0-2])(?:\.(0?[1-9]|[12]\d|3[01]))?\b/g, format: 'dot' },
  { re: /\b\d{4}-(0?[1-9]|1[0-2])(?:-(0?[1-9]|[12]\d|3[01]))?\b/g, format: 'hyphen' },
  { re: /\b\d{4}\/(0?[1-9]|1[0-2])(?:\/(0?[1-9]|[12]\d|3[01]))?\b/g, format: 'slash' },
  { re: /\d{4}년\s*\d{1,2}월(?:\s*\d{1,2}일)?/g, format: 'korean' },
];

export function analyzeDateConsistency(text: string): DateConsistencyAnalysis {
  const t = text ?? '';
  const hits: DateFormatHit[] = [];
  for (const p of DATE_PATTERNS) {
    const re = new RegExp(p.re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      hits.push({ format: p.format, sample: m[0], index: m.index });
      if (hits.length > 80) break;
    }
    if (hits.length > 80) break;
  }
  hits.sort((a, b) => a.index - b.index);
  const formatCounts: Record<DateFormatHit['format'], number> = {
    dot: 0,
    hyphen: 0,
    slash: 0,
    korean: 0,
    other: 0,
  };
  for (const h of hits) formatCounts[h.format]++;
  const usedFormats = (Object.keys(formatCounts) as DateFormatHit['format'][]).filter(
    (k) => formatCounts[k] > 0,
  );
  const distinctFormats = usedFormats.length;
  const dominantFormat = usedFormats.sort((a, b) => formatCounts[b] - formatCounts[a])[0] ?? null;
  const consistent = distinctFormats <= 1;
  let suggestion = '';
  if (hits.length === 0) suggestion = '날짜 표기가 감지되지 않았습니다.';
  else if (consistent) suggestion = `날짜 표기가 "${dominantFormat}" 로 일관됩니다.`;
  else
    suggestion = `날짜 포맷이 ${distinctFormats}종 혼재 — 한 가지로 통일하세요 (주류: "${dominantFormat}", ${formatCounts[dominantFormat!]}건).`;
  return {
    hits: hits.slice(0, 30),
    formatCounts,
    distinctFormats,
    dominantFormat,
    consistent,
    suggestion,
  };
}

/**
 * 비즈니스 자곤(jargon) 과잉 사용 검출 — "인사이트/시너지/커뮤니케이션/이니셔티브/리소스"
 * 같은 버즈워드는 구체성이 없고 공허한 인상. 3건 이상이면 재작성 권고.
 */
const JARGON_WORDS = [
  '인사이트',
  '시너지',
  '커뮤니케이션',
  '이니셔티브',
  '리소스',
  '패러다임',
  '디벨롭',
  '얼라인',
  '온보딩',
  '데브옵스',
  '오너십',
  '임팩트',
  '레버리지',
  '밸류',
  '어젠다',
  '콘텐츠',
  '스케일업',
];

export interface JargonAnalysis {
  hits: Array<{ word: string; count: number }>;
  totalCount: number;
  distinctCount: number;
  level: 'none' | 'few' | 'many';
  suggestion: string;
}

export function detectJargon(text: string): JargonAnalysis {
  const t = text ?? '';
  const counts = new Map<string, number>();
  for (const w of JARGON_WORDS) {
    const re = new RegExp(w, 'g');
    const matches = t.match(re);
    if (matches) counts.set(w, matches.length);
  }
  const hits = [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
  const totalCount = hits.reduce((a, b) => a + b.count, 0);
  const distinctCount = hits.length;
  const level: JargonAnalysis['level'] =
    totalCount === 0 ? 'none' : totalCount < 3 ? 'few' : 'many';
  const suggestion =
    level === 'none'
      ? '자곤 표현이 감지되지 않았습니다.'
      : level === 'few'
        ? `자곤 ${totalCount}건 — "${hits[0].word}" 등을 구체 표현으로 바꾸세요.`
        : `자곤이 ${totalCount}건, ${distinctCount}종 남용됩니다. 구체적 행동·결과로 재작성하세요.`;
  return { hits: hits.slice(0, 10), totalCount, distinctCount, level, suggestion };
}

/**
 * 괄호 균형 검사 — ([{「『 와 대응 닫힘의 개수가 다르면 편집 실수. 이력서·자소서에서
 * 편집 중 생기는 흔한 실수를 간단히 포착.
 */
export interface BracketBalanceAnalysis {
  pairs: Array<{ open: string; close: string; opened: number; closed: number; unbalanced: number }>;
  unbalanced: boolean;
  suggestion: string;
}

const BRACKET_PAIRS: Array<{ open: string; close: string }> = [
  { open: '(', close: ')' },
  { open: '[', close: ']' },
  { open: '{', close: '}' },
  { open: '「', close: '」' },
  { open: '『', close: '』' },
  { open: '<', close: '>' },
  { open: '"', close: '"' },
  { open: '"', close: '"' },
];

export function analyzeBracketBalance(text: string): BracketBalanceAnalysis {
  const t = text ?? '';
  const pairs = BRACKET_PAIRS.map(({ open, close }) => {
    const opened =
      open === close
        ? Math.floor((t.split(open).length - 1) / 2) // 대칭 기호는 짝수 기대
        : t.split(open).length - 1;
    const closed = open === close ? opened : t.split(close).length - 1;
    const unbalanced = Math.abs(opened - closed);
    return { open, close, opened, closed, unbalanced };
  }).filter((p) => p.opened > 0 || p.closed > 0);
  const hasUnbalanced = pairs.some((p) => p.unbalanced > 0);
  const suggestion = hasUnbalanced
    ? `괄호 불균형: ${pairs
        .filter((p) => p.unbalanced > 0)
        .map((p) => `${p.open}${p.close} ${p.opened}/${p.closed}`)
        .join(', ')} — 짝을 맞추세요.`
    : pairs.length > 0
      ? '괄호 균형이 맞습니다.'
      : '괄호가 사용되지 않았습니다.';
  return { pairs, unbalanced: hasUnbalanced, suggestion };
}

/**
 * 공백 이상 검출 — 줄 끝 trailing 공백 · 탭 문자 · 무중단 공백(NBSP) · 탭·공백 혼재 등
 * 복사/붙여넣기 혹은 에디터 설정 차이로 생기는 숨은 쓰레기. 자동 제거 대상.
 */
export interface WhitespaceAnomaly {
  type: 'trailing' | 'tab' | 'nbsp' | 'fullwidth' | 'multiple-blank-lines';
  index: number;
  line: number;
  sample: string;
}
export interface WhitespaceAnalysis {
  anomalies: WhitespaceAnomaly[];
  counts: Record<WhitespaceAnomaly['type'], number>;
  clean: boolean;
  suggestion: string;
}

export function detectWhitespaceAnomalies(text: string): WhitespaceAnalysis {
  const t = text ?? '';
  const anomalies: WhitespaceAnomaly[] = [];
  const lines = t.split('\n');
  let lineOffset = 0;
  let consecBlank = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // trailing
    if (/ +$/.test(line)) {
      anomalies.push({
        type: 'trailing',
        index: lineOffset + line.length - (line.match(/ +$/)?.[0].length ?? 0),
        line: i + 1,
        sample: '·'.repeat(line.match(/ +$/)?.[0].length ?? 0),
      });
    }
    // tab
    const tabMatch = line.match(/\t/);
    if (tabMatch) {
      anomalies.push({
        type: 'tab',
        index: lineOffset + (tabMatch.index ?? 0),
        line: i + 1,
        sample: '→',
      });
    }
    // NBSP (U+00A0)
    const nbspMatch = line.match(/\u00A0/);
    if (nbspMatch) {
      anomalies.push({
        type: 'nbsp',
        index: lineOffset + (nbspMatch.index ?? 0),
        line: i + 1,
        sample: '[NBSP]',
      });
    }
    // fullwidth (U+3000)
    const fwMatch = line.match(/\u3000/);
    if (fwMatch) {
      anomalies.push({
        type: 'fullwidth',
        index: lineOffset + (fwMatch.index ?? 0),
        line: i + 1,
        sample: '[전각]',
      });
    }
    if (/^\s*$/.test(line)) consecBlank++;
    else {
      if (consecBlank >= 3) {
        anomalies.push({
          type: 'multiple-blank-lines',
          index: lineOffset - consecBlank,
          line: i - consecBlank + 1,
          sample: `빈줄 ${consecBlank}개`,
        });
      }
      consecBlank = 0;
    }
    lineOffset += line.length + 1; // +1 for '\n'
  }
  const counts: Record<WhitespaceAnomaly['type'], number> = {
    trailing: 0,
    tab: 0,
    nbsp: 0,
    fullwidth: 0,
    'multiple-blank-lines': 0,
  };
  for (const a of anomalies) counts[a.type]++;
  const clean = anomalies.length === 0;
  const suggestion = clean
    ? '공백 이상이 없습니다.'
    : `공백 이상 ${anomalies.length}건: ${Object.entries(counts)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')} — 에디터에서 정리하세요.`;
  return { anomalies: anomalies.slice(0, 30), counts, clean, suggestion };
}

/**
 * 숫자 포맷 일관성 — "1,000 / 1000 / 1천" 혼재 여부. 이력서·자소서 전반에서 숫자 표기를
 * 한 가지로 통일하면 전문성 상승.
 */
export interface NumericFormatAnalysis {
  comma: number; // 1,000
  plain: number; // 1000
  korean: number; // 1천, 1만, 1억
  distinct: number;
  dominant: 'comma' | 'plain' | 'korean' | null;
  consistent: boolean;
  suggestion: string;
}

export function analyzeNumericFormat(text: string): NumericFormatAnalysis {
  const t = text ?? '';
  const comma = (t.match(/\b\d{1,3}(?:,\d{3})+\b/g) ?? []).length;
  const korean = (t.match(/\d+\s*(천|만|억|조)/g) ?? []).length;
  // plain: 4자리 이상 숫자이면서 쉼표·한글단위 없이 등장
  const allLarge = (t.match(/(?<![,\d])\d{4,}(?![,\d])/g) ?? []).length;
  const plain = Math.max(0, allLarge - comma - korean);
  const allFormats: Array<{ key: NonNullable<NumericFormatAnalysis['dominant']>; count: number }> =
    [
      { key: 'comma' as const, count: comma },
      { key: 'plain' as const, count: plain },
      { key: 'korean' as const, count: korean },
    ];
  const formats = allFormats.filter((f) => f.count > 0);
  const distinct = formats.length;
  formats.sort((a, b) => b.count - a.count);
  const dominant = formats[0]?.key ?? null;
  const consistent = distinct <= 1;
  let suggestion = '';
  const total = comma + plain + korean;
  if (total === 0) suggestion = '4자리 이상 숫자가 없습니다.';
  else if (consistent) suggestion = `숫자 포맷이 "${dominant}" 로 일관됩니다.`;
  else
    suggestion = `숫자 포맷 ${distinct}종 혼재 — "${dominant}" 스타일로 통일하세요 (쉼표=${comma}, 단순=${plain}, 한글=${korean}).`;
  return { comma, plain, korean, distinct, dominant, consistent, suggestion };
}

/**
 * 기술 용어 대소문자 일관성 — "JavaScript / javascript / Javascript", "GitHub / github",
 * "Node.js / nodejs / Nodejs" 같은 케이스 불일치를 검출. 이력서에서 한 용어 여러 표기 노출.
 * canonical 표기 + 등장한 변형 목록 + 주류 표기 추천.
 */
const TECH_CANONICAL: Record<string, string[]> = {
  JavaScript: ['javascript', 'Javascript', 'JAVASCRIPT', 'JS'],
  TypeScript: ['typescript', 'Typescript', 'TYPESCRIPT', 'TS'],
  'Node.js': ['nodejs', 'Nodejs', 'NodeJS', 'NODE.JS', 'node.js'],
  GitHub: ['github', 'Github', 'GITHUB'],
  GitLab: ['gitlab', 'Gitlab', 'GITLAB'],
  iOS: ['ios', 'IOS', 'Ios'],
  MySQL: ['mysql', 'Mysql', 'MYSQL'],
  PostgreSQL: ['postgresql', 'Postgresql', 'POSTGRESQL', 'postgres', 'Postgres'],
  MongoDB: ['mongodb', 'Mongodb', 'MONGODB', 'mongo'],
  AWS: ['Aws', 'aws'],
  HTML: ['html', 'Html'],
  CSS: ['css', 'Css'],
  API: ['api', 'Api'],
  REST: ['rest', 'Rest'],
  GraphQL: ['graphql', 'Graphql', 'GRAPHQL'],
  Docker: ['docker', 'DOCKER'],
  Kubernetes: ['kubernetes', 'KUBERNETES', 'K8S', 'k8s'],
  'CI/CD': ['ci/cd', 'Ci/Cd', 'cicd', 'CICD'],
  React: ['react', 'REACT'],
  'Vue.js': ['vue.js', 'vue', 'Vue', 'VUE.JS'],
  'Next.js': ['next.js', 'next', 'Next', 'NEXT.JS', 'nextjs', 'Nextjs'],
};

export interface CasingHit {
  canonical: string;
  variants: Array<{ form: string; count: number }>;
  total: number;
}
export interface CasingAnalysis {
  hits: CasingHit[];
  suggestion: string;
}

export function detectInconsistentCasing(text: string): CasingAnalysis {
  const t = text ?? '';
  const hits: CasingHit[] = [];
  for (const [canonical, variants] of Object.entries(TECH_CANONICAL)) {
    const forms = new Map<string, number>();
    const all = [canonical, ...variants];
    for (const form of all) {
      // word boundary 우회 — 특수문자 포함된 토큰(Node.js)도 대응
      const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?<![A-Za-z0-9.])${escaped}(?![A-Za-z0-9.])`, 'g');
      const matches = t.match(re);
      if (matches) forms.set(form, matches.length);
    }
    if (forms.size >= 2) {
      const variants2 = [...forms.entries()]
        .map(([form, count]) => ({ form, count }))
        .sort((a, b) => b.count - a.count);
      hits.push({
        canonical,
        variants: variants2,
        total: variants2.reduce((a, b) => a + b.count, 0),
      });
    }
  }
  hits.sort((a, b) => b.total - a.total);
  const suggestion = hits.length
    ? `기술 용어 케이스 불일치 ${hits.length}건 — "${hits[0].canonical}" 등 정식 표기로 통일하세요.`
    : '기술 용어 대소문자가 일관됩니다.';
  return { hits: hits.slice(0, 8), suggestion };
}

/**
 * 기술 스택·스킬 언급 감지 — 빈도 많은 스킬/도구 이름을 추출해 카운트.
 * 이력서 요약 대시보드·스킬 배지에 활용.
 */
const TECH_SKILLS = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'Kotlin',
  'Swift',
  'Go',
  'Rust',
  'C++',
  'C#',
  'React',
  'Vue.js',
  'Angular',
  'Svelte',
  'Next.js',
  'Nuxt',
  'Node.js',
  'Express',
  'NestJS',
  'Django',
  'FastAPI',
  'Spring',
  'MySQL',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'Elasticsearch',
  'AWS',
  'GCP',
  'Azure',
  'Docker',
  'Kubernetes',
  'Terraform',
  'GitHub',
  'GitLab',
  'Figma',
  'Sketch',
  'Photoshop',
  'Illustrator',
  'TailwindCSS',
  'HTML',
  'CSS',
  'GraphQL',
  'REST',
];

export interface SkillMention {
  skill: string;
  count: number;
}
export function detectSkillMentions(text: string, topN = 15): SkillMention[] {
  const t = text ?? '';
  const hits: SkillMention[] = [];
  for (const skill of TECH_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![A-Za-z0-9.])${escaped}(?![A-Za-z0-9.])`, 'gi');
    const matches = t.match(re);
    if (matches) hits.push({ skill, count: matches.length });
  }
  hits.sort((a, b) => b.count - a.count);
  return hits.slice(0, topN);
}

/**
 * 문단 구조 분석 — 문단 수 · 길이 분포 · 너무 길거나 짧은 문단 검출.
 * 이상적 자소서 문단: 100~300자. 50자 이하 "짧은 조각" 혹은 500자 이상 "벽 같은 덩어리" 경고.
 */
export interface ParagraphStats {
  count: number;
  avgLength: number;
  shortParagraphs: number; // <50자
  longParagraphs: number; // >500자
  idealRatio: number; // 100~300자 범위 비율 (0~1)
  suggestion: string;
}

export function analyzeParagraphs(text: string): ParagraphStats {
  const t = (text ?? '').trim();
  if (!t) {
    return {
      count: 0,
      avgLength: 0,
      shortParagraphs: 0,
      longParagraphs: 0,
      idealRatio: 0,
      suggestion: '본문이 비어 있습니다.',
    };
  }
  const paragraphs = t
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const count = paragraphs.length;
  const lengths = paragraphs.map((p) => p.length);
  const avgLength = count > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / count) : 0;
  const shortParagraphs = lengths.filter((l) => l < 50).length;
  const longParagraphs = lengths.filter((l) => l > 500).length;
  const idealCount = lengths.filter((l) => l >= 100 && l <= 300).length;
  const idealRatio = count > 0 ? Math.round((idealCount / count) * 100) / 100 : 0;
  let suggestion = '';
  if (count === 1 && lengths[0] > 300) {
    suggestion = `본문이 한 문단(${lengths[0]}자)로만 구성 — 빈 줄로 2~4 문단 분리 권장.`;
  } else if (longParagraphs > 0) {
    suggestion = `긴 문단(>500자) ${longParagraphs}개 — 독자가 부담스러워 합니다. 분리하세요.`;
  } else if (shortParagraphs > count / 2) {
    suggestion = `짧은 문단(<50자) 비율 높음 (${shortParagraphs}/${count}) — 문장을 엮어 흐름을 만드세요.`;
  } else if (idealRatio >= 0.6) {
    suggestion = `문단 구성이 안정적입니다 (이상 범위 ${Math.round(idealRatio * 100)}%).`;
  } else {
    suggestion = `이상 문단 길이(100~300자) 비율 ${Math.round(idealRatio * 100)}% — 문단을 균일화해 보세요.`;
  }
  return { count, avgLength, shortParagraphs, longParagraphs, idealRatio, suggestion };
}

/**
 * 동의어 제안 — 이력서·자소서에 자주 남용되는 단어에 대해 대안 3~5개 제시.
 * 사용자가 동일 단어 반복 시 변주 아이디어로 활용.
 */
const SYNONYM_MAP: Record<string, string[]> = {
  개발: ['구현', '설계', '구축', '제작'],
  관리: ['운영', '통솔', '감독', '책임'],
  '문제 해결': ['돌파', '극복', '해결', '대응'],
  협업: ['협력', '공동 작업', '파트너십', '소통'],
  경험: ['이력', '프로젝트 수행', '사례', '실무'],
  참여: ['기여', '동참', '제안', '실행'],
  효율: ['생산성', '속도', '최적화', '자원 절약'],
  성과: ['결과', '산출물', '임팩트', '기여도'],
  학습: ['습득', '내재화', '체화', '연구'],
  개선: ['업그레이드', '고도화', '최적화', '향상'],
  능력: ['역량', '스킬', '전문성', '숙련'],
  노력: ['실행', '추진', '몰입', '집중'],
};

export interface SynonymSuggestion {
  word: string;
  alternatives: string[];
}
export function suggestSynonyms(word: string): SynonymSuggestion {
  const w = (word ?? '').trim();
  const alt = SYNONYM_MAP[w];
  return { word: w, alternatives: alt ?? [] };
}

/**
 * 본문에서 남용된 단어를 찾아 동의어 후보까지 같이 반환.
 * analyzeRedundancy 와 연동해 "반복 단어 + 대안 제안" 한 번에 보여주기.
 */
export interface OveruseWithSynonyms {
  word: string;
  count: number;
  alternatives: string[];
}
export function suggestSynonymsForOveruse(text: string, minCount = 3): OveruseWithSynonyms[] {
  const t = text ?? '';
  const results: OveruseWithSynonyms[] = [];
  for (const [word, alternatives] of Object.entries(SYNONYM_MAP)) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'g');
    const matches = t.match(re);
    if (matches && matches.length >= minCount) {
      results.push({ word, count: matches.length, alternatives });
    }
  }
  results.sort((a, b) => b.count - a.count);
  return results.slice(0, 10);
}

/**
 * 중복 문장 검출 — 동일하거나 매우 유사한 문장이 2번 이상 반복되면 편집 실수 혹은
 * 템플릿 복사 흔적. 문장 정규화(공백/조사 일부 제거) 후 빈도 집계.
 */
export interface DuplicateSentence {
  normalized: string;
  first: { original: string; index: number };
  duplicates: Array<{ original: string; index: number }>;
  count: number;
}

function normalizeSentence(s: string): string {
  return s
    .replace(/\s+/g, '')
    .replace(/[.!?。,"'「」『』()]/g, '')
    .replace(/(을|를|이|가|은|는|의|에|에서|로|으로|와|과|도)(?=[가-힣])/g, '')
    .toLowerCase();
}

export function detectDuplicateSentences(text: string, minLength = 15): DuplicateSentence[] {
  const t = (text ?? '').replace(/\n/g, ' ').trim();
  if (!t) return [];
  const sentences = t.split(/[.!?。]+/).filter((s) => s.trim().length >= minLength);
  const byNormalized = new Map<
    string,
    { original: string; index: number; duplicates: Array<{ original: string; index: number }> }
  >();
  let cursor = 0;
  for (const s of sentences) {
    const normalized = normalizeSentence(s);
    if (!normalized) continue;
    const trimmed = s.trim();
    const localIndex = t.indexOf(trimmed, cursor);
    cursor = localIndex >= 0 ? localIndex + trimmed.length : cursor;
    const existing = byNormalized.get(normalized);
    if (existing) {
      existing.duplicates.push({ original: trimmed, index: localIndex });
    } else {
      byNormalized.set(normalized, { original: trimmed, index: localIndex, duplicates: [] });
    }
  }
  const results: DuplicateSentence[] = [];
  for (const [normalized, entry] of byNormalized.entries()) {
    if (entry.duplicates.length >= 1) {
      results.push({
        normalized,
        first: { original: entry.original, index: entry.index },
        duplicates: entry.duplicates,
        count: 1 + entry.duplicates.length,
      });
    }
  }
  results.sort((a, b) => b.count - a.count);
  return results.slice(0, 10);
}

/**
 * 1인칭 대명사 남용 분석 — "저는/제가/제/저를" 과잉 사용은 유아적 인상. 이력서/자소서에서
 * 1인칭을 생략해도 한국어는 자연스러움. per-100자 비율로 평가.
 */
export interface FirstPersonAnalysis {
  counts: Record<'저는' | '제가' | '저를' | '저의' | '제', number>;
  total: number;
  per100Chars: number;
  level: 'low' | 'medium' | 'high';
  suggestion: string;
}

export function analyzeFirstPersonUsage(text: string): FirstPersonAnalysis {
  const t = text ?? '';
  const counts: FirstPersonAnalysis['counts'] = {
    저는: (t.match(/(?<![가-힣])저는(?![가-힣])/g) ?? []).length,
    제가: (t.match(/(?<![가-힣])제가(?![가-힣])/g) ?? []).length,
    저를: (t.match(/(?<![가-힣])저를(?![가-힣])/g) ?? []).length,
    저의: (t.match(/(?<![가-힣])저의(?![가-힣])/g) ?? []).length,
    제: (t.match(/(?<![가-힣])제\s/g) ?? []).length,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const chars = t.replace(/\s+/g, '').length || 1;
  const per100Chars = Math.round((total / chars) * 10000) / 100; // 소수점 2자리
  let level: FirstPersonAnalysis['level'];
  if (per100Chars < 0.8) level = 'low';
  else if (per100Chars < 1.6) level = 'medium';
  else level = 'high';
  const suggestion =
    total === 0
      ? '1인칭 대명사가 거의 없습니다 — 자연스러운 상태.'
      : level === 'low'
        ? `1인칭 사용 ${total}회 (100자당 ${per100Chars}회) — 적정 수준.`
        : level === 'medium'
          ? `1인칭 사용 ${total}회 (100자당 ${per100Chars}회) — 일부는 주어 생략 가능한지 검토하세요.`
          : `1인칭 과다 (${total}회, 100자당 ${per100Chars}회) — 한국어는 주어를 생략해도 자연스럽습니다.`;
  return { counts, total, per100Chars, level, suggestion };
}

/**
 * 경력 연도 범위 추출 — "2020.01 ~ 2023.12", "2020년 1월 ~ 2023년 12월", "2020 - 2023"
 * 같은 기간 표기를 찾아 총 경력 개월 수·년수로 환산.
 */
export interface ExperienceRange {
  start: { year: number; month: number };
  end: { year: number; month: number };
  months: number;
  raw: string;
}
export interface ExperienceEstimate {
  ranges: ExperienceRange[];
  totalMonths: number;
  totalYears: number; // 소수 1자리
  summary: string;
}

export function estimateExperienceYears(text: string, currentYear?: number): ExperienceEstimate {
  const t = text ?? '';
  const nowYear = currentYear ?? new Date().getFullYear();
  const nowMonth = new Date().getMonth() + 1;
  const ranges: ExperienceRange[] = [];
  const patterns = [
    /(\d{4})[.\-/년\s]+(\d{1,2})[월\s]*(?:\s*[~\-–—]\s*)(현재|재직\s*중|\d{4}[.\-/년\s]+\d{1,2})/g,
    /(\d{4})\s*[~\-–—]\s*(현재|재직\s*중|\d{4})/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, 'g');
    while ((m = r.exec(t))) {
      const startYear = parseInt(m[1], 10);
      const startMonth =
        re.source.includes('\\d{1,2}') && m[2] && /^\d+$/.test(m[2]) ? parseInt(m[2], 10) : 1;
      let endYear = nowYear;
      let endMonth = nowMonth;
      const endRaw = (m[3] ?? m[2] ?? '').trim();
      if (endRaw && endRaw !== '현재' && !endRaw.includes('재직')) {
        const endMatch = endRaw.match(/(\d{4})(?:[.\-/년\s]+(\d{1,2}))?/);
        if (endMatch) {
          endYear = parseInt(endMatch[1], 10);
          endMonth = endMatch[2] ? parseInt(endMatch[2], 10) : 12;
        }
      }
      if (startYear < 1900 || startYear > 2100 || endYear < startYear) continue;
      const months = Math.max(0, (endYear - startYear) * 12 + (endMonth - startMonth) + 1);
      if (months > 0 && months < 720) {
        ranges.push({
          start: { year: startYear, month: startMonth },
          end: { year: endYear, month: endMonth },
          months,
          raw: m[0],
        });
      }
    }
  }
  // 중복 제거 (raw 문자열 기반)
  const seen = new Set<string>();
  const unique = ranges.filter((r) => {
    if (seen.has(r.raw)) return false;
    seen.add(r.raw);
    return true;
  });
  const totalMonths = unique.reduce((a, b) => a + b.months, 0);
  const totalYears = Math.round((totalMonths / 12) * 10) / 10;
  const summary =
    unique.length === 0
      ? '경력 기간 표기가 감지되지 않았습니다.'
      : `${unique.length}개 기간 · 총 ${totalYears}년 (${totalMonths}개월)`;
  return { ranges: unique, totalMonths, totalYears, summary };
}

/**
 * 과장 표현 검출 — "세계 최초/유일", "100% 완벽", "무한한 가능성" 같은 검증 불가 과장은
 * 공식 문서 신뢰도를 떨어뜨림. 10개 패턴 대응.
 */
const EXAGGERATION_PATTERNS: Array<{ re: RegExp; phrase: string; reason: string }> = [
  {
    re: /세계\s*(최초|최고|유일)/g,
    phrase: '세계 최초/최고/유일',
    reason: '증명 어려운 과장. 구체 수치·범위로 한정.',
  },
  {
    re: /국내\s*(최초|최고|유일)/g,
    phrase: '국내 최초/최고/유일',
    reason: '증명 어려운 과장. 범위 한정 권장.',
  },
  {
    re: /완벽(?:한|하게|히)/g,
    phrase: '완벽',
    reason: '"완벽"은 검증 불가. "누락 없이" 등 구체 기준으로.',
  },
  { re: /무한[한히]/g, phrase: '무한한/무한히', reason: '추상 표현. 측정 가능한 값으로.' },
  {
    re: /100%\s*(?:완료|달성|완벽)/g,
    phrase: '100% 완료/달성',
    reason: '정량 지표는 실제 KPI 기준 명시.',
  },
  { re: /유일무이[한하]/g, phrase: '유일무이', reason: '사실 확인 불가 표현.' },
  { re: /타의 추종을 불허/g, phrase: '타의 추종을 불허', reason: '상투적 과장. 구체 수치로 증명.' },
  { re: /절대\s*(?:적|로)/g, phrase: '절대적/절대로', reason: '극단 표현. 조건부로 완화.' },
  { re: /최고\s*수준/g, phrase: '최고 수준', reason: '근거 제시 필요.' },
  {
    re: /타사\s*대비\s*(?:월등|우수)/g,
    phrase: '타사 대비 월등/우수',
    reason: '비교 근거·수치 필요.',
  },
];

export interface ExaggerationHit {
  phrase: string;
  index: number;
  reason: string;
}
export interface ExaggerationAnalysis {
  hits: ExaggerationHit[];
  count: number;
  level: 'none' | 'few' | 'many';
  suggestion: string;
}

export function detectExaggeration(text: string): ExaggerationAnalysis {
  const t = text ?? '';
  const hits: ExaggerationHit[] = [];
  for (const p of EXAGGERATION_PATTERNS) {
    const re = new RegExp(p.re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      hits.push({ phrase: p.phrase, index: m.index, reason: p.reason });
      if (hits.length > 40) break;
    }
    if (hits.length > 40) break;
  }
  hits.sort((a, b) => a.index - b.index);
  const count = hits.length;
  const level: ExaggerationAnalysis['level'] = count === 0 ? 'none' : count <= 2 ? 'few' : 'many';
  const suggestion =
    level === 'none'
      ? '과장 표현이 없습니다.'
      : level === 'few'
        ? `과장 표현 ${count}건 — "${hits[0].phrase}" 를 증거 있는 표현으로 바꿔보세요.`
        : `과장 표현이 ${count}건으로 많습니다. 신뢰도를 위해 증명 가능한 수치로 대체하세요.`;
  return { hits: hits.slice(0, 20), count, level, suggestion };
}

/**
 * 연락처 정보 검증 — 이력서에 포함된 이메일·전화번호 형식 확인.
 * 이메일 RFC 기본 패턴 / 한국 전화번호 010-xxxx-xxxx 또는 02-xxxx-xxxx 등.
 */
export interface ContactInfo {
  emails: Array<{ address: string; valid: boolean; index: number }>;
  phones: Array<{ raw: string; normalized: string; valid: boolean; index: number }>;
  summary: string;
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE =
  /(?:\+?82[-\s]?|0)1[016789][-\s]?\d{3,4}[-\s]?\d{4}|(?:\+?82[-\s]?|0)2[-\s]?\d{3,4}[-\s]?\d{4}|0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/g;

function isValidEmail(address: string): boolean {
  if (address.length > 254) return false;
  const parts = address.split('@');
  if (parts.length !== 2) return false;
  return parts[0].length > 0 && parts[1].includes('.') && !address.includes('..');
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('82')) return '0' + digits.slice(2);
  return digits;
}

function isValidPhone(raw: string): boolean {
  const digits = normalizePhone(raw);
  return digits.length >= 9 && digits.length <= 11 && digits.startsWith('0');
}

export function detectContactInfo(text: string): ContactInfo {
  const t = text ?? '';
  const emails: ContactInfo['emails'] = [];
  const phones: ContactInfo['phones'] = [];
  let m: RegExpExecArray | null;
  const emailRe = new RegExp(EMAIL_RE.source, 'g');
  while ((m = emailRe.exec(t))) {
    emails.push({ address: m[0], valid: isValidEmail(m[0]), index: m.index });
  }
  const phoneRe = new RegExp(PHONE_RE.source, 'g');
  while ((m = phoneRe.exec(t))) {
    const raw = m[0];
    phones.push({ raw, normalized: normalizePhone(raw), valid: isValidPhone(raw), index: m.index });
  }
  const invalidEmails = emails.filter((e) => !e.valid).length;
  const invalidPhones = phones.filter((p) => !p.valid).length;
  const issues: string[] = [];
  if (invalidEmails) issues.push(`잘못된 이메일 ${invalidEmails}`);
  if (invalidPhones) issues.push(`잘못된 전화 ${invalidPhones}`);
  const summary =
    emails.length === 0 && phones.length === 0
      ? '연락처 정보가 감지되지 않았습니다.'
      : issues.length
        ? `이메일 ${emails.length} · 전화 ${phones.length} — ${issues.join(', ')}`
        : `연락처 유효 — 이메일 ${emails.length} · 전화 ${phones.length}`;
  return { emails, phones, summary };
}

/**
 * 날짜 범위 논리 검증 — 시작 > 종료인 잘못된 기간(예: 2023.05~2021.01) 포착.
 * estimateExperienceYears 와 동일 패턴을 재사용하되 여기서는 잘못된 범위만 리포트.
 */
export interface InvalidDateRange {
  raw: string;
  start: { year: number; month: number };
  end: { year: number; month: number };
  reason: string;
}

export function validateDateRanges(text: string): InvalidDateRange[] {
  const exp = estimateExperienceYears(text);
  const invalid: InvalidDateRange[] = [];
  for (const r of exp.ranges) {
    const s = r.start.year * 12 + r.start.month;
    const e = r.end.year * 12 + r.end.month;
    if (e < s) {
      invalid.push({
        raw: r.raw,
        start: r.start,
        end: r.end,
        reason: `시작(${r.start.year}.${r.start.month}) 이 종료(${r.end.year}.${r.end.month}) 보다 늦습니다.`,
      });
    } else if (r.months > 600) {
      invalid.push({
        raw: r.raw,
        start: r.start,
        end: r.end,
        reason: `기간이 ${Math.round(r.months / 12)}년으로 지나치게 깁니다 — 오타 의심.`,
      });
    }
  }
  return invalid;
}

/**
 * 표준 이력서 섹션 커버리지 — 한국 이력서가 일반적으로 포함해야 할 섹션 존재 여부 체크.
 * 섹션 제목 키워드(경력/학력/기술/프로젝트/자기소개 등) 감지 후 누락된 것 리포트.
 */
const RESUME_SECTIONS: Array<{ key: string; synonyms: string[] }> = [
  {
    key: '경력',
    synonyms: ['경력 사항', '경력사항', '근무 경력', '회사 경력', '직장 경력', 'Career'],
  },
  { key: '학력', synonyms: ['학력 사항', '학력사항', '교육 사항', '학업', 'Education'] },
  {
    key: '기술',
    synonyms: ['기술 스택', '보유 기술', '스킬', '기술 스킬', 'Skills', 'Tech Stack'],
  },
  { key: '프로젝트', synonyms: ['프로젝트 경험', '주요 프로젝트', 'Projects', 'Portfolio'] },
  { key: '자기소개', synonyms: ['자기 소개', '자기소개서', 'About Me', 'Summary', 'Profile'] },
];

export interface ResumeSectionCoverage {
  present: string[];
  missing: string[];
  coverageRatio: number; // 0~1
  suggestion: string;
}

export function detectMissingResumeSections(text: string): ResumeSectionCoverage {
  const t = text ?? '';
  const present: string[] = [];
  const missing: string[] = [];
  for (const section of RESUME_SECTIONS) {
    const variants = [section.key, ...section.synonyms];
    const found = variants.some((v) => {
      const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(escaped, 'i').test(t);
    });
    if (found) present.push(section.key);
    else missing.push(section.key);
  }
  const coverageRatio = Math.round((present.length / RESUME_SECTIONS.length) * 100) / 100;
  let suggestion = '';
  if (coverageRatio === 1) suggestion = '이력서 주요 섹션이 모두 포함되어 있습니다.';
  else if (missing.length === 1)
    suggestion = `"${missing[0]}" 섹션이 누락되었습니다 — 추가를 고려하세요.`;
  else suggestion = `누락된 섹션: ${missing.join(', ')} — 완성도를 위해 추가하세요.`;
  return { present, missing, coverageRatio, suggestion };
}

/**
 * 이력서 완성도 점수 — 섹션 커버리지 + 연락처 유효성 + 경력 기간 + 스킬 언급 + 정량 지표
 * 5개 축으로 0-100점 산출. generateQualityReport 의 문체/맞춤법과 독립적인 '구조' 점수.
 */
export interface ResumeCompletenessScore {
  overall: number; // 0-100
  breakdown: Array<{ axis: string; score: number; weight: number }>;
  suggestion: string;
}

export function scoreResumeCompleteness(text: string): ResumeCompletenessScore {
  const sections = detectMissingResumeSections(text);
  const contact = detectContactInfo(text);
  const exp = estimateExperienceYears(text);
  const skills = detectSkillMentions(text, 50);
  const quant = analyzeQuantification(text);

  const contactScore =
    contact.emails.length + contact.phones.length === 0
      ? 0
      : contact.emails.filter((e) => e.valid).length > 0 &&
          contact.phones.filter((p) => p.valid).length > 0
        ? 100
        : contact.emails.filter((e) => e.valid).length > 0 ||
            contact.phones.filter((p) => p.valid).length > 0
          ? 60
          : 20;
  const experienceScore = exp.ranges.length === 0 ? 0 : Math.min(100, exp.ranges.length * 25 + 40);
  const skillsScore = Math.min(100, skills.length * 20);
  const quantScore =
    quant.level === 'high' ? 100 : quant.level === 'medium' ? 70 : quant.level === 'low' ? 40 : 10;
  const sectionsScore = Math.round(sections.coverageRatio * 100);

  const breakdown = [
    { axis: '섹션 커버리지', score: sectionsScore, weight: 0.3 },
    { axis: '연락처', score: contactScore, weight: 0.15 },
    { axis: '경력 기간', score: experienceScore, weight: 0.25 },
    { axis: '스킬 언급', score: skillsScore, weight: 0.15 },
    { axis: '정량 지표', score: quantScore, weight: 0.15 },
  ];
  const overall = Math.round(breakdown.reduce((a, b) => a + b.score * b.weight, 0));
  const weakest = [...breakdown].sort((a, b) => a.score - b.score)[0];
  const suggestion =
    overall >= 90
      ? '이력서 구조가 매우 완성도 높습니다.'
      : overall >= 70
        ? `구조 양호 (${overall}점). 약한 축: ${weakest.axis} (${weakest.score}).`
        : `완성도가 낮습니다 (${overall}점). ${weakest.axis} (${weakest.score}) 부터 보강하세요.`;
  return { overall, breakdown, suggestion };
}

/**
 * 민감정보(PII) 검출 — 주민등록번호/카드번호/생년월일(YYYYMMDD)/상세 주소처럼
 * 공개 이력서에 노출되면 위험한 항목. PIPA 준수 + 구직자 개인정보 보호 관점.
 */
export interface PiiHit {
  type: 'rrn' | 'card' | 'birthYmd' | 'address' | 'zipcode';
  sample: string;
  index: number;
  reason: string;
}
export interface PiiAnalysis {
  hits: PiiHit[];
  count: number;
  severity: 'none' | 'warning' | 'critical';
  suggestion: string;
}

export function detectPersonalInfo(text: string): PiiAnalysis {
  const t = text ?? '';
  const hits: PiiHit[] = [];
  // 주민등록번호 YYMMDD-XXXXXXX
  const rrnRe = /\b\d{6}[-\s]?[1-4]\d{6}\b/g;
  let m: RegExpExecArray | null;
  while ((m = rrnRe.exec(t))) {
    hits.push({
      type: 'rrn',
      sample: m[0].slice(0, 6) + '-*******',
      index: m.index,
      reason: '주민등록번호는 절대 이력서에 포함하지 마세요.',
    });
  }
  // 카드번호 (4-4-4-4)
  const cardRe = /\b\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g;
  while ((m = cardRe.exec(t))) {
    hits.push({
      type: 'card',
      sample: '****-****-****-' + m[0].slice(-4),
      index: m.index,
      reason: '신용카드 번호로 추정 — 즉시 제거하세요.',
    });
  }
  // 생년월일 YYYYMMDD (1920~2015 범위)
  const birthRe = /\b(19[2-9]\d|20[01]\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\b/g;
  while ((m = birthRe.exec(t))) {
    hits.push({
      type: 'birthYmd',
      sample: m[0].slice(0, 4) + '****',
      index: m.index,
      reason: '생년월일(YYYYMMDD)은 개인정보 — 연도만 표기 권장.',
    });
  }
  // 상세 주소 — 동/읍/면 + 번지
  const addrRe = /[가-힣]{1,10}(?:동|읍|면)\s?\d+(?:-\d+)?(?:번지)?/g;
  while ((m = addrRe.exec(t))) {
    hits.push({
      type: 'address',
      sample: m[0],
      index: m.index,
      reason: '상세 주소 — 이력서에는 시/구 정도만 표기 권장.',
    });
  }
  // 우편번호 5자리
  const zipRe = /\b\d{5}\b(?=[\s,.])/g;
  while ((m = zipRe.exec(t))) {
    hits.push({
      type: 'zipcode',
      sample: m[0],
      index: m.index,
      reason: '우편번호가 감지되었습니다 — 필요한지 검토.',
    });
  }
  hits.sort((a, b) => a.index - b.index);
  const count = hits.length;
  const hasCritical = hits.some((h) => h.type === 'rrn' || h.type === 'card');
  const severity: PiiAnalysis['severity'] =
    count === 0 ? 'none' : hasCritical ? 'critical' : 'warning';
  const suggestion =
    severity === 'none'
      ? '민감정보가 감지되지 않았습니다.'
      : severity === 'critical'
        ? `⚠️ 주민번호·카드번호 등 고위험 정보 ${count}건 — 즉시 제거하세요.`
        : `주의 — 개인정보 ${count}건 (${[...new Set(hits.map((h) => h.type))].join(', ')}) 감지. 꼭 필요한지 검토하세요.`;
  return { hits: hits.slice(0, 20), count, severity, suggestion };
}

/**
 * 한국어 본문 내 영어 혼재 비율 — 불필요한 영어 삽입(카더라체/버즈워드) 과잉을 포착.
 * 한글 vs 영문 토큰 비율로 평가. 기술·전문 용어는 제외(detectSkillMentions 이 걸러줌).
 */
export interface EnglishMixAnalysis {
  koreanChars: number;
  englishChars: number;
  englishRatio: number; // 0~1
  level: 'low' | 'medium' | 'high';
  suggestion: string;
}

export function analyzeEnglishMix(text: string): EnglishMixAnalysis {
  const t = text ?? '';
  const koreanChars = (t.match(/[가-힣]/g) ?? []).length;
  const englishChars = (t.match(/[A-Za-z]/g) ?? []).length;
  const total = koreanChars + englishChars;
  const englishRatio = total === 0 ? 0 : Math.round((englishChars / total) * 1000) / 1000;
  let level: EnglishMixAnalysis['level'];
  if (englishRatio < 0.1) level = 'low';
  else if (englishRatio < 0.25) level = 'medium';
  else level = 'high';
  const suggestion =
    total === 0
      ? '분석할 본문이 없습니다.'
      : level === 'low'
        ? '한국어 중심 문체입니다.'
        : level === 'medium'
          ? `영문 비율 ${Math.round(englishRatio * 100)}% — 기술 용어 외 일반 어휘는 한국어로 표현할 수 있는지 검토.`
          : `영문 비율이 ${Math.round(englishRatio * 100)}% 로 높습니다. 한국어로 대체 가능한 표현을 우선 사용하세요.`;
  return { koreanChars, englishChars, englishRatio, level, suggestion };
}

/**
 * 감성 분석 — 본문의 긍정/부정 어휘 비율로 전반적 어조(tone) 추정. 이력서·자소서는
 * 일반적으로 긍정 우세가 자연스럽지만, 과잉 긍정은 경계 신호.
 */
const POSITIVE_WORDS = [
  '성장',
  '성공',
  '달성',
  '우수',
  '탁월',
  '도전',
  '열정',
  '성실',
  '책임',
  '기여',
  '협력',
  '극복',
  '개선',
  '혁신',
  '효율',
  '최적화',
  '성과',
  '경험',
  '배움',
  '자신감',
  '즐거움',
  '보람',
  '만족',
  '감사',
];
const NEGATIVE_WORDS = [
  '실패',
  '어려움',
  '힘들',
  '부족',
  '한계',
  '좌절',
  '후회',
  '아쉬움',
  '고민',
  '스트레스',
  '불안',
  '걱정',
  '고민',
  '갈등',
  '위기',
  '문제점',
  '약점',
  '단점',
  '실수',
];

export interface SentimentAnalysis {
  positiveCount: number;
  negativeCount: number;
  ratio: number; // positive / (pos + neg), 0~1
  tone: 'positive' | 'balanced' | 'negative' | 'none';
  suggestion: string;
}

export function analyzeSentiment(text: string): SentimentAnalysis {
  const t = text ?? '';
  let positiveCount = 0;
  let negativeCount = 0;
  for (const w of POSITIVE_WORDS) {
    positiveCount += (t.match(new RegExp(w, 'g')) ?? []).length;
  }
  for (const w of NEGATIVE_WORDS) {
    negativeCount += (t.match(new RegExp(w, 'g')) ?? []).length;
  }
  const total = positiveCount + negativeCount;
  const ratio = total === 0 ? 0.5 : Math.round((positiveCount / total) * 100) / 100;
  let tone: SentimentAnalysis['tone'];
  if (total === 0) tone = 'none';
  else if (ratio >= 0.75) tone = 'positive';
  else if (ratio >= 0.4) tone = 'balanced';
  else tone = 'negative';
  const suggestion =
    tone === 'none'
      ? '감성 어휘가 감지되지 않았습니다.'
      : tone === 'positive'
        ? ratio >= 0.95
          ? `과잉 긍정(${Math.round(ratio * 100)}%) — 도전·실패 경험도 녹여 내면 신뢰도 상승.`
          : `긍정 어조 (${Math.round(ratio * 100)}%) — 자연스러운 이력서 톤.`
        : tone === 'balanced'
          ? '긍정·부정 균형. 도전 극복 서사가 드러나면 효과적.'
          : `부정 어조 비율이 높습니다 (부정 ${Math.round((1 - ratio) * 100)}%) — 극복·배움 위주로 재구성.`;
  return { positiveCount, negativeCount, ratio, tone, suggestion };
}

/**
 * 키워드 → 해시태그 생성. 포트폴리오 공유용 추천 태그 생성. extractKeywords 를
 * 재사용하되 1자 초과 + 한글/영문 제한 + '#' prefix.
 */
export function generateHashtags(text: string, topN = 8): string[] {
  const kws = extractKeywords(text, topN * 2);
  return kws
    .filter((k) => k.word.length >= 2 && /^[가-힣A-Za-z0-9]+$/.test(k.word))
    .slice(0, topN)
    .map((k) => `#${k.word}`);
}

/**
 * URL 링크 추출 + 검증 — 이력서·포트폴리오에 포함된 외부 링크 감지.
 * GitHub/LinkedIn/Notion/Behance/Dribbble 등 플랫폼 분류 + http/https scheme 체크.
 */
export interface ExtractedLink {
  url: string;
  index: number;
  platform: 'github' | 'linkedin' | 'notion' | 'behance' | 'dribbble' | 'velog' | 'blog' | 'other';
  hasScheme: boolean;
}
export interface LinkAnalysis {
  links: ExtractedLink[];
  count: number;
  platforms: string[];
  missingScheme: number;
  suggestion: string;
}

const PLATFORM_PATTERNS: Array<{ re: RegExp; platform: ExtractedLink['platform'] }> = [
  { re: /github\.com/i, platform: 'github' },
  { re: /linkedin\.com/i, platform: 'linkedin' },
  { re: /notion\.(so|site)/i, platform: 'notion' },
  { re: /behance\.net/i, platform: 'behance' },
  { re: /dribbble\.com/i, platform: 'dribbble' },
  { re: /velog\.io/i, platform: 'velog' },
  { re: /\b(tistory|naver\/blog|medium)/i, platform: 'blog' },
];

export function extractLinks(text: string): LinkAnalysis {
  const t = text ?? '';
  const links: ExtractedLink[] = [];
  const re = /(?:https?:\/\/)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s)]*)?/g;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = re.exec(t))) {
    const url = m[0];
    if (seen.has(url)) continue;
    seen.add(url);
    const hasScheme = /^https?:\/\//i.test(url);
    let platform: ExtractedLink['platform'] = 'other';
    for (const p of PLATFORM_PATTERNS) {
      if (p.re.test(url)) {
        platform = p.platform;
        break;
      }
    }
    links.push({ url, index: m.index, platform, hasScheme });
  }
  const platforms = [...new Set(links.map((l) => l.platform))];
  const missingScheme = links.filter((l) => !l.hasScheme).length;
  const suggestion = !links.length
    ? '외부 링크가 감지되지 않았습니다.'
    : missingScheme > 0
      ? `링크 ${links.length}개 — ${missingScheme}개에 https:// 스킴 누락 (클릭 안 될 수 있음).`
      : `링크 ${links.length}개 · 플랫폼 ${platforms.length}종 (${platforms.join(', ')}).`;
  return { links: links.slice(0, 30), count: links.length, platforms, missingScheme, suggestion };
}

/**
 * 경력 레벨 추정 — estimateExperienceYears 결과 + 액션 동사 강도 + 키워드 성숙도 종합.
 * Junior(0-3y) / Mid(3-7y) / Senior(7+y) / Lead(10+y + "리딩/팀 리드" 키워드 감지).
 */
const LEAD_KEYWORDS = ['리딩', '팀 리드', '팀 리더', '리더십', 'Tech Lead', '테크 리드', '팀장'];

export interface JobLevelEstimate {
  years: number;
  level: 'junior' | 'mid' | 'senior' | 'lead';
  hasLeadKeyword: boolean;
  suggestion: string;
}

export function estimateJobLevel(text: string): JobLevelEstimate {
  const exp = estimateExperienceYears(text);
  const years = exp.totalYears;
  const hasLeadKeyword = LEAD_KEYWORDS.some((k) => text.includes(k));
  let level: JobLevelEstimate['level'];
  if (years >= 10 && hasLeadKeyword) level = 'lead';
  else if (years >= 7) level = 'senior';
  else if (years >= 3) level = 'mid';
  else level = 'junior';
  const suggestion =
    years === 0
      ? '경력 기간이 감지되지 않아 추정 불가.'
      : level === 'lead'
        ? `리드 레벨 (${years}년 + 리딩 경험 키워드 감지).`
        : level === 'senior'
          ? `시니어 레벨 (${years}년). 리딩·멘토링 경험을 강조하면 lead 로 어필 가능.`
          : level === 'mid'
            ? `미드 레벨 (${years}년). 주도 프로젝트·정량 성과로 시니어 발판 마련.`
            : `주니어 레벨 (${years}년). 학습 속도·기여 사례·협업 경험을 부각하세요.`;
  return { years, level, hasLeadKeyword, suggestion };
}

/**
 * 이력서 기반 예상 면접 질문 생성 — 감지된 스킬·경력·상투구를 바탕으로 실제 나올 법한
 * 질문을 룰-기반으로 생성. LLM 없이도 동작하는 가벼운 면접 준비 도우미.
 */
export interface InterviewQuestion {
  question: string;
  category: 'skill' | 'experience' | 'behavioral' | 'project';
  reason: string;
}

export function generateInterviewQuestions(text: string, maxN = 10): InterviewQuestion[] {
  const skills = detectSkillMentions(text, 5);
  const level = estimateJobLevel(text);
  const actionVerbs = analyzeActionVerbs(text);
  const quant = analyzeQuantification(text);
  const questions: InterviewQuestion[] = [];

  // 스킬 기반 질문 (상위 3개)
  for (const s of skills.slice(0, 3)) {
    questions.push({
      question: `${s.skill} 를 사용하며 겪은 가장 어려웠던 문제와 해결 과정은?`,
      category: 'skill',
      reason: `이력서에 ${s.count}회 언급된 핵심 스킬`,
    });
  }

  // 경력 레벨별 맞춤 질문
  if (level.level === 'lead') {
    questions.push({
      question: '팀을 리딩하면서 가장 어려웠던 의사결정은 무엇이었습니까?',
      category: 'behavioral',
      reason: '리드 레벨 — 리더십 검증',
    });
    questions.push({
      question: '구성원 간 갈등을 어떻게 조정했나요?',
      category: 'behavioral',
      reason: '리드 레벨 — 팀 관리',
    });
  } else if (level.level === 'senior') {
    questions.push({
      question: '주니어 엔지니어에게 가장 자주 하는 피드백은 무엇인가요?',
      category: 'behavioral',
      reason: '시니어 — 멘토링 역량',
    });
    questions.push({
      question: '기술 부채를 어떻게 관리해 왔나요?',
      category: 'experience',
      reason: '시니어 — 시스템 판단력',
    });
  } else if (level.level === 'mid') {
    questions.push({
      question: '최근 주도적으로 개선한 프로젝트의 구체 성과는?',
      category: 'project',
      reason: '미드 — 오너십·성과',
    });
  } else {
    questions.push({
      question: '학교/개인 프로젝트에서 가장 배운 점 한 가지만 꼽는다면?',
      category: 'experience',
      reason: '주니어 — 학습 속도',
    });
  }

  // 정량 성과가 부족한 경우
  if (quant.level === 'none' || quant.level === 'low') {
    questions.push({
      question: '이력서에 수치화된 성과가 부족합니다. 가장 인상 깊은 결과를 숫자로 설명해 주세요.',
      category: 'project',
      reason: '정량 지표 부족 → 구체 결과 확인',
    });
  }

  // 액션 동사 약하면 실행력 확인
  if (actionVerbs.strong + actionVerbs.weak >= 3 && actionVerbs.ratio < 0.5) {
    questions.push({
      question: '"담당/참여" 같은 표현이 많은데, 실제로 본인이 주도한 업무는 어느 정도 비율인가요?',
      category: 'behavioral',
      reason: '약한 동사 비율 높음 → 주도성 확인',
    });
  }

  // 기본 행동 질문 (slot filler)
  const fallbacks: InterviewQuestion[] = [
    {
      question: '3년 후 커리어 목표는 무엇인가요?',
      category: 'behavioral',
      reason: '장기 비전',
    },
    {
      question: '실패했던 프로젝트와 배운 점을 말해 주세요.',
      category: 'behavioral',
      reason: '성장 마인드셋',
    },
    {
      question: '다른 팀과의 협업에서 가장 만족스러웠던 경험은?',
      category: 'behavioral',
      reason: '협업 역량',
    },
  ];
  for (const q of fallbacks) {
    if (questions.length >= maxN) break;
    questions.push(q);
  }

  return questions.slice(0, maxN);
}

/**
 * 구체성 점수 — 숫자·고유명사(회사/제품명)·기술 용어 밀도를 종합. 추상적 표현 대비
 * 실체적 근거의 비율. 이력서는 구체성이 신뢰도의 핵심.
 */
export interface SpecificityScore {
  overall: number; // 0~100
  numbers: number; // 숫자 등장 수
  properNouns: number; // 대문자로 시작하는 영문/회사 후보
  techTerms: number; // 기술 스킬 언급 총계
  suggestion: string;
}

export function scoreSpecificity(text: string): SpecificityScore {
  const t = text ?? '';
  const chars = t.length || 1;
  const numbers = (t.match(/\d+/g) ?? []).length;
  // 고유명사: 영문 대문자 시작 2자 이상, 혹은 '네이버/카카오/삼성/LG/쿠팡/토스/배민/당근' 등 주요 한국 기업
  const companyPatterns =
    /(네이버|카카오|삼성|LG|SK|현대|쿠팡|토스|배민|당근|라인|우아한형제|야놀자|무신사|NHN|KT)/g;
  const properEn = (t.match(/\b[A-Z][A-Za-z0-9.]+\b/g) ?? []).length;
  const properKr = (t.match(companyPatterns) ?? []).length;
  const properNouns = properEn + properKr;
  const techTerms = detectSkillMentions(t, 50).reduce((a, s) => a + s.count, 0);

  // 밀도 기반 점수 (100자당)
  const density = ((numbers + properNouns + techTerms) / chars) * 100;
  // 30/100자 이상이면 훌륭, 10/100 미만이면 부족
  let overall = Math.min(100, Math.round(density * 4));
  if (overall < 0) overall = 0;
  const suggestion =
    overall >= 75
      ? '구체성이 우수합니다 — 수치·고유명사·기술 용어가 충분히 드러납니다.'
      : overall >= 45
        ? `구체성 보통 (${overall}점). 회사명·수치·기술 용어를 더 추가하면 신뢰도 상승.`
        : `구체성이 부족합니다 (${overall}점). 추상 표현을 구체 사례·수치로 대체하세요.`;
  return { overall, numbers, properNouns, techTerms, suggestion };
}

/**
 * 활동 시간순 검증 — 이력서·경력 섹션은 최신 → 과거 (역순) 또는 과거 → 최신 (순차)
 * 중 하나로 일관돼야 함. estimateExperienceYears 결과의 시작 연도 순서 검사.
 */
export interface ChronologyCheck {
  order: 'newest-first' | 'oldest-first' | 'mixed' | 'single-or-none';
  isConsistent: boolean;
  ranges: number[]; // 각 구간의 start year 배열 (등장 순서 유지)
  suggestion: string;
}

export function analyzeActivityChronology(text: string): ChronologyCheck {
  const exp = estimateExperienceYears(text);
  const ranges = exp.ranges.map((r) => r.start.year);
  if (ranges.length < 2) {
    return {
      order: 'single-or-none',
      isConsistent: true,
      ranges,
      suggestion: '경력 구간이 2개 미만 — 시간순 검증 불가.',
    };
  }
  // 엄격한 내림차순?
  let newest = true;
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i] > ranges[i - 1]) {
      newest = false;
      break;
    }
  }
  // 엄격한 오름차순?
  let oldest = true;
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i] < ranges[i - 1]) {
      oldest = false;
      break;
    }
  }
  const order: ChronologyCheck['order'] = newest
    ? 'newest-first'
    : oldest
      ? 'oldest-first'
      : 'mixed';
  const isConsistent = order !== 'mixed';
  const suggestion = isConsistent
    ? order === 'newest-first'
      ? '경력이 최신순으로 정렬되어 있습니다 (권장).'
      : '경력이 과거→최신 순. 일반적으로 최신순이 권장됩니다.'
    : `경력 구간(${ranges.join(' → ')})이 일관된 순서가 아닙니다 — 정렬 통일을 권장합니다.`;
  return { order, isConsistent, ranges, suggestion };
}

/**
 * 소프트 스킬 감지 — 기술 스킬(detectSkillMentions) 외 협업·소통·문제해결 역량 키워드.
 * 이력서에 하드/소프트 스킬 균형이 잡혀 있는지 확인.
 */
const SOFT_SKILLS: Array<{ key: string; variants: string[] }> = [
  { key: '협업', variants: ['협업', '협력', '공동 작업', '팀워크', 'teamwork'] },
  { key: '커뮤니케이션', variants: ['커뮤니케이션', '소통', '의사소통', 'communication'] },
  { key: '문제해결', variants: ['문제 해결', '문제해결', '트러블슈팅', 'troubleshooting'] },
  { key: '리더십', variants: ['리더십', '리딩', '팀 리드', '팀장', 'leadership'] },
  { key: '기획', variants: ['기획', '설계', '계획'] },
  { key: '주도성', variants: ['주도', '오너십', '책임감', 'ownership'] },
  { key: '학습', variants: ['학습', '습득', '배움', '자기계발'] },
  { key: '분석', variants: ['분석', '데이터 기반', '인사이트', 'analysis'] },
  { key: '창의성', variants: ['창의', '혁신', '아이디어', 'creative'] },
  { key: '협상', variants: ['협상', '설득', '조율'] },
];

export interface SoftSkillHit {
  skill: string;
  count: number;
}
export interface SoftSkillAnalysis {
  hits: SoftSkillHit[];
  total: number;
  distinctCount: number;
  suggestion: string;
}

export function detectSoftSkills(text: string): SoftSkillAnalysis {
  const t = text ?? '';
  const hits: SoftSkillHit[] = [];
  for (const s of SOFT_SKILLS) {
    let count = 0;
    for (const v of s.variants) {
      const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'gi');
      count += (t.match(re) ?? []).length;
    }
    if (count > 0) hits.push({ skill: s.key, count });
  }
  hits.sort((a, b) => b.count - a.count);
  const total = hits.reduce((a, b) => a + b.count, 0);
  const distinctCount = hits.length;
  const suggestion =
    distinctCount === 0
      ? '소프트 스킬 표현이 감지되지 않았습니다 — 협업·문제해결 경험을 녹여 내세요.'
      : distinctCount >= 5
        ? `소프트 스킬 ${distinctCount}종 · ${total}회 — 균형 잡힌 역량 표현.`
        : `소프트 스킬 ${distinctCount}종만 감지 — 협업/커뮤니케이션/주도성 등 다양화 권장.`;
  return { hits: hits.slice(0, 10), total, distinctCount, suggestion };
}

/**
 * Bullet 마커 일관성 — `-`, `•`, `*`, `▪`, `·` 등 목록 기호가 섞이면 지저분한 인상.
 * 줄 시작 위치에서 각 마커 빈도를 집계하고 혼재 여부 리포트.
 */
export interface BulletMarkerAnalysis {
  markers: Array<{ marker: string; count: number; percent: number }>;
  distinct: number;
  dominant: string | null;
  consistent: boolean;
  suggestion: string;
}

export function analyzeBulletMarkerConsistency(text: string): BulletMarkerAnalysis {
  const t = text ?? '';
  const lines = t.split(/\r?\n/);
  const markerRe = /^\s*([-*•▪·◦▫☆★→▶▸])\s+/;
  const counts = new Map<string, number>();
  for (const l of lines) {
    const m = l.match(markerRe);
    if (m) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  const markers = [...counts.entries()]
    .map(([marker, count]) => ({ marker, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
  const distinct = markers.length;
  const dominant = markers[0]?.marker ?? null;
  const consistent = distinct <= 1;
  const suggestion = !markers.length
    ? 'bullet 목록이 감지되지 않았습니다.'
    : consistent
      ? `bullet 마커가 "${dominant}" 하나로 일관됩니다.`
      : `bullet 마커 ${distinct}종 혼재 (${markers.map((m) => m.marker).join(' ')}) — "${dominant}" 하나로 통일하세요.`;
  return { markers, distinct, dominant, consistent, suggestion };
}

/**
 * 분석기 카탈로그 — 모든 public 분석기의 메타데이터 (이름/카테고리/설명).
 * UI 에서 "사용 가능한 분석기 목록" 도움말 노출, 혹은 LLM 기능 호출 디스커버리에 활용.
 */
export interface AnalyzerInfo {
  name: string;
  category: '문체' | '이력서' | '메타' | '구조' | '보안' | '파생';
  description: string;
}

export const ANALYZERS: readonly AnalyzerInfo[] = [
  // 문체
  { name: 'checkText', category: '문체', description: '맞춤법·어법 오류 검출' },
  {
    name: 'analyzeReadability',
    category: '문체',
    description: '가독성 (문장 길이·단어 길이 기반)',
  },
  { name: 'analyzeLexicalDiversity', category: '문체', description: '어휘 다양성 (TTR)' },
  { name: 'analyzeSentenceEndings', category: '문체', description: '종결어미 변주' },
  { name: 'analyzeRedundancy', category: '문체', description: '근접 반복어' },
  { name: 'detectRepeatedPhrases', category: '문체', description: '반복 N-gram' },
  { name: 'analyzePassiveVoice', category: '문체', description: '수동태 비율' },
  { name: 'analyzeParallelism', category: '문체', description: 'bullet 평행구조' },
  { name: 'analyzeSentenceStarts', category: '문체', description: '문장 시작 변주' },
  { name: 'analyzeFirstPersonUsage', category: '문체', description: '1인칭 대명사 비율' },
  { name: 'analyzeSentiment', category: '문체', description: '긍정/부정 어조' },
  { name: 'analyzeEnglishMix', category: '문체', description: '한영 혼재 비율' },
  { name: 'detectCliches', category: '문체', description: '상투구 검출' },
  { name: 'detectInformalLanguage', category: '문체', description: '비격식 표현' },
  { name: 'detectExaggeration', category: '문체', description: '과장 표현' },
  { name: 'detectJargon', category: '문체', description: '자곤/버즈워드' },
  { name: 'detectDuplicateSentences', category: '문체', description: '중복 문장' },
  { name: 'suggestSynonymsForOveruse', category: '문체', description: '남용 단어 + 동의어' },
  { name: 'suggestVerbReplacements', category: '문체', description: '약한 동사 → 강한 동사' },
  // 이력서 신호
  { name: 'analyzeQuantification', category: '이력서', description: '정량 지표 밀도' },
  { name: 'analyzeActionVerbs', category: '이력서', description: '강/약 동사 비율' },
  { name: 'detectSkillMentions', category: '이력서', description: '기술 스킬 빈도' },
  { name: 'detectSoftSkills', category: '이력서', description: '소프트 스킬 감지' },
  {
    name: 'detectInconsistentCasing',
    category: '이력서',
    description: '기술 용어 대소문자 일관성',
  },
  { name: 'estimateExperienceYears', category: '이력서', description: '총 경력 년수' },
  { name: 'estimateJobLevel', category: '이력서', description: '주니어/미드/시니어/리드' },
  { name: 'scoreSpecificity', category: '이력서', description: '구체성 점수' },
  { name: 'scoreResumeCompleteness', category: '이력서', description: '이력서 완성도' },
  { name: 'detectMissingResumeSections', category: '이력서', description: '누락 섹션' },
  { name: 'analyzeActivityChronology', category: '이력서', description: '시간순 정렬' },
  { name: 'generateInterviewQuestions', category: '이력서', description: '예상 면접 질문' },
  // 메타
  { name: 'estimateReadingTime', category: '메타', description: '예상 읽기 시간' },
  { name: 'analyzeLength', category: '메타', description: '길이·자수 분석' },
  { name: 'analyzeParagraphs', category: '메타', description: '문단 구성' },
  { name: 'extractKeywords', category: '메타', description: '핵심 키워드 추출' },
  { name: 'generateHashtags', category: '메타', description: '해시태그 생성' },
  { name: 'extractLinks', category: '메타', description: '외부 링크 추출' },
  { name: 'detectContactInfo', category: '메타', description: '이메일/전화 추출 및 검증' },
  // 구조
  { name: 'analyzeBulletMarkerConsistency', category: '구조', description: 'bullet 기호 일관성' },
  { name: 'detectAbbreviations', category: '구조', description: '축약어 풀이 누락' },
  { name: 'analyzeDateConsistency', category: '구조', description: '날짜 포맷 일관성' },
  { name: 'validateDateRanges', category: '구조', description: '날짜 범위 유효성' },
  { name: 'analyzeNumericFormat', category: '구조', description: '숫자 포맷 일관성' },
  { name: 'detectWhitespaceAnomalies', category: '구조', description: '공백 이상' },
  { name: 'analyzeBracketBalance', category: '구조', description: '괄호 균형' },
  // 보안
  { name: 'detectPersonalInfo', category: '보안', description: 'PII 검출 (주민·카드·주소)' },
  // 파생 (집계/비교/출력)
  { name: 'generateQualityReport', category: '파생', description: '12개 문체 지표 통합 리포트' },
  { name: 'prioritizeImprovements', category: '파생', description: '개선 우선순위 TOP-K' },
  { name: 'compareReports', category: '파생', description: 'Before/After 리포트 비교' },
  { name: 'applySafeAutoFix', category: '파생', description: '자동수정 + 전후 비교' },
  { name: 'computeJDMatch', category: '파생', description: '이력서 ↔ JD 키워드 매칭' },
  { name: 'exportQualityReportMarkdown', category: '파생', description: 'Markdown 리포트' },
  { name: 'exportQualityReportJson', category: '파생', description: 'JSON 리포트' },
  { name: 'gradeFromScore', category: '파생', description: '점수 → A+/A/B+/B/C/D/F 등급' },
  { name: 'getDimensionScores', category: '파생', description: '12 차원별 점수 배열' },
  { name: 'explainWrongWord', category: '파생', description: '단어별 규칙 설명 조회' },
  { name: 'recommendCoverLetterOpeners', category: '파생', description: '자소서 오프닝 3종 추천' },
  { name: 'countSentencesByEnding', category: '파생', description: '종결어미 타입별 카운트' },
  {
    name: 'analyzeEverything',
    category: '파생',
    description: '모든 분석기 일괄 실행 (단일 진입점)',
  },
  {
    name: 'summarizeAnalysis',
    category: '파생',
    description: 'FullAnalysis 요약 (red/yellow/green 플래그 + 한줄평)',
  },
  { name: 'detectSelfDeprecation', category: '문체', description: '자기비하 표현 검출' },
  { name: 'generateResumeTldr', category: '파생', description: '이력서 3줄 TL;DR 요약' },
  {
    name: 'countCharsByCategory',
    category: '메타',
    description: '문자 카테고리 분포 (한/영/숫자/공백/기호)',
  },
  {
    name: 'detectUnquantifiedClaims',
    category: '이력서',
    description: '수치 없는 성과 문장 검출 (문장 단위)',
  },
  { name: 'generateStarBulletTemplate', category: '파생', description: 'STAR 포맷 bullet 템플릿' },
  {
    name: 'analyzePunctuationBalance',
    category: '구조',
    description: '문장부호 분포 (느낌표·물음표·쉼표)',
  },
  { name: 'extractQuotableLines', category: '파생', description: '인용 가능한 임팩트 문장 Top-N' },
  { name: 'computeTextSimilarity', category: '파생', description: 'Jaccard 텍스트 유사도 비교' },
  { name: 'quickScore', category: '파생', description: '빠른 품질 점수(단일 숫자)' },
  { name: 'detectEmptyClaims', category: '문체', description: '빈 주장(근거 없는 역량 주장) 검출' },
  { name: 'countAchievements', category: '이력서', description: '수상·성취 키워드 밀도' },
  {
    name: 'scoreInterviewability',
    category: '파생',
    description: '면접 콜백 가능성 점수 (0-100)',
  },
  { name: 'detectCareerGaps', category: '이력서', description: '경력 공백(6개월↑) 검출' },
  { name: 'analyzeVerbTense', category: '문체', description: '시제 일관성(과거/현재/미래)' },
  { name: 'detectAllCapsOveruse', category: '구조', description: 'ALL CAPS 영문 단어 과용' },
  { name: 'analyzeCallToAction', category: '이력서', description: '자소서 마무리 CTA 체크' },
  {
    name: 'calculateOverallHealth',
    category: '파생',
    description: '종합 건강도 (품질+완성도+면접) 단일 점수',
  },
  { name: 'splitByExperienceSection', category: '메타', description: '이력서를 섹션별로 분할' },
  {
    name: 'analyzeSectionBalance',
    category: '이력서',
    description: '섹션별 길이 균형 및 과소·과대 섹션 감지',
  },
  {
    name: 'analyzeSectionOrder',
    category: '이력서',
    description: '섹션 배치가 권장 순서(자기소개→경력→프로젝트→기술→학력)에 부합하는지',
  },
  {
    name: 'analyzeSectionDensity',
    category: '이력서',
    description: '섹션별 숫자·액션동사·불릿 밀도 — 강화가 필요한 섹션 식별',
  },
  {
    name: 'computeSectionHealth',
    category: '파생',
    description: '섹션 균형·순서·밀도를 단일 점수로 종합 (섹션 품질 0-100)',
  },
  {
    name: 'analyzeStarPattern',
    category: '이력서',
    description: 'STAR(Situation·Task·Action·Result) 불릿 구조 커버리지',
  },
] as const;

/** 카테고리별 분석기 필터링 — ANALYZERS 카탈로그 디스커버리 헬퍼. */
export function getAnalyzersByCategory(category: AnalyzerInfo['category']): AnalyzerInfo[] {
  return ANALYZERS.filter((a) => a.category === category);
}

/** 이름으로 분석기 조회. */
export function findAnalyzerByName(name: string): AnalyzerInfo | undefined {
  return ANALYZERS.find((a) => a.name === name);
}

/**
 * 축약어 검출 — 확장 없이 사용된 영문 축약어(TLA/FLA) 감지. 심사자가 모를 수 있는 업계
 * 용어의 첫 등장에 풀어 쓴 설명이 동반되었는지 확인.
 */
const COMMON_ACRONYMS = new Set([
  'AI',
  'ML',
  'API',
  'URL',
  'UI',
  'UX',
  'IT',
  'OS',
  'DB',
  'SQL',
  'CSS',
  'HTML',
  'JS',
  'TS',
  'AWS',
  'GCP',
  'CI',
  'CD',
  'PR',
  'QA',
  'KPI',
  'ROI',
  'OKR',
  'PM',
  'TF',
  'BM',
  'FE',
  'BE',
]);

export interface AcronymHit {
  acronym: string;
  index: number;
  hasExpansion: boolean;
}
export interface AcronymAnalysis {
  hits: AcronymHit[];
  unexplained: AcronymHit[];
  suggestion: string;
}

export function detectAbbreviations(text: string): AcronymAnalysis {
  const t = text ?? '';
  const re = /\b([A-Z]{2,5})\b/g;
  const hits: AcronymHit[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const acronym = m[1];
    if (COMMON_ACRONYMS.has(acronym)) continue;
    const after = t.slice(m.index + acronym.length, m.index + acronym.length + 80);
    const hasExpansion = /^\s*[(（][^)）]{3,}[)）]/.test(after);
    hits.push({ acronym, index: m.index, hasExpansion: hasExpansion || seen.has(acronym) });
    seen.add(acronym);
  }
  const unexplained = hits.filter((h) => !h.hasExpansion);
  const suggestion =
    hits.length === 0
      ? '분석 가능한 축약어가 감지되지 않았습니다.'
      : unexplained.length === 0
        ? `축약어 ${hits.length}개 — 모두 처음 등장 시 풀어 쓰여 있거나 일반 용어입니다.`
        : `설명 없이 쓰인 축약어 ${unexplained.length}건 (${unexplained
            .slice(0, 3)
            .map((h) => h.acronym)
            .join(', ')}) — 처음 등장 시 "(풀이)" 를 괄호로 부연 권장.`;
  return { hits: hits.slice(0, 20), unexplained: unexplained.slice(0, 10), suggestion };
}

/**
 * 자기소개서 오프닝 추천 — 이력서에서 상위 스킬 + 경력 레벨을 뽑아 회사·직무에 맞는
 * 3가지 템플릿 문장을 생성. LLM 없이 가벼운 규칙 기반.
 */
export interface OpenerSuggestion {
  style: 'achievement' | 'passion' | 'pragmatic';
  text: string;
}

export function recommendCoverLetterOpeners(
  resumeText: string,
  company: string = '귀사',
  role: string = '해당 포지션',
): OpenerSuggestion[] {
  const skills = detectSkillMentions(resumeText, 3)
    .slice(0, 3)
    .map((s) => s.skill);
  const topSkills = skills.length > 0 ? skills.join(' · ') : '다양한 프로젝트';
  const level = estimateJobLevel(resumeText);
  const years = level.years;
  const yearsText = years > 0 ? `${years}년간 ` : '';

  return [
    {
      style: 'achievement',
      text: `${yearsText}${topSkills}를 바탕으로 실전 성과를 축적해 온 ${level.level === 'junior' ? '개발자 지망생' : '실무자'}로서, ${company}의 ${role}에서 다음 성과를 만들어 가고 싶습니다.`,
    },
    {
      style: 'passion',
      text: `${topSkills}를 통해 사용자에게 직접적인 가치를 전달하는 일이 가장 즐겁습니다. ${company}의 비전이 제 방향과 정확히 맞닿아 ${role}에 지원합니다.`,
    },
    {
      style: 'pragmatic',
      text: `${yearsText}쌓아 온 ${topSkills} 경험이 ${company} ${role}의 현재 과제와 맞물리는 지점을 확인했습니다. 다음 세 가지 영역에서 기여할 수 있습니다.`,
    },
  ];
}

/**
 * 문장 종결 어미 카운트 — 합니다체 vs 다./했다체 vs 요체 문장 수. 문체 통일 가이드에
 * 활용. toneMix 와 비슷하지만 구체적 어미 라벨로 제공.
 */
export interface EndingTypeCount {
  formal: number; // 합니다/했습니다/됩니다 등
  declarative: number; // 다./했다 등 문어체
  polite: number; // 해요/요 등
  other: number;
  total: number;
  dominant: 'formal' | 'declarative' | 'polite' | 'mixed' | 'none';
}

export function countSentencesByEnding(text: string): EndingTypeCount {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) {
    return {
      formal: 0,
      declarative: 0,
      polite: 0,
      other: 0,
      total: 0,
      dominant: 'none',
    };
  }
  const sentences = clean.split(/[.!?。]+/).filter((s) => s.trim().length > 0);
  const counts = { formal: 0, declarative: 0, polite: 0, other: 0 };
  for (const s of sentences) {
    const trimmed = s.trim();
    if (/(습니다|합니다|됩니다|입니다|있습니다|없습니다|드립니다)$/.test(trimmed)) {
      counts.formal++;
    } else if (/(했다|했고|한다|된다|이다|이며|이었다)$/.test(trimmed)) {
      counts.declarative++;
    } else if (/(해요|이에요|예요|세요)$/.test(trimmed)) {
      counts.polite++;
    } else {
      counts.other++;
    }
  }
  const total = sentences.length;
  const buckets: Array<{ k: 'formal' | 'declarative' | 'polite' | 'other'; v: number }> = [
    { k: 'formal', v: counts.formal },
    { k: 'declarative', v: counts.declarative },
    { k: 'polite', v: counts.polite },
    { k: 'other', v: counts.other },
  ];
  buckets.sort((a, b) => b.v - a.v);
  const top = buckets[0];
  let dominant: EndingTypeCount['dominant'] = 'none';
  if (total > 0 && top.v / total >= 0.6 && top.k !== 'other') {
    dominant = top.k;
  } else if (total > 0) {
    dominant = 'mixed';
  }
  return { ...counts, total, dominant };
}

/**
 * 모든 분석기 일괄 실행 — 외부(LLM/admin/API)에서 "텍스트 하나 던지면 전체 품질 진단"
 * 시나리오를 위한 단일 진입점. generateQualityReport 는 12개 핵심만, 이 함수는 50+ 전부.
 */
export interface FullAnalysis {
  quality: KoreanQualityReport;
  contact: ContactInfo;
  sections: ResumeSectionCoverage;
  completeness: ResumeCompletenessScore;
  experience: ExperienceEstimate;
  jobLevel: JobLevelEstimate;
  specificity: SpecificityScore;
  chronology: ChronologyCheck;
  softSkills: SoftSkillAnalysis;
  skills: SkillMention[];
  casing: CasingAnalysis;
  exaggeration: ExaggerationAnalysis;
  pii: PiiAnalysis;
  englishMix: EnglishMixAnalysis;
  sentiment: SentimentAnalysis;
  paragraphs: ParagraphStats;
  firstPerson: FirstPersonAnalysis;
  duplicates: DuplicateSentence[];
  overuse: OveruseWithSynonyms[];
  dates: DateConsistencyAnalysis;
  invalidDates: InvalidDateRange[];
  jargon: JargonAnalysis;
  brackets: BracketBalanceAnalysis;
  whitespace: WhitespaceAnalysis;
  numeric: NumericFormatAnalysis;
  reading: ReadingTimeEstimate;
  links: LinkAnalysis;
  bullets: BulletMarkerAnalysis;
  acronyms: AcronymAnalysis;
  hashtags: string[];
  keywords: ExtractedKeyword[];
  interview: InterviewQuestion[];
  openers: OpenerSuggestion[];
  endings: EndingTypeCount;
  selfDeprecation: SelfDeprecationAnalysis;
  emptyClaims: EmptyClaimAnalysis;
  cta: CallToActionAnalysis;
}

export function analyzeEverything(text: string): FullAnalysis {
  return {
    quality: generateQualityReport(text),
    contact: detectContactInfo(text),
    sections: detectMissingResumeSections(text),
    completeness: scoreResumeCompleteness(text),
    experience: estimateExperienceYears(text),
    jobLevel: estimateJobLevel(text),
    specificity: scoreSpecificity(text),
    chronology: analyzeActivityChronology(text),
    softSkills: detectSoftSkills(text),
    skills: detectSkillMentions(text),
    casing: detectInconsistentCasing(text),
    exaggeration: detectExaggeration(text),
    pii: detectPersonalInfo(text),
    englishMix: analyzeEnglishMix(text),
    sentiment: analyzeSentiment(text),
    paragraphs: analyzeParagraphs(text),
    firstPerson: analyzeFirstPersonUsage(text),
    duplicates: detectDuplicateSentences(text),
    overuse: suggestSynonymsForOveruse(text),
    dates: analyzeDateConsistency(text),
    invalidDates: validateDateRanges(text),
    jargon: detectJargon(text),
    brackets: analyzeBracketBalance(text),
    whitespace: detectWhitespaceAnomalies(text),
    numeric: analyzeNumericFormat(text),
    reading: estimateReadingTime(text),
    links: extractLinks(text),
    bullets: analyzeBulletMarkerConsistency(text),
    acronyms: detectAbbreviations(text),
    hashtags: generateHashtags(text),
    keywords: extractKeywords(text),
    interview: generateInterviewQuestions(text),
    openers: recommendCoverLetterOpeners(text),
    endings: countSentencesByEnding(text),
    selfDeprecation: detectSelfDeprecation(text),
    emptyClaims: detectEmptyClaims(text),
    cta: analyzeCallToAction(text),
  };
}

/**
 * FullAnalysis 요약 — 가장 중요한 신호만 추려 플래그와 한 줄 코멘트로 압축.
 * 긴 리포트를 대시보드 카드 하나에 요약할 때, 혹은 LLM 에 짧은 컨텍스트로 넘길 때 활용.
 */
export interface AnalysisFlag {
  severity: 'red' | 'yellow' | 'green';
  label: string;
  note: string;
}

export function summarizeAnalysis(full: FullAnalysis): {
  overallScore: number;
  completenessScore: number;
  topFlags: AnalysisFlag[];
  oneLiner: string;
} {
  const flags: AnalysisFlag[] = [];

  // PII — 최우선 경고
  if (full.pii.severity === 'critical') {
    flags.push({
      severity: 'red',
      label: 'PII 고위험',
      note: '주민·카드번호 등 민감정보 포함 — 즉시 제거.',
    });
  } else if (full.pii.severity === 'warning') {
    flags.push({
      severity: 'yellow',
      label: '개인정보 노출',
      note: `${full.pii.count}건 — 필요성 재검토.`,
    });
  }

  // 맞춤법 에러
  if (full.quality.check.summary.error > 3) {
    flags.push({
      severity: 'red',
      label: '맞춤법 오류 다수',
      note: `${full.quality.check.summary.error}건 — 자동수정 권장.`,
    });
  }

  // 정량 지표 부재
  if (full.quality.quantification.level === 'none') {
    flags.push({
      severity: 'yellow',
      label: '정량 지표 없음',
      note: '수치 성과가 비어 있음.',
    });
  }

  // 과장 표현
  if (full.exaggeration.level === 'many') {
    flags.push({
      severity: 'yellow',
      label: '과장 표현 다수',
      note: `${full.exaggeration.count}건 — 증거 기반 표현으로.`,
    });
  }

  // 완성도 낮음
  if (full.completeness.overall < 50) {
    flags.push({
      severity: 'red',
      label: '이력서 완성도 낮음',
      note: `${full.completeness.overall}점 — 약한 축: ${
        full.completeness.breakdown.slice().sort((a, b) => a.score - b.score)[0].axis
      }.`,
    });
  } else if (full.completeness.overall >= 85) {
    flags.push({
      severity: 'green',
      label: '완성도 우수',
      note: `${full.completeness.overall}점.`,
    });
  }

  // 날짜 오류
  if (full.invalidDates.length > 0) {
    flags.push({
      severity: 'red',
      label: '날짜 범위 오류',
      note: `${full.invalidDates.length}건 — 시작 > 종료.`,
    });
  }

  // 연락처 유효성
  const invalidContacts =
    full.contact.emails.filter((e) => !e.valid).length +
    full.contact.phones.filter((p) => !p.valid).length;
  if (invalidContacts > 0) {
    flags.push({
      severity: 'yellow',
      label: '연락처 오류',
      note: `잘못된 형식 ${invalidContacts}건.`,
    });
  }

  // 자기비하 표현
  if (full.selfDeprecation.level === 'many') {
    flags.push({
      severity: 'yellow',
      label: '자기비하 과다',
      note: `${full.selfDeprecation.count}건 — 자신감 있는 표현으로.`,
    });
  }

  // 빈 주장(근거 없는 역량)
  if (full.emptyClaims.level === 'many') {
    flags.push({
      severity: 'yellow',
      label: '근거 없는 주장 다수',
      note: `${full.emptyClaims.count}건 — 사례·수치로 증명 필요.`,
    });
  }

  // 마무리 CTA 부재 (본문 500자↑ 인 경우에만 체크)
  if (!full.cta.hasCTA && full.reading.chars >= 500) {
    flags.push({
      severity: 'yellow',
      label: '마무리 CTA 없음',
      note: '마지막 문단에 "기여하겠습니다" 같은 행동 유발 마무리 추가.',
    });
  }

  // 품질 점수 총평
  if (full.quality.overallScore >= 85) {
    flags.push({
      severity: 'green',
      label: '한국어 품질 우수',
      note: `${full.quality.overallScore}점.`,
    });
  } else if (full.quality.overallScore < 55) {
    flags.push({
      severity: 'red',
      label: '한국어 품질 미흡',
      note: `${full.quality.overallScore}점 — 우선 개선 필요.`,
    });
  }

  // 중복 7개까지만 상위로
  flags.sort((a, b) => {
    const rank = { red: 0, yellow: 1, green: 2 };
    return rank[a.severity] - rank[b.severity];
  });
  const topFlags = flags.slice(0, 7);
  const red = topFlags.filter((f) => f.severity === 'red').length;
  const yellow = topFlags.filter((f) => f.severity === 'yellow').length;
  const green = topFlags.filter((f) => f.severity === 'green').length;
  const oneLiner = `종합 ${full.quality.overallScore}점 · 완성도 ${full.completeness.overall}점 · 🔴 ${red} 🟡 ${yellow} 🟢 ${green}`;

  return {
    overallScore: full.quality.overallScore,
    completenessScore: full.completeness.overall,
    topFlags,
    oneLiner,
  };
}

/**
 * 자기비하 표현 검출 — 이력서·자소서에 "부족하지만/미흡하나/혹시/실례지만/드려도 될까요"
 * 같은 지나친 겸양은 자신감 결여 신호. 한국 직장문화에서도 공식 문서는 자신감 있게.
 */
const SELF_DEPRECATION_PATTERNS: Array<{ re: RegExp; phrase: string; reason: string }> = [
  {
    re: /부족하지만/g,
    phrase: '부족하지만',
    reason: '자신감 결여 표현 — "충실히 준비했습니다" 등으로 전환.',
  },
  {
    re: /미흡하[지나]/g,
    phrase: '미흡하지만/미흡하나',
    reason: '자기비하. 구체 근거로 역량을 제시하세요.',
  },
  { re: /(?<![가-힣])혹시(?![가-힣])/g, phrase: '혹시', reason: '불확실성 표현. 단정적으로 서술.' },
  { re: /실례[지되][만만]/g, phrase: '실례지만', reason: '공식 문서에 과잉 겸양.' },
  {
    re: /폐[가를 ]?끼치[지면]/g,
    phrase: '폐를 끼치',
    reason: '부정적 뉘앙스. 긍정적 가치 전달로.',
  },
  {
    re: /많은\s*부족함/g,
    phrase: '많은 부족함',
    reason: '자기 결함 강조 — 성장 가능성으로 재구성.',
  },
  { re: /잘\s*모르지만/g, phrase: '잘 모르지만', reason: '무지 인정 — 학습 의지로 전환.' },
  { re: /서투르지만/g, phrase: '서투르지만', reason: '기술 부족 인정 — 배움의 자세로 표현.' },
];

export interface SelfDeprecationHit {
  phrase: string;
  index: number;
  reason: string;
}
export interface SelfDeprecationAnalysis {
  hits: SelfDeprecationHit[];
  count: number;
  level: 'none' | 'few' | 'many';
  suggestion: string;
}

export function detectSelfDeprecation(text: string): SelfDeprecationAnalysis {
  const t = text ?? '';
  const hits: SelfDeprecationHit[] = [];
  for (const p of SELF_DEPRECATION_PATTERNS) {
    const re = new RegExp(p.re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      hits.push({ phrase: p.phrase, index: m.index, reason: p.reason });
      if (hits.length > 30) break;
    }
    if (hits.length > 30) break;
  }
  hits.sort((a, b) => a.index - b.index);
  const count = hits.length;
  const level: SelfDeprecationAnalysis['level'] =
    count === 0 ? 'none' : count <= 2 ? 'few' : 'many';
  const suggestion =
    level === 'none'
      ? '자기비하 표현이 감지되지 않았습니다.'
      : level === 'few'
        ? `자기비하 ${count}건 — 자신감 있는 표현으로 교체하세요.`
        : `자기비하가 ${count}건으로 많습니다. 공식 문서에서는 성과·학습 의지 중심으로 재작성하세요.`;
  return { hits: hits.slice(0, 20), count, level, suggestion };
}

/**
 * 이력서 3줄 요약(TL;DR) — 감지된 총 경력 / 상위 스킬 3종 / 경력 레벨 + 완성도 점수를
 * 가벼운 템플릿 문장으로 조합. 리쿠르터 스카우트 메시지 / 이력서 헤드라인 초안용.
 */
export function generateResumeTldr(text: string): {
  lines: string[];
  summary: string;
} {
  const level = estimateJobLevel(text);
  const skills = detectSkillMentions(text, 3)
    .slice(0, 3)
    .map((s) => s.skill);
  const completeness = scoreResumeCompleteness(text);
  const softSkills = detectSoftSkills(text);

  const levelLabel =
    level.level === 'lead'
      ? '리드'
      : level.level === 'senior'
        ? '시니어'
        : level.level === 'mid'
          ? '미드'
          : '주니어';
  const skillPart = skills.length > 0 ? skills.join(' · ') : '다양한 기술';
  const softPart =
    softSkills.hits
      .slice(0, 2)
      .map((h) => h.skill)
      .join('·') || '학습 의지';

  const yearsText = level.years > 0 ? `${level.years}년` : '경력 초기';
  const lines = [
    `${yearsText} 경험의 ${levelLabel} 레벨.`,
    `${skillPart} 를 중심으로 실전 프로젝트를 수행.`,
    `${softPart} 에 강점이 있는 동시에 이력서 완성도 ${completeness.overall}점.`,
  ];
  return { lines, summary: lines.join(' ') };
}

/**
 * 문자 카테고리별 분포 — 한글/영문/숫자/공백/기타 기호 비율을 계산.
 * 외국어 이력서·영문 CV 간 비교, 또는 "너무 영문 많음" / "숫자 과다" 등 힌트에 활용.
 */
export interface CharDistribution {
  total: number;
  korean: number;
  english: number;
  digits: number;
  whitespace: number;
  punctuation: number;
  other: number;
  percents: {
    korean: number;
    english: number;
    digits: number;
    whitespace: number;
    punctuation: number;
    other: number;
  };
}

export function countCharsByCategory(text: string): CharDistribution {
  const t = text ?? '';
  let korean = 0;
  let english = 0;
  let digits = 0;
  let whitespace = 0;
  let punctuation = 0;
  let other = 0;
  for (const ch of t) {
    if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(ch)) korean++;
    else if (/[A-Za-z]/.test(ch)) english++;
    else if (/[0-9]/.test(ch)) digits++;
    else if (/\s/.test(ch)) whitespace++;
    else if (/[.,!?;:()"'`\-·\u3000「」『』《》〈〉]/.test(ch)) punctuation++;
    else other++;
  }
  const total = t.length || 1;
  const p = (n: number) => Math.round((n / total) * 1000) / 10; // 한 자리 소수
  return {
    total,
    korean,
    english,
    digits,
    whitespace,
    punctuation,
    other,
    percents: {
      korean: p(korean),
      english: p(english),
      digits: p(digits),
      whitespace: p(whitespace),
      punctuation: p(punctuation),
      other: p(other),
    },
  };
}

/**
 * 수치화 누락 청구 검출 — "개선/향상/달성/증가/감소" 같은 성과 동사가 등장하는 문장에서
 * 수치(%·배수·기간·금액)가 함께 있지 않으면 "구체화 필요" 문장으로 리포트.
 * analyzeQuantification 은 전체 밀도를 평가하고, 이 함수는 문장 단위로 정확히 짚음.
 */
const ACHIEVEMENT_VERBS = [
  '개선',
  '향상',
  '달성',
  '증가',
  '감소',
  '단축',
  '절감',
  '상승',
  '하락',
  '확장',
  '성장',
  '기여',
  '창출',
  '극복',
  '최적화',
  '구현',
  '구축',
];

export interface UnquantifiedClaim {
  sentence: string;
  verb: string;
  index: number;
  reason: string;
}

export function detectUnquantifiedClaims(text: string): UnquantifiedClaim[] {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean.split(/[.!?。]+/).filter((s) => s.trim().length > 0);
  const results: UnquantifiedClaim[] = [];
  let cursor = 0;
  const quantRe =
    /\d+(?:[.,]\d+)?\s*(?:%|배|퍼센트|년|개월|달|주|일|시간|원|건|명|회|차|번)|상위\s*\d+|TOP\s*\d+/;
  for (const raw of sentences) {
    const trimmed = raw.trim();
    const idx = clean.indexOf(trimmed, cursor);
    if (idx >= 0) cursor = idx + trimmed.length;
    for (const v of ACHIEVEMENT_VERBS) {
      if (trimmed.includes(v)) {
        if (!quantRe.test(trimmed)) {
          results.push({
            sentence: trimmed,
            verb: v,
            index: idx,
            reason: `"${v}" 성과 표현에 수치가 없습니다 — %·배수·기간 등을 추가하세요.`,
          });
          break;
        }
      }
    }
    if (results.length >= 15) break;
  }
  return results;
}

/**
 * STAR 포맷 bullet 템플릿 생성 — 스킬·경력 기반으로 "상황·과제·행동·결과" 구조의
 * 빈 템플릿을 뽑아줌. 이력서 경력 섹션 bullet 작성에 가이드로 활용.
 */
export interface StarBulletTemplate {
  skill: string;
  template: string;
  prompts: { situation: string; task: string; action: string; result: string };
}

export function generateStarBulletTemplate(skill: string, context?: string): StarBulletTemplate {
  const ctx = context?.trim() || '해당 프로젝트';
  return {
    skill,
    template: `[${ctx}] 상황에서 [문제/기회] 를 발견, ${skill} 를 활용해 [구체 행동] 을 수행, [수치 결과] 를 달성.`,
    prompts: {
      situation: `어떤 ${ctx}? (회사·팀 규모·기간)`,
      task: `왜 해결이 필요했는가? (문제의 크기·임팩트)`,
      action: `${skill} 로 구체적으로 무엇을 했는가? (자기가 주도한 부분)`,
      result: '성과를 수치로 표현 (%·배수·기간·비용)',
    },
  };
}

/**
 * 문장부호 분포 분석 — 마침표/쉼표/물음표/느낌표 비율. 느낌표 과다 · 쉼표 부족(짧은 문장)
 * · 물음표 많음(확신 부족) 같은 신호를 포착.
 */
export interface PunctuationBalance {
  periods: number;
  commas: number;
  questions: number;
  exclamations: number;
  total: number;
  commasPerSentence: number;
  suggestion: string;
}

export function analyzePunctuationBalance(text: string): PunctuationBalance {
  const t = text ?? '';
  const periods = (t.match(/[.。]/g) ?? []).length;
  const commas = (t.match(/[,，]/g) ?? []).length;
  const questions = (t.match(/[?？]/g) ?? []).length;
  const exclamations = (t.match(/[!！]/g) ?? []).length;
  const total = periods + commas + questions + exclamations;
  const sentences = Math.max(1, periods + questions + exclamations);
  const commasPerSentence = Math.round((commas / sentences) * 100) / 100;

  let suggestion = '';
  if (total === 0) suggestion = '문장부호가 감지되지 않았습니다.';
  else if (exclamations > sentences * 0.3)
    suggestion = `느낌표 과다 (${exclamations}/${sentences}) — 공식 문서 톤으로 줄이세요.`;
  else if (questions > sentences * 0.2)
    suggestion = `물음표가 많습니다 (${questions}) — 확신 있는 서술형으로 재구성.`;
  else if (commasPerSentence < 0.3 && sentences > 5)
    suggestion = `쉼표 사용이 적습니다 (문장당 ${commasPerSentence}) — 긴 문장에 쉼표로 호흡을 주세요.`;
  else suggestion = `문장부호 분포 정상 (문장당 쉼표 ${commasPerSentence}).`;
  return { periods, commas, questions, exclamations, total, commasPerSentence, suggestion };
}

/**
 * 인용 가능한 문장(Quotable Lines) 추출 — 수치·고유명사·강한 동사를 포함한 임팩트 있는
 * 문장 Top-N. 소셜 카드 / 포트폴리오 헤드라인 / 추천사 스타일 하이라이트에 활용.
 */
export interface QuotableLine {
  sentence: string;
  score: number;
  signals: { hasNumber: boolean; hasStrongVerb: boolean; hasProper: boolean };
}

const STRONG_VERBS_QUOTABLE = [
  '주도',
  '달성',
  '개선',
  '출시',
  '구축',
  '혁신',
  '최적화',
  '단축',
  '절감',
  '증가',
  '성장',
  '구현',
];

export function extractQuotableLines(text: string, topN = 3): QuotableLine[] {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean
    .split(/[.!?。]+/)
    .filter((s) => s.trim().length > 20 && s.trim().length < 200);
  const results: QuotableLine[] = [];
  for (const raw of sentences) {
    const s = raw.trim();
    const hasNumber =
      /\d+(?:[.,]\d+)?\s*(?:%|배|년|개월|주|일|시간|원|건|명|회|차|번)|상위\s*\d+/.test(s);
    const hasStrongVerb = STRONG_VERBS_QUOTABLE.some((v) => s.includes(v));
    const hasProper =
      /\b[A-Z][A-Za-z0-9.]+\b/.test(s) ||
      /(네이버|카카오|삼성|LG|SK|현대|쿠팡|토스|배민|당근|라인|NHN|KT)/.test(s);
    let score = 0;
    if (hasNumber) score += 3;
    if (hasStrongVerb) score += 2;
    if (hasProper) score += 1;
    if (score === 0) continue;
    // 문장 길이 적절(40~120자)에 보너스
    if (s.length >= 40 && s.length <= 120) score += 1;
    results.push({
      sentence: s,
      score,
      signals: { hasNumber, hasStrongVerb, hasProper },
    });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topN);
}

/**
 * 두 텍스트 간 Jaccard 유사도 — 키워드 집합 교집합/합집합 기반. 0~1.
 * 1에 가까울수록 유사. 이력서 버전 간 변화 감지 · 복붙 의심 판정에 활용.
 */
export interface TextSimilarityResult {
  jaccard: number; // 0~1
  shared: string[]; // 공통 키워드 상위 10
  uniqueA: string[]; // a 에만 있는 상위 10
  uniqueB: string[]; // b 에만 있는 상위 10
  verdict: '거의 동일' | '매우 유사' | '유사' | '다름' | '매우 다름';
}

export function computeTextSimilarity(a: string, b: string): TextSimilarityResult {
  const kwA = new Set(extractKeywords(a ?? '', 100).map((k) => k.word));
  const kwB = new Set(extractKeywords(b ?? '', 100).map((k) => k.word));
  const intersection = [...kwA].filter((w) => kwB.has(w));
  const union = new Set([...kwA, ...kwB]);
  const jaccard =
    union.size === 0 ? 0 : Math.round((intersection.length / union.size) * 1000) / 1000;
  const uniqueA = [...kwA].filter((w) => !kwB.has(w)).slice(0, 10);
  const uniqueB = [...kwB].filter((w) => !kwA.has(w)).slice(0, 10);
  const verdict: TextSimilarityResult['verdict'] =
    jaccard >= 0.9
      ? '거의 동일'
      : jaccard >= 0.7
        ? '매우 유사'
        : jaccard >= 0.4
          ? '유사'
          : jaccard >= 0.2
            ? '다름'
            : '매우 다름';
  return { jaccard, shared: intersection.slice(0, 10), uniqueA, uniqueB, verdict };
}

/**
 * 빠른 품질 점수 조회 — 전체 리포트(generateQualityReport) 생성 비용 대비 단순 숫자만
 * 필요한 경우(대량 배치, 목록 정렬 등)에 사용. checkText 의 score 를 직접 리턴.
 */
export function quickScore(text: string): number {
  return checkText(text, '본문').score;
}

/**
 * 빈 주장(empty claim) 감지 — "~를 잘 알고 있습니다", "~에 대한 이해가 깊습니다",
 * "~에 자신 있습니다" 같이 근거 없이 자기 능력을 주장하는 표현 검출. detectExaggeration
 * 과 다른 축 — 과장이 아닌 "모호한 역량 주장".
 */
const EMPTY_CLAIM_PATTERNS: Array<{ re: RegExp; phrase: string; reason: string }> = [
  {
    re: /잘\s*(?:알|이해하|다룰)/g,
    phrase: '잘 알고 있다',
    reason: '구체 예시로 "어떻게 아는지" 증명.',
  },
  {
    re: /(?:대한|에\s*대한)\s*이해가?\s*(?:깊|풍부)/g,
    phrase: '대한 이해가 깊다',
    reason: '프로젝트·결과로 이해 수준을 증명.',
  },
  { re: /자신\s*(?:있|있습)/g, phrase: '자신 있다', reason: '구체 사례 제시.' },
  {
    re: /(?:전문|능숙|숙련)\s*합(?:니다|임)/g,
    phrase: '전문/능숙/숙련',
    reason: '연수·프로젝트·산출물 링크로 증명.',
  },
  { re: /꼼꼼(?:하|함)/g, phrase: '꼼꼼함', reason: '체크리스트·QA 사례로 증명.' },
  {
    re: /탁월한?\s*(?:역량|능력|실력)/g,
    phrase: '탁월한 역량/능력',
    reason: '수치·비교 사례 필요.',
  },
];

export interface EmptyClaimHit {
  phrase: string;
  index: number;
  reason: string;
}
export interface EmptyClaimAnalysis {
  hits: EmptyClaimHit[];
  count: number;
  level: 'none' | 'few' | 'many';
  suggestion: string;
}

export function detectEmptyClaims(text: string): EmptyClaimAnalysis {
  const t = text ?? '';
  const hits: EmptyClaimHit[] = [];
  for (const p of EMPTY_CLAIM_PATTERNS) {
    const re = new RegExp(p.re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      hits.push({ phrase: p.phrase, index: m.index, reason: p.reason });
      if (hits.length > 30) break;
    }
    if (hits.length > 30) break;
  }
  hits.sort((a, b) => a.index - b.index);
  const count = hits.length;
  const level: EmptyClaimAnalysis['level'] = count === 0 ? 'none' : count <= 2 ? 'few' : 'many';
  const suggestion =
    level === 'none'
      ? '빈 주장이 감지되지 않았습니다.'
      : level === 'few'
        ? `빈 주장 ${count}건 — 각 표현에 증거(수치·사례·산출물) 1개씩 덧붙이세요.`
        : `빈 주장이 ${count}건으로 많습니다. "잘 안다/자신 있다" 같은 주장은 구체 사례로 증명하세요.`;
  return { hits: hits.slice(0, 20), count, level, suggestion };
}

/**
 * 수상·성취 카운트 — "수상/1등/1위/금상/대상/입상/장학금/우수상/최우수/선정/인증/자격증"
 * 등 객관적 성취 흔적의 빈도 집계. 이력서 "실적 밀도" 지표.
 */
const ACHIEVEMENT_KEYWORDS = [
  '수상',
  '1등',
  '1위',
  '금상',
  '대상',
  '입상',
  '장학금',
  '우수상',
  '최우수',
  '선정',
  '인증',
  '자격증',
  '합격',
  '당선',
  '우승',
  '개최',
];

export interface AchievementCount {
  total: number;
  byKeyword: Array<{ keyword: string; count: number }>;
  density: number; // 100자당 수
  level: 'low' | 'medium' | 'high';
  suggestion: string;
}

export function countAchievements(text: string): AchievementCount {
  const t = text ?? '';
  const byKeyword: Array<{ keyword: string; count: number }> = [];
  let total = 0;
  for (const k of ACHIEVEMENT_KEYWORDS) {
    const re = new RegExp(k, 'g');
    const matches = t.match(re);
    if (matches) {
      byKeyword.push({ keyword: k, count: matches.length });
      total += matches.length;
    }
  }
  byKeyword.sort((a, b) => b.count - a.count);
  const chars = t.length || 1;
  const density = Math.round((total / chars) * 10000) / 100; // per 100 chars
  let level: AchievementCount['level'];
  if (total === 0) level = 'low';
  else if (density >= 0.8) level = 'high';
  else if (density >= 0.3) level = 'medium';
  else level = 'low';
  const suggestion =
    total === 0
      ? '객관적 성취 키워드가 감지되지 않았습니다 — 수상·자격증·선정 이력을 추가하세요.'
      : level === 'high'
        ? `성취 표현이 풍부합니다 (${total}건).`
        : level === 'medium'
          ? `성취 ${total}건 — 조금 더 구체 이력(대회·자격증)을 추가하면 임팩트 상승.`
          : `성취 키워드가 적습니다 (${total}건). 수상·인증·선정 경험 추가 검토.`;
  return { total, byKeyword: byKeyword.slice(0, 10), density, level, suggestion };
}

/**
 * 면접 적합도(interviewability) 점수 — 이력서를 본 리쿠르터가 면접으로 부를 확률을
 * 근사하는 0~100 지표. 5개 축 가중 합산.
 *   - 구체성(수치·고유명사·기술) 30%
 *   - 정량 지표 20%
 *   - 액션 동사 비율 15%
 *   - 수상·성취 밀도 15%
 *   - 섹션 완성도 20%
 * 일부러 문체(맞춤법·가독성)는 제외 — 본질적 "채용 가치" 에 집중.
 */
export interface InterviewabilityScore {
  overall: number; // 0-100
  breakdown: Array<{ axis: string; value: number; weight: number }>;
  tier: 'call-back' | 'promising' | 'needs-work' | 'below-bar';
  suggestion: string;
}

export function scoreInterviewability(text: string): InterviewabilityScore {
  const spec = scoreSpecificity(text);
  const quant = analyzeQuantification(text);
  const verbs = analyzeActionVerbs(text);
  const achievements = countAchievements(text);
  const sections = detectMissingResumeSections(text);

  const quantValue =
    quant.level === 'high' ? 100 : quant.level === 'medium' ? 70 : quant.level === 'low' ? 40 : 10;
  const verbsValue = verbs.strong + verbs.weak < 3 ? 50 : Math.round(verbs.ratio * 100);
  const achievementsValue =
    achievements.level === 'high'
      ? 100
      : achievements.level === 'medium'
        ? 65
        : achievements.total > 0
          ? 35
          : 10;
  const sectionsValue = Math.round(sections.coverageRatio * 100);

  const breakdown = [
    { axis: '구체성', value: spec.overall, weight: 0.3 },
    { axis: '정량 지표', value: quantValue, weight: 0.2 },
    { axis: '액션 동사', value: verbsValue, weight: 0.15 },
    { axis: '수상·성취', value: achievementsValue, weight: 0.15 },
    { axis: '섹션 완성도', value: sectionsValue, weight: 0.2 },
  ];
  const overall = Math.round(breakdown.reduce((a, b) => a + b.value * b.weight, 0));
  let tier: InterviewabilityScore['tier'];
  if (overall >= 80) tier = 'call-back';
  else if (overall >= 60) tier = 'promising';
  else if (overall >= 40) tier = 'needs-work';
  else tier = 'below-bar';
  const weakest = [...breakdown].sort((a, b) => a.value - b.value)[0];
  const suggestion =
    tier === 'call-back'
      ? '면접 콜백 가능성 높음 — 강력한 이력서입니다.'
      : tier === 'promising'
        ? `유망 (${overall}점). 약한 축: ${weakest.axis} (${weakest.value}) 보강 시 콜백률 상승.`
        : tier === 'needs-work'
          ? `보완 필요 (${overall}점). ${weakest.axis} (${weakest.value}) 를 먼저 개선하세요.`
          : `면접 문턱 미달 (${overall}점). 섹션 완성도·정량 지표·구체 경험을 전면 재작성 권장.`;
  return { overall, breakdown, tier, suggestion };
}

/**
 * 경력 공백(gap) 검출 — estimateExperienceYears 로 추출한 기간들의 시작~종료를 시간순으로
 * 정렬 후 인접 구간 사이에 6개월 이상 공백이 있으면 리포트. 채용 심사 시 설명 필요한 신호.
 */
export interface CareerGap {
  from: { year: number; month: number };
  to: { year: number; month: number };
  gapMonths: number;
  severity: 'minor' | 'notable' | 'major';
}
export interface CareerGapAnalysis {
  gaps: CareerGap[];
  totalGapMonths: number;
  suggestion: string;
}

export function detectCareerGaps(text: string): CareerGapAnalysis {
  const exp = estimateExperienceYears(text);
  if (exp.ranges.length < 2) {
    return {
      gaps: [],
      totalGapMonths: 0,
      suggestion: '2개 이상 경력 구간이 있어야 공백 분석 가능.',
    };
  }
  const sorted = [...exp.ranges].sort(
    (a, b) => a.start.year * 12 + a.start.month - (b.start.year * 12 + b.start.month),
  );
  const gaps: CareerGap[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = sorted[i - 1].end;
    const curStart = sorted[i].start;
    const gapMonths = curStart.year * 12 + curStart.month - (prevEnd.year * 12 + prevEnd.month) - 1;
    if (gapMonths >= 6) {
      gaps.push({
        from: prevEnd,
        to: curStart,
        gapMonths,
        severity: gapMonths >= 24 ? 'major' : gapMonths >= 12 ? 'notable' : 'minor',
      });
    }
  }
  const totalGapMonths = gaps.reduce((a, b) => a + b.gapMonths, 0);
  const suggestion =
    gaps.length === 0
      ? '경력 공백이 감지되지 않았습니다.'
      : `${gaps.length}개 공백 (총 ${totalGapMonths}개월) — 이력서 또는 면접 답변으로 설명 준비 필요.`;
  return { gaps, totalGapMonths, suggestion };
}

/**
 * 시제 일관성 분석 — 경력 섹션은 과거시제 통일이 권장됨(현재 재직 중 제외).
 * 본문에서 과거/현재/미래 시제 동사 비율을 집계해 혼재 여부 판단.
 */
export interface TenseAnalysis {
  past: number; // 했/었/았 등
  present: number; // 한다/합니다/이다
  future: number; // 할/할 것
  total: number;
  dominant: 'past' | 'present' | 'future' | 'mixed' | 'none';
  suggestion: string;
}

export function analyzeVerbTense(text: string): TenseAnalysis {
  const t = text ?? '';
  const past = (t.match(/(?:했|였|었|았|왔|갔|봤|냈)(?:습니다|다|고|으며|음|었다)/g) ?? []).length;
  const present = (
    t.match(/(?:합니다|입니다|됩니다|있습니다|없습니다|한다|된다)(?=[.!?\s]|$)/g) ?? []
  ).length;
  const future = (t.match(/(?:할|될)\s*(?:것|예정|계획)/g) ?? []).length;
  const total = past + present + future;
  if (total === 0) {
    return {
      past: 0,
      present: 0,
      future: 0,
      total: 0,
      dominant: 'none',
      suggestion: '동사 시제가 감지되지 않았습니다.',
    };
  }
  const buckets = [
    { k: 'past' as const, v: past },
    { k: 'present' as const, v: present },
    { k: 'future' as const, v: future },
  ].sort((a, b) => b.v - a.v);
  const top = buckets[0];
  const dominant: TenseAnalysis['dominant'] = top.v / total >= 0.7 ? top.k : 'mixed';
  const suggestion =
    dominant === 'mixed'
      ? `시제가 섞여 있습니다 (과거 ${past} · 현재 ${present} · 미래 ${future}) — 경력 기술은 과거시제로 통일.`
      : dominant === 'past'
        ? '과거시제로 일관 — 경력 기술의 표준 톤.'
        : dominant === 'present'
          ? `현재시제 우세 (${present}건) — 경력 기술은 과거시제 전환 권장.`
          : `미래시제 우세 (${future}건) — 입사 후 계획 외에는 과거시제로.`;
  return { past, present, future, total, dominant, suggestion };
}

/**
 * ALL CAPS 과용 검출 — 축약어가 아닌 일반 영문 단어를 대문자로만 쓰면 소리치는 인상.
 * 3자 이상 일반 단어 + COMMON_ACRONYMS 아님 + 문장 시작 대문자 아님.
 */
export interface AllCapsHit {
  word: string;
  index: number;
}
export interface AllCapsAnalysis {
  hits: AllCapsHit[];
  count: number;
  suggestion: string;
}

export function detectAllCapsOveruse(text: string): AllCapsAnalysis {
  const t = text ?? '';
  const hits: AllCapsHit[] = [];
  const re = /\b([A-Z]{3,})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const word = m[1];
    if (COMMON_ACRONYMS.has(word)) continue;
    // 6자 이상이면 축약어 아닐 가능성 높음, 5자 이하면 더 엄격하게 필터
    if (word.length < 6 && /^(?:[A-Z][a-z]+)+$/.test(word)) continue;
    hits.push({ word, index: m.index });
    if (hits.length > 30) break;
  }
  const count = hits.length;
  const suggestion =
    count === 0
      ? 'ALL CAPS 과용 없음.'
      : count <= 2
        ? `ALL CAPS ${count}건 — 일반 단어는 소문자/Title Case 로.`
        : `ALL CAPS ${count}건 — "소리치는 인상"을 주므로 축약어 외엔 피하세요.`;
  return { hits: hits.slice(0, 20), count, suggestion };
}

/**
 * 클로징 CTA 검출 — 자소서 마지막 문단에 "기여/함께하겠습니다/기대하겠습니다" 같은
 * 행동 유발 마무리가 있는지 확인. 이력서·자소서 마지막 인상 체크.
 */
const CTA_PATTERNS = [
  /기여하(?:고 싶|겠)/,
  /함께(?:하고 싶|하겠)/,
  /성장하(?:고 싶|겠)/,
  /만들어\s*가(?:고 싶|겠)/,
  /도전하(?:고 싶|겠)/,
  /이바지하/,
  /합류하(?:고 싶|기)/,
  /기대하(?:고 있|겠)/,
  /감사합니다/,
];

export interface CallToActionAnalysis {
  hasCTA: boolean;
  matched: string[];
  lastParagraph: string;
  suggestion: string;
}

export function analyzeCallToAction(text: string): CallToActionAnalysis {
  const t = (text ?? '').trim();
  if (!t) {
    return { hasCTA: false, matched: [], lastParagraph: '', suggestion: '본문이 비어 있습니다.' };
  }
  const paragraphs = t.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const lastParagraph = (paragraphs[paragraphs.length - 1] ?? '').trim();
  const matched: string[] = [];
  for (const re of CTA_PATTERNS) {
    const m = lastParagraph.match(re);
    if (m) matched.push(m[0]);
  }
  const hasCTA = matched.length > 0;
  const suggestion = hasCTA
    ? `마지막 문단에 CTA 표현 ${matched.length}건 감지 — "${matched[0]}" 등 행동 유발 마무리가 있습니다.`
    : '마지막 문단에 명시적 CTA(기여/함께/성장/도전/감사합니다) 가 없습니다 — 인상적인 마무리를 추가하세요.';
  return { hasCTA, matched, lastParagraph: lastParagraph.slice(0, 100), suggestion };
}

/**
 * 종합 건강도 점수 — 3대 축(품질 overallScore / 완성도 / 면접 적합도) 가중 평균으로
 * "이 이력서·자소서의 전반적 준비도" 0~100 단일 숫자 제시. 리스트 정렬·대시보드 요약용.
 */
export interface OverallHealth {
  health: number;
  quality: number;
  completeness: number;
  interviewability: number;
  tier: 'excellent' | 'good' | 'fair' | 'poor';
}

export function calculateOverallHealth(text: string): OverallHealth {
  const quality = generateQualityReport(text).overallScore;
  const completeness = scoreResumeCompleteness(text).overall;
  const interviewability = scoreInterviewability(text).overall;
  // 가중: 문체 30%, 완성도 30%, 면접 40%
  const health = Math.round(quality * 0.3 + completeness * 0.3 + interviewability * 0.4);
  const tier: OverallHealth['tier'] =
    health >= 85 ? 'excellent' : health >= 70 ? 'good' : health >= 50 ? 'fair' : 'poor';
  return { health, quality, completeness, interviewability, tier };
}

/**
 * 이력서 텍스트를 섹션별로 분할 — 표준 섹션 제목(경력/학력/기술/프로젝트/자기소개) 을
 * 기준으로 본문을 쪼개 section → content 맵 생성. 섹션 단위 분석의 기반.
 */
export interface SplitSection {
  key: string;
  heading: string;
  content: string;
  index: number;
}

const SECTION_HEADING_PATTERNS: Array<{ key: string; re: RegExp }> = [
  { key: '자기소개', re: /^[\s#=]*(자기\s?소개(?:서)?|프로필|Profile|About\s?Me|Summary)\s*$/im },
  { key: '경력', re: /^[\s#=]*(경력\s?사항|경력|근무\s?경력|Career|Work\s?Experience)\s*$/im },
  { key: '학력', re: /^[\s#=]*(학력\s?사항|학력|학업|Education)\s*$/im },
  { key: '기술', re: /^[\s#=]*(기술\s?스택|보유\s?기술|스킬|기술|Skills|Tech\s?Stack)\s*$/im },
  {
    key: '프로젝트',
    re: /^[\s#=]*(프로젝트(?:\s?경험)?|주요\s?프로젝트|Projects?|Portfolio)\s*$/im,
  },
  { key: '자격증', re: /^[\s#=]*(자격증|자격|Certifications?)\s*$/im },
  { key: '수상', re: /^[\s#=]*(수상\s?경력|수상|Awards?)\s*$/im },
];

export function splitByExperienceSection(text: string): SplitSection[] {
  const t = text ?? '';
  if (!t.trim()) return [];
  const lines = t.split(/\r?\n/);
  const sections: SplitSection[] = [];
  let currentKey = '';
  let currentHeading = '';
  let currentStart = 0;
  let buffer: string[] = [];
  const flush = (endIdx: number) => {
    if (currentKey) {
      sections.push({
        key: currentKey,
        heading: currentHeading,
        content: buffer.join('\n').trim(),
        index: endIdx,
      });
    }
    buffer = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matched = SECTION_HEADING_PATTERNS.find((p) => p.re.test(line));
    if (matched) {
      flush(currentStart);
      currentKey = matched.key;
      currentHeading = line.trim();
      currentStart = i;
      continue;
    }
    buffer.push(line);
  }
  flush(currentStart);
  return sections;
}

export interface SectionBalanceIssue {
  key: string;
  chars: number;
  kind: 'too_short' | 'too_long' | 'dominant';
  message: string;
}

export interface SectionBalanceReport {
  sections: Array<{ key: string; chars: number; sharePct: number }>;
  totalChars: number;
  issues: SectionBalanceIssue[];
  balanceScore: number;
  verdict: 'balanced' | 'skewed' | 'lopsided';
}

/**
 * 섹션별 길이 균형 분석 — splitByExperienceSection 결과를 기반으로
 * 과소(<80자)·과대(>2000자) 섹션 및 한 섹션이 전체의 60% 이상을 차지하는 쏠림을 감지.
 * 균형 점수(0-100) = 100 - (최대섹션 비중 편차 + 과소섹션 페널티).
 */
export function analyzeSectionBalance(text: string): SectionBalanceReport {
  const parts = splitByExperienceSection(text);
  const sections = parts.map((p) => ({ key: p.key, chars: p.content.length }));
  const totalChars = sections.reduce((acc, s) => acc + s.chars, 0);
  const issues: SectionBalanceIssue[] = [];
  const enriched = sections.map((s) => ({
    ...s,
    sharePct: totalChars > 0 ? Math.round((s.chars / totalChars) * 100) : 0,
  }));
  if (sections.length === 0 || totalChars === 0) {
    return {
      sections: enriched,
      totalChars,
      issues,
      balanceScore: 0,
      verdict: 'lopsided',
    };
  }
  const SHORT_MIN = 80;
  const LONG_MAX = 2000;
  for (const s of enriched) {
    if (s.chars > 0 && s.chars < SHORT_MIN) {
      issues.push({
        key: s.key,
        chars: s.chars,
        kind: 'too_short',
        message: `${s.key} 섹션이 ${s.chars}자로 너무 짧습니다 (최소 ${SHORT_MIN}자 권장)`,
      });
    }
    if (s.chars > LONG_MAX) {
      issues.push({
        key: s.key,
        chars: s.chars,
        kind: 'too_long',
        message: `${s.key} 섹션이 ${s.chars}자로 과도하게 깁니다 (${LONG_MAX}자 이하 권장)`,
      });
    }
    if (s.sharePct >= 60 && sections.length >= 2) {
      issues.push({
        key: s.key,
        chars: s.chars,
        kind: 'dominant',
        message: `${s.key} 섹션이 전체의 ${s.sharePct}%를 차지해 다른 섹션과 균형이 맞지 않습니다`,
      });
    }
  }
  const maxShare = enriched.reduce((m, s) => Math.max(m, s.sharePct), 0);
  const idealShare = 100 / sections.length;
  const shareDeviation = Math.abs(maxShare - idealShare);
  const shortPenalty = issues.filter((i) => i.kind === 'too_short').length * 10;
  const balanceScore = Math.max(0, Math.min(100, Math.round(100 - shareDeviation - shortPenalty)));
  const verdict: SectionBalanceReport['verdict'] =
    balanceScore >= 75 ? 'balanced' : balanceScore >= 50 ? 'skewed' : 'lopsided';
  return { sections: enriched, totalChars, issues, balanceScore, verdict };
}

export interface SectionOrderReport {
  current: string[];
  recommended: string[];
  misplaced: Array<{ key: string; currentIndex: number; idealIndex: number }>;
  isOptimal: boolean;
  score: number;
}

const RECOMMENDED_SECTION_ORDER = [
  '자기소개',
  '경력',
  '프로젝트',
  '기술',
  '학력',
  '자격증',
  '수상',
] as const;

/**
 * 섹션 배치 순서 평가 — splitByExperienceSection 결과를 권장 순서와 비교.
 * 권장: 자기소개→경력→프로젝트→기술→학력→자격증→수상.
 * score = 100 × (1 - 역전쌍 비율). 역전쌍 = (i<j 인데 ideal[i] > ideal[j])인 모든 쌍.
 */
export function analyzeSectionOrder(text: string): SectionOrderReport {
  const parts = splitByExperienceSection(text);
  const current = parts.map((p) => p.key);
  const currentSet = new Set<string>(current);
  const recommended: string[] = (RECOMMENDED_SECTION_ORDER as readonly string[]).filter((k) =>
    currentSet.has(k),
  );
  if (current.length <= 1) {
    return {
      current,
      recommended,
      misplaced: [],
      isOptimal: true,
      score: 100,
    };
  }
  const idealIndexMap = new Map<string, number>();
  RECOMMENDED_SECTION_ORDER.forEach((k, i) => idealIndexMap.set(k, i));
  const idealPositions = current.map((k) => idealIndexMap.get(k) ?? 99);
  let inversions = 0;
  let totalPairs = 0;
  for (let i = 0; i < idealPositions.length; i++) {
    for (let j = i + 1; j < idealPositions.length; j++) {
      totalPairs++;
      if (idealPositions[i] > idealPositions[j]) inversions++;
    }
  }
  const misplaced: SectionOrderReport['misplaced'] = [];
  for (let i = 0; i < current.length; i++) {
    const key = current[i];
    const idealIndex = recommended.indexOf(key);
    if (idealIndex >= 0 && idealIndex !== i) {
      misplaced.push({ key, currentIndex: i, idealIndex });
    }
  }
  const score = totalPairs === 0 ? 100 : Math.round(100 * (1 - inversions / totalPairs));
  return {
    current,
    recommended,
    misplaced,
    isOptimal: inversions === 0,
    score,
  };
}

export interface SectionDensity {
  key: string;
  chars: number;
  numbers: number;
  actionVerbs: number;
  bullets: number;
  density: number;
  needsBoost: boolean;
  hint?: string;
}

const SECTION_DENSITY_ACTION_VERBS = [
  '개발',
  '구축',
  '설계',
  '구현',
  '개선',
  '최적화',
  '리팩터',
  '리팩토',
  '도입',
  '주도',
  '운영',
  '운용',
  '관리',
  '리드',
  '담당',
  '분석',
  '기획',
  '제안',
  '제작',
  '배포',
  '자동화',
  '통합',
  '마이그',
];

const SECTION_DENSITY_BULLET_RE = /^[\s]*[-•·▶►◆◇□■★☆*·]/gm;
const SECTION_DENSITY_NUMBER_RE = /\d+(?:[.,]\d+)?(?:%|배|시간|분|초|건|명|개|회|원|만|억|천)?/g;

/**
 * 섹션별 구체성 밀도 — 숫자·액션동사·불릿의 per-100-char 밀도를 계산.
 * density 가 0.8 미만인 섹션은 needsBoost=true 로 표시하고 섹션별 힌트 제공.
 */
export function analyzeSectionDensity(text: string): SectionDensity[] {
  const parts = splitByExperienceSection(text);
  return parts.map((p) => {
    const chars = p.content.length;
    const numbers = (p.content.match(SECTION_DENSITY_NUMBER_RE) ?? []).length;
    const actionVerbs = SECTION_DENSITY_ACTION_VERBS.reduce(
      (acc, v) => acc + (p.content.match(new RegExp(v, 'g'))?.length ?? 0),
      0,
    );
    const bullets = (p.content.match(SECTION_DENSITY_BULLET_RE) ?? []).length;
    const signalCount = numbers + actionVerbs + bullets;
    const density = chars > 0 ? +((signalCount / chars) * 100).toFixed(2) : 0;
    const isExperienceLike = p.key === '경력' || p.key === '프로젝트' || p.key === '자기소개';
    const needsBoost = isExperienceLike && chars >= 120 && density < 0.8;
    let hint: string | undefined;
    if (needsBoost) {
      if (numbers < 2) hint = `${p.key}: 정량 지표(숫자·%·기간)가 부족합니다`;
      else if (actionVerbs < 2) hint = `${p.key}: 액션 동사(개발·개선·도입 등)를 추가하세요`;
      else if (bullets === 0) hint = `${p.key}: 불릿으로 성과를 구조화하세요`;
      else hint = `${p.key}: 구체적 성과 기술이 부족합니다`;
    }
    return { key: p.key, chars, numbers, actionVerbs, bullets, density, needsBoost, hint };
  });
}

export interface StarBulletResult {
  bullet: string;
  hasSituation: boolean;
  hasTask: boolean;
  hasAction: boolean;
  hasResult: boolean;
  score: number;
}

export interface StarPatternReport {
  total: number;
  analyzed: number;
  coverage: number;
  fullStarCount: number;
  avgScore: number;
  results: StarBulletResult[];
  tier: 'excellent' | 'good' | 'fair' | 'poor';
}

const STAR_BULLET_LINE_RE = /^[\s]*[-•·▶►◆◇□■★☆*][\s]+/;
const STAR_SITUATION_CUES =
  /(당시|기존|상황|환경|문제|이슈|배경|어려움|복잡|비효율|레거시|장애|리스크)/;
const STAR_TASK_CUES = /(담당|맡아|역할|책임|목표|과제|미션|필요|요구|원했|계획|목적)/;
const STAR_ACTION_CUES =
  /(개발|구축|설계|구현|도입|개선|최적화|리팩터|리팩토|자동화|통합|마이그|리드|주도|제안|적용|활용|분석)/;
const STAR_RESULT_CUES =
  /(\d+\s*(?:%|배|시간|분|초|건|명|개|회|원|만|억|천)|달성|절감|향상|증가|감소|단축|확보|성공|성과|효과|개선율|수주|수상)/;

/**
 * STAR(Situation·Task·Action·Result) 불릿 구조 분석 — LinkedIn·원티드 이력서 가이드 표준.
 * 불릿 각 줄을 4가지 시그널 큐(한국어 패턴)로 검사해 score(0-4)·coverage(%) 산출.
 * coverage = 4개 모두 충족한 불릿 비율. tier: ≥75 excellent, ≥50 good, ≥25 fair, else poor.
 */
export function analyzeStarPattern(text: string): StarPatternReport {
  const t = text ?? '';
  if (!t.trim()) {
    return {
      total: 0,
      analyzed: 0,
      coverage: 0,
      fullStarCount: 0,
      avgScore: 0,
      results: [],
      tier: 'poor',
    };
  }
  const lines = t.split(/\r?\n/);
  const bullets = lines.filter((l) => STAR_BULLET_LINE_RE.test(l));
  const analyzed = bullets.filter((b) => b.length >= 20);
  const results: StarBulletResult[] = analyzed.map((raw) => {
    const bullet = raw.replace(STAR_BULLET_LINE_RE, '').trim();
    const hasSituation = STAR_SITUATION_CUES.test(bullet);
    const hasTask = STAR_TASK_CUES.test(bullet);
    const hasAction = STAR_ACTION_CUES.test(bullet);
    const hasResult = STAR_RESULT_CUES.test(bullet);
    const score =
      (hasSituation ? 1 : 0) + (hasTask ? 1 : 0) + (hasAction ? 1 : 0) + (hasResult ? 1 : 0);
    return { bullet, hasSituation, hasTask, hasAction, hasResult, score };
  });
  const fullStarCount = results.filter((r) => r.score === 4).length;
  const coverage = analyzed.length === 0 ? 0 : Math.round((fullStarCount / analyzed.length) * 100);
  const avgScore =
    analyzed.length === 0
      ? 0
      : +(results.reduce((acc, r) => acc + r.score, 0) / analyzed.length).toFixed(2);
  const tier: StarPatternReport['tier'] =
    coverage >= 75 ? 'excellent' : coverage >= 50 ? 'good' : coverage >= 25 ? 'fair' : 'poor';
  return {
    total: bullets.length,
    analyzed: analyzed.length,
    coverage,
    fullStarCount,
    avgScore,
    results,
    tier,
  };
}

export interface SectionHealth {
  overall: number;
  balanceScore: number;
  orderScore: number;
  densityScore: number;
  tier: 'excellent' | 'good' | 'fair' | 'poor';
  topHints: string[];
}

/**
 * 섹션 품질 종합 점수 — analyzeSectionBalance + analyzeSectionOrder + analyzeSectionDensity
 * 세 축을 균등 가중 평균(1:1:1)해 0-100 overall 산출.
 * 각 분석기에서 나온 이슈·힌트를 묶어 topHints (최대 3개) 로 리포트.
 */
export function computeSectionHealth(text: string): SectionHealth {
  const balance = analyzeSectionBalance(text);
  const order = analyzeSectionOrder(text);
  const density = analyzeSectionDensity(text);
  const densityItems = density.filter((d) => d.chars > 0);
  const boostCount = densityItems.filter((d) => d.needsBoost).length;
  const densityScore =
    densityItems.length === 0 ? 0 : Math.round(100 * (1 - boostCount / densityItems.length));
  const overall = Math.round((balance.balanceScore + order.score + densityScore) / 3);
  const tier: SectionHealth['tier'] =
    overall >= 85 ? 'excellent' : overall >= 70 ? 'good' : overall >= 50 ? 'fair' : 'poor';
  const hints: string[] = [];
  for (const issue of balance.issues) hints.push(issue.message);
  if (!order.isOptimal && order.misplaced.length > 0) {
    const first = order.misplaced[0];
    hints.push(
      `${first.key} 섹션 위치 조정 권장 (현재 ${first.currentIndex + 1}번째 → 권장 ${first.idealIndex + 1}번째)`,
    );
  }
  for (const d of densityItems) {
    if (d.hint) hints.push(d.hint);
  }
  return {
    overall,
    balanceScore: balance.balanceScore,
    orderScore: order.score,
    densityScore,
    tier,
    topHints: hints.slice(0, 3),
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanContext(c: string): string {
  return c.replace(/\s+/g, ' ').trim();
}
