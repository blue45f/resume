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
  {
    pattern: /\s금새/g,
    wrong: '금새',
    suggestion: '금세',
    reason: '"지금 바로"의 뜻은 "금세"가 맞습니다.',
    severity: 'error',
  },
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
