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
    pattern: /\s개재/g,
    wrong: '개재',
    suggestion: '게재',
    reason: '"신문·잡지에 싣다"는 "게재(揭載)"입니다.',
    severity: 'error',
  },
  {
    pattern: /\s일일히/g,
    wrong: '일일히',
    suggestion: '일일이',
    reason: '표준어는 "일일이"입니다.',
    severity: 'error',
  },
  {
    pattern: /\s깨끗히/g,
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
    pattern: /\s치루/g,
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
    pattern: /\s어떻해/g,
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
    pattern: /맞추/g,
    wrong: '맞추',
    suggestion: '맞히 (정답) / 맞추 (조립)',
    reason: '정답을 말하면 "맞히다", 부품을 끼우면 "맞추다".',
    severity: 'info',
  },
  // ── 외래어/영문 한글 표기 (자주 틀림) ────────────────
  {
    pattern: /매니지먼트/g,
    wrong: '매니지먼트',
    suggestion: '매니지먼트(관리)',
    reason: '한국어로 바꿔쓸 수 있으면 한국어 권장.',
    severity: 'info',
  },
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
    pattern: /\s있다가/g,
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
  {
    pattern: /\s왠만/g,
    wrong: '왠만',
    suggestion: '웬만',
    reason: '"어지간한"의 뜻은 "웬만"입니다.',
    severity: 'error',
  },
  {
    pattern: /맞추어/g,
    wrong: '맞추어',
    suggestion: '맞춰',
    reason: '"맞추어"의 줄임은 "맞춰"입니다 (구어체).',
    severity: 'info',
  },
  {
    pattern: /\s몇번/g,
    wrong: '몇번',
    suggestion: '몇 번',
    reason: '"번"은 의존명사 — 띄어 씁니다.',
    severity: 'warning',
  },
  {
    pattern: /\s몇가지/g,
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
];

export function checkKorean(resume: Resume): KoreanCheckResult {
  const issues: KoreanIssue[] = [];
  let formalCount = 0;
  let politeCount = 0;
  let totalSentences = 0;

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
  ];

  for (const { name, text } of sections) {
    if (!text) continue;

    // 맞춤법 검사
    for (const rule of RULES) {
      const matches = text.matchAll(rule.pattern);
      for (const m of matches) {
        const idx = m.index ?? 0;
        const context = text.slice(Math.max(0, idx - 15), Math.min(text.length, idx + 20));
        issues.push({
          context: cleanContext(context),
          wrong: rule.wrong,
          suggestion: rule.suggestion,
          reason: rule.reason,
          severity: rule.severity,
          section: name,
        });
      }
    }

    // 문체 혼용 감지
    const sentences = text.split(/[.!?]|\n/).filter((s) => s.trim().length > 5);
    totalSentences += sentences.length;
    for (const s of sentences) {
      if (/습니다[.!?]?\s*$|합니다[.!?]?\s*$|입니다[.!?]?\s*$/.test(s.trim())) formalCount++;
      if (/해요[.!?]?\s*$|에요[.!?]?\s*$|예요[.!?]?\s*$/.test(s.trim())) politeCount++;
    }
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
    });
  }

  return {
    issues,
    toneMix: { formal: formalCount, polite: politeCount, dominant },
    totalSentences,
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

/** 외부 확장 (테스트·진단용) — 현재 등록된 규칙 수 */
export const KOREAN_RULE_COUNT = RULES.length;

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
    },
    totalChanges,
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
