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
// 문장 구조 분석기는 ./sentenceStructure 로 분리됨 (아키텍처 리팩터).
import {
  analyzeSentenceEndings as _analyzeSentenceEndings,
  analyzeSentenceStarts as _analyzeSentenceStarts,
  analyzePassiveVoice as _analyzePassiveVoice,
  type SentenceEndingAnalysis as _SentenceEndingAnalysis,
  type SentenceStartAnalysis as _SentenceStartAnalysis,
  type PassiveVoiceAnalysis as _PassiveVoiceAnalysis,
} from './sentenceStructure';
export {
  analyzeSentenceEndings,
  analyzeSentenceStarts,
  analyzePassiveVoice,
} from './sentenceStructure';
export type {
  SentenceEndingAnalysis,
  SentenceStartAnalysis,
  PassiveVoiceAnalysis,
} from './sentenceStructure';
type SentenceEndingAnalysis = _SentenceEndingAnalysis;
type SentenceStartAnalysis = _SentenceStartAnalysis;
type PassiveVoiceAnalysis = _PassiveVoiceAnalysis;
const analyzeSentenceEndings = _analyzeSentenceEndings;
const analyzeSentenceStarts = _analyzeSentenceStarts;
const analyzePassiveVoice = _analyzePassiveVoice;

// 반복·중복 분석기는 ./repetitionAnalyzers 로 분리됨 (아키텍처 리팩터).
import {
  analyzeLexicalDiversity as _analyzeLexicalDiversity,
  analyzeRedundancy as _analyzeRedundancy,
  detectDuplicateSentences as _detectDuplicateSentences,
  type LexicalDiversityAnalysis as _LexicalDiversityAnalysis,
  type RedundancyAnalysis as _RedundancyAnalysis,
  type DuplicateSentence as _DuplicateSentence,
} from './repetitionAnalyzers';
export {
  analyzeLexicalDiversity,
  analyzeRedundancy,
  detectRepeatedPhrases,
  detectDuplicateSentences,
} from './repetitionAnalyzers';
export type {
  LexicalDiversityAnalysis,
  RedundancyHit,
  RedundancyAnalysis,
  RepeatedPhrase,
  DuplicateSentence,
} from './repetitionAnalyzers';
type LexicalDiversityAnalysis = _LexicalDiversityAnalysis;
type RedundancyAnalysis = _RedundancyAnalysis;
type DuplicateSentence = _DuplicateSentence;
const analyzeLexicalDiversity = _analyzeLexicalDiversity;
const analyzeRedundancy = _analyzeRedundancy;
const detectDuplicateSentences = _detectDuplicateSentences;

// 가독성·길이·종결어미 분석기는 ./readabilityAnalyzers 로 분리됨 (아키텍처 리팩터).
import {
  analyzeReadability as _analyzeReadability,
  countSentencesByEnding as _countSentencesByEnding,
  type ReadabilityAnalysis as _ReadabilityAnalysis,
  type EndingTypeCount as _EndingTypeCount,
} from './readabilityAnalyzers';
export { analyzeReadability, analyzeLength, countSentencesByEnding } from './readabilityAnalyzers';
export type { ReadabilityAnalysis, LengthAnalysis, EndingTypeCount } from './readabilityAnalyzers';
type ReadabilityAnalysis = _ReadabilityAnalysis;
type EndingTypeCount = _EndingTypeCount;
const analyzeReadability = _analyzeReadability;
const countSentencesByEnding = _countSentencesByEnding;

// 성취 신호(정량·액션동사·수상) 분석기는 ./achievementSignals 로 분리됨 (아키텍처 리팩터).
import {
  analyzeQuantification as _analyzeQuantification,
  analyzeActionVerbs as _analyzeActionVerbs,
  countAchievements as _countAchievements,
  type QuantificationAnalysis as _QuantificationAnalysis,
  type ActionVerbAnalysis as _ActionVerbAnalysis,
} from './achievementSignals';
export { analyzeQuantification, analyzeActionVerbs, countAchievements } from './achievementSignals';
export type {
  QuantificationAnalysis,
  ActionVerbAnalysis,
  AchievementCount,
} from './achievementSignals';
type QuantificationAnalysis = _QuantificationAnalysis;
type ActionVerbAnalysis = _ActionVerbAnalysis;
const analyzeQuantification = _analyzeQuantification;
const analyzeActionVerbs = _analyzeActionVerbs;

const countAchievements = _countAchievements;

// 언어 위험 분석기(상투구·자곤·과장) 는 ./languageRisks 로 분리됨 (아키텍처 리팩터).
import {
  detectCliches as _detectCliches,
  detectJargon as _detectJargon,
  detectExaggeration as _detectExaggeration,
  type ClicheAnalysis as _ClicheAnalysis,
  type JargonAnalysis as _JargonAnalysis,
  type ExaggerationAnalysis as _ExaggerationAnalysis,
} from './languageRisks';
export { detectCliches, detectJargon, detectExaggeration } from './languageRisks';
export type {
  ClicheHit,
  ClicheAnalysis,
  JargonAnalysis,
  ExaggerationHit,
  ExaggerationAnalysis,
} from './languageRisks';
type ClicheAnalysis = _ClicheAnalysis;
type JargonAnalysis = _JargonAnalysis;
type ExaggerationAnalysis = _ExaggerationAnalysis;
const detectCliches = _detectCliches;
const detectJargon = _detectJargon;
const detectExaggeration = _detectExaggeration;

/**
 * 문장 시작 반복 — "저는/제가" 등 같은 단어로 시작하는 문장이 연속되면 단조로움.
 * 이력서·자소서에서 특히 자주 발생. 상위 3개 시작 단어 빈도 반환.
 */
// 목록·불릿·문장부호 분석기는 ./bulletStructure 로 분리됨 (아키텍처 리팩터).
import {
  analyzeParallelism as _analyzeParallelism,
  analyzeBulletMarkerConsistency as _analyzeBulletMarkerConsistency,
  type ParallelismAnalysis as _ParallelismAnalysis,
  type BulletMarkerAnalysis as _BulletMarkerAnalysis,
} from './bulletStructure';
export {
  analyzeParallelism,
  analyzeBulletMarkerConsistency,
  analyzePunctuationBalance,
} from './bulletStructure';
export type {
  ParallelismAnalysis,
  BulletMarkerAnalysis,
  PunctuationBalance,
} from './bulletStructure';
type ParallelismAnalysis = _ParallelismAnalysis;
type BulletMarkerAnalysis = _BulletMarkerAnalysis;
const analyzeParallelism = _analyzeParallelism;
const analyzeBulletMarkerConsistency = _analyzeBulletMarkerConsistency;

// 키워드·JD·스킬 분석기는 ./jdKeywords 로 분리됨 (아키텍처 리팩터).
import {
  extractKeywords as _extractKeywords,
  detectSkillMentions as _detectSkillMentions,
  type ExtractedKeyword as _ExtractedKeyword,
  type SkillMention as _SkillMention,
} from './jdKeywords';
export { extractKeywords, computeJDMatch, detectSkillMentions } from './jdKeywords';
export type { ExtractedKeyword, JDMatchResult, SkillMention } from './jdKeywords';
type ExtractedKeyword = _ExtractedKeyword;
type SkillMention = _SkillMention;
const extractKeywords = _extractKeywords;
const detectSkillMentions = _detectSkillMentions;

// 단어·동사 제안은 ./wordSuggestions 로 분리됨 (아키텍처 리팩터).
import {
  suggestSynonymsForOveruse as _suggestSynonymsForOveruse,
  type OveruseWithSynonyms as _OveruseWithSynonyms,
} from './wordSuggestions';
export {
  suggestVerbReplacements,
  suggestSynonyms,
  suggestSynonymsForOveruse,
} from './wordSuggestions';
export type {
  VerbReplacementSuggestion,
  SynonymSuggestion,
  OveruseWithSynonyms,
} from './wordSuggestions';
type OveruseWithSynonyms = _OveruseWithSynonyms;
const suggestSynonymsForOveruse = _suggestSynonymsForOveruse;

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

// 날짜 포맷 분석기는 ./dateAnalyzers 로 분리됨 (아키텍처 리팩터).
import {
  analyzeDateConsistency as _analyzeDateConsistency,
  type DateConsistencyAnalysis as _DateConsistencyAnalysis,
} from './dateAnalyzers';
export { analyzeDateConsistency } from './dateAnalyzers';
export type { DateFormatHit, DateConsistencyAnalysis } from './dateAnalyzers';
type DateConsistencyAnalysis = _DateConsistencyAnalysis;
const analyzeDateConsistency = _analyzeDateConsistency;

// 괄호 균형 + 공백 이상 분석기는 ./textFormat 으로 분리됨 (아키텍처 리팩터).
import {
  analyzeBracketBalance as _analyzeBracketBalance,
  detectWhitespaceAnomalies as _detectWhitespaceAnomalies,
  type BracketBalanceAnalysis as _BracketBalanceAnalysis,
  type WhitespaceAnalysis as _WhitespaceAnalysis,
} from './textFormat';
export { analyzeBracketBalance, detectWhitespaceAnomalies } from './textFormat';
export type { BracketBalanceAnalysis, WhitespaceAnomaly, WhitespaceAnalysis } from './textFormat';
type BracketBalanceAnalysis = _BracketBalanceAnalysis;
type WhitespaceAnalysis = _WhitespaceAnalysis;
const analyzeBracketBalance = _analyzeBracketBalance;
const detectWhitespaceAnomalies = _detectWhitespaceAnomalies;

// 숫자 포맷 분석기는 ./numericFormat 으로 분리됨 (아키텍처 리팩터).
import {
  analyzeNumericFormat as _analyzeNumericFormat,
  type NumericFormatAnalysis as _NumericFormatAnalysis,
} from './numericFormat';
export { analyzeNumericFormat } from './numericFormat';
export type { NumericFormatAnalysis } from './numericFormat';
type NumericFormatAnalysis = _NumericFormatAnalysis;
const analyzeNumericFormat = _analyzeNumericFormat;

// 기술 용어 대소문자 분석기는 ./techCasing 으로 분리됨 (아키텍처 리팩터).
import {
  detectInconsistentCasing as _detectInconsistentCasing,
  type CasingAnalysis as _CasingAnalysis,
} from './techCasing';
export { detectInconsistentCasing } from './techCasing';
export type { CasingHit, CasingAnalysis } from './techCasing';
type CasingAnalysis = _CasingAnalysis;
const detectInconsistentCasing = _detectInconsistentCasing;

// 문단·톤·인칭·언어 혼합 분석기는 ./toneAnalyzers 로 분리됨 (아키텍처 리팩터).
import {
  analyzeParagraphs as _analyzeParagraphs,
  analyzeFirstPersonUsage as _analyzeFirstPersonUsage,
  analyzeEnglishMix as _analyzeEnglishMix,
  analyzeSentiment as _analyzeSentiment,
  type ParagraphStats as _ParagraphStats,
  type FirstPersonAnalysis as _FirstPersonAnalysis,
  type EnglishMixAnalysis as _EnglishMixAnalysis,
  type SentimentAnalysis as _SentimentAnalysis,
} from './toneAnalyzers';
export {
  analyzeParagraphs,
  analyzeFirstPersonUsage,
  analyzeEnglishMix,
  analyzeSentiment,
} from './toneAnalyzers';
export type {
  ParagraphStats,
  FirstPersonAnalysis,
  EnglishMixAnalysis,
  SentimentAnalysis,
} from './toneAnalyzers';
type ParagraphStats = _ParagraphStats;

type FirstPersonAnalysis = _FirstPersonAnalysis;
type EnglishMixAnalysis = _EnglishMixAnalysis;
type SentimentAnalysis = _SentimentAnalysis;
const analyzeParagraphs = _analyzeParagraphs;
const analyzeFirstPersonUsage = _analyzeFirstPersonUsage;
const analyzeEnglishMix = _analyzeEnglishMix;
const analyzeSentiment = _analyzeSentiment;

// detectDuplicateSentences 는 ./repetitionAnalyzers 로 이동됨.

/**
 * 경력 연도 범위 추출 — "2020.01 ~ 2023.12", "2020년 1월 ~ 2023년 12월", "2020 - 2023"
 * 같은 기간 표기를 찾아 총 경력 개월 수·년수로 환산.
 */
// 경력 기간·범위 분석기는 ./experience 로 분리됨 (아키텍처 리팩터).
import {
  estimateExperienceYears as _estimateExperienceYears,
  validateDateRanges as _validateDateRanges,
  type ExperienceEstimate as _ExperienceEstimate,
  type InvalidDateRange as _InvalidDateRange,
} from './experience';
export { estimateExperienceYears, validateDateRanges } from './experience';
export type { ExperienceRange, ExperienceEstimate, InvalidDateRange } from './experience';
type ExperienceEstimate = _ExperienceEstimate;
type InvalidDateRange = _InvalidDateRange;
const estimateExperienceYears = _estimateExperienceYears;
const validateDateRanges = _validateDateRanges;

// 연락처·PII 분석기는 ./pii 로 분리됨 (아키텍처 리팩터).
import {
  detectContactInfo as _detectContactInfo,
  detectPersonalInfo as _detectPersonalInfo,
  type ContactInfo as _ContactInfo,
  type PiiAnalysis as _PiiAnalysis,
} from './pii';
export { detectContactInfo, detectPersonalInfo } from './pii';
export type { ContactInfo, PiiHit, PiiAnalysis } from './pii';
type ContactInfo = _ContactInfo;
type PiiAnalysis = _PiiAnalysis;
const detectContactInfo = _detectContactInfo;
const detectPersonalInfo = _detectPersonalInfo;

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

// 섹션 분석기는 ./sectionAnalyzers 로 분리됨 — splitByExperienceSection,
// analyzeSectionBalance/Order/Density, computeSectionHealth 및 관련 타입은 그곳에서 re-export.
export {
  splitByExperienceSection,
  analyzeSectionBalance,
  analyzeSectionOrder,
  analyzeSectionDensity,
  computeSectionHealth,
} from './sectionAnalyzers';
export type {
  SplitSection,
  SectionBalanceIssue,
  SectionBalanceReport,
  SectionOrderReport,
  SectionDensity,
  SectionHealth,
} from './sectionAnalyzers';

// STAR 분석기는 ./starPattern 으로 분리됨 (아키텍처 리팩터).
export { analyzeStarPattern } from './starPattern';
export type { StarBulletResult, StarPatternReport } from './starPattern';

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
