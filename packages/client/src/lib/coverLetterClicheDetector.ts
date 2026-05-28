export type ClicheCategory =
  | 'effort' // 성실/최선/노력
  | 'passion' // 열정/도전/꿈
  | 'attitude' // 적극적/긍정적/책임감
  | 'teamwork' // 협업/소통 (when vague)
  | 'closing' // 기회를 주신다면/뽑아주신다면
  | 'self-intro' // 안녕하세요/저는 ~입니다
  | 'family' // 가족같은/하나의 가족
  | 'generic-en'; // English filler ("team player", "passionate about")

export type ClicheSeverity = 'high' | 'medium' | 'low';

export type ClicheTone = 'good' | 'neutral' | 'warning';

export interface ClicheHit {
  category: ClicheCategory;
  severity: ClicheSeverity;
  match: string;
  excerpt: string;
  /** Korean explanation of why this is a cliche. */
  reason: string;
  /** Suggested rewrite approach in Korean. */
  suggestion: string;
}

export interface ClicheReport {
  /** All detected hits, sorted by severity (high → low) then position. */
  hits: ClicheHit[];
  /** 0-100 score where 100 = no cliches. */
  score: number;
  tone: ClicheTone;
  /** Korean short label e.g. "클리셰 3개 검출". */
  label: string;
  /** Korean one-sentence summary. */
  summary: string;
  /** Top 3 categories by hit count. */
  topCategories: Array<{ category: ClicheCategory; categoryLabel: string; count: number }>;
}

interface ClicheRule {
  category: ClicheCategory;
  severity: ClicheSeverity;
  patterns: RegExp[];
  reason: string;
  suggestion: string;
}

const RULES: ClicheRule[] = [
  // ── effort ───────────────────────────────────────────────────────
  {
    category: 'effort',
    severity: 'high',
    patterns: [
      /성실(?:한|함|하게)\s*(?:자세|모습|태도)/g,
      /최선을?\s*다하/g,
      /열심히\s*(?:일|노력|임)하?/g,
      /노력(?:하는|하겠습니다|할\s*것)/g,
    ],
    reason: '추상적인 다짐 표현입니다. 어떤 행동이 "성실"인지 채용 담당자는 알 수 없습니다.',
    suggestion:
      '"성실"을 빼고 정량 결과 한 줄로 대체하세요 — 예: "월 80건 티켓 평균 4시간 내 처리".',
  },
  // ── passion ──────────────────────────────────────────────────────
  {
    category: 'passion',
    severity: 'high',
    patterns: [
      /(?:뜨거운|남다른|강한)\s*열정/g,
      /열정과?\s*(?:도전|패기|에너지)/g,
      /(?<![가-힣])꿈을?\s*(?:향해|이루)/g,
      /도전\s*정신/g,
    ],
    reason:
      '"열정"은 한국 자소서의 1순위 클리셰입니다. 모든 지원자가 같은 단어를 쓰면 변별력이 사라집니다.',
    suggestion:
      '관심을 갖게 된 구체적 계기(논문/사이드 프로젝트/사용자 인터뷰)를 한 문장으로 적으세요.',
  },
  // ── attitude ─────────────────────────────────────────────────────
  {
    category: 'attitude',
    severity: 'medium',
    patterns: [
      /적극적(?:인|으로)/g,
      /긍정적(?:인|으로)\s*(?:마인드|자세|태도|사고)/g,
      /책임감을?\s*(?:가지|갖고|느끼)/g,
      /(?<![가-힣])주인의식/g,
    ],
    reason: '본인 평가 형용사는 검증이 불가능합니다. 사례 없이 쓰면 자기 PR로 읽히지 않습니다.',
    suggestion:
      '"책임감" 대신 "장애 발생 시 새벽 2시에 단독 대응 → 30분 내 복구" 같은 사례 한 줄을 적으세요.',
  },
  // ── teamwork ─────────────────────────────────────────────────────
  {
    category: 'teamwork',
    severity: 'medium',
    patterns: [
      /(?:원활한|뛰어난|좋은)\s*(?:소통|커뮤니케이션)\s*능력/g,
      /협업(?:을\s*잘|에\s*능)/g,
      /팀워크가?\s*(?:좋|뛰어|훌륭)/g,
    ],
    reason:
      '"소통/협업"은 직무 무관 만능 표현입니다. 어떤 협업이었는지 모르면 의미가 비어 있습니다.',
    suggestion: '구체적인 협업 사례(누구와, 어떤 의견 충돌, 어떻게 합의)를 짧게 적으세요.',
  },
  // ── closing ──────────────────────────────────────────────────────
  {
    category: 'closing',
    severity: 'high',
    patterns: [
      /기회를?\s*주신다면/g,
      /뽑아\s*주신다면/g,
      /채용해\s*주(?:신다면|시면)/g,
      /감사합니다\.?\s*$/m,
    ],
    reason: '"기회를 주신다면" 류 마무리는 수동적입니다. 채용 담당자는 능동성 신호를 봅니다.',
    suggestion:
      '마지막 문장은 "입사 후 첫 30일에 무엇을 할 것인가" 같은 행동 약속으로 마무리하세요.',
  },
  // ── self-intro ───────────────────────────────────────────────────
  {
    category: 'self-intro',
    severity: 'medium',
    patterns: [
      /^안녕하세요[.,!]/m,
      /저는\s+\S{1,10}\s*(?:입니다|이며|이고)/g,
      /지원자\s+\S{1,5}\s*(?:입니다|이며)/g,
    ],
    reason: '인사·이름 자기소개로 시작하면 첫 문장의 정보 밀도가 낮습니다.',
    suggestion:
      '첫 줄은 "왜 이 회사·이 직무인지" 한 줄로 시작해 보세요. 이름은 헤더에 이미 있습니다.',
  },
  // ── family ───────────────────────────────────────────────────────
  {
    category: 'family',
    severity: 'high',
    patterns: [/가족\s*같은/g, /(?<![가-힣])하나의\s*가족/g, /한\s*식구/g],
    reason: '"가족 같은 회사"는 한국 채용 시장에서 부정 신호로 받아들여집니다.',
    suggestion: '문화 어필은 "팀 OKR을 직접 제안한 경험" 같은 자율성 사례로 대체하세요.',
  },
  // ── english generic ──────────────────────────────────────────────
  {
    category: 'generic-en',
    severity: 'medium',
    patterns: [
      /\b(?:passionate\s+about|driven\s+by\s+passion)\b/gi,
      /\b(?:team\s*player|people\s*person)\b/gi,
      /\b(?:hard[-\s]?working|results[-\s]?(?:driven|oriented))\b/gi,
      /\b(?:think\s+outside\s+the\s+box|go[-\s]?getter|self[-\s]?starter)\b/gi,
      /\b(?:detail[-\s]?oriented)\b/gi,
    ],
    reason: 'English cover-letter filler that adds no signal — recruiters have read it 1000 times.',
    suggestion:
      'Replace with one concrete outcome (metric + verb): e.g. "shipped X to 50k users in 6 weeks".',
  },
];

const CATEGORY_LABELS: Record<ClicheCategory, string> = {
  effort: '성실/노력',
  passion: '열정/도전',
  attitude: '본인 평가',
  teamwork: '소통/협업',
  closing: '수동 마무리',
  'self-intro': '인사·자기소개',
  family: '가족 같은',
  'generic-en': '영어 클리셰',
};

const SEVERITY_RANK: Record<ClicheSeverity, number> = { high: 0, medium: 1, low: 2 };

const CONTEXT_RADIUS = 24;

function makeExcerpt(text: string, start: number, length: number): string {
  const left = Math.max(0, start - CONTEXT_RADIUS);
  const right = Math.min(text.length, start + length + CONTEXT_RADIUS);
  const prefix = left > 0 ? '…' : '';
  const suffix = right < text.length ? '…' : '';
  return `${prefix}${text.slice(left, right).trim()}${suffix}`;
}

export function buildCoverLetterClicheReport(text: string): ClicheReport {
  const safe = (text ?? '').trim();
  if (!safe) {
    return {
      hits: [],
      score: 100,
      tone: 'good',
      label: '클리셰 0개',
      summary: '분석할 본문이 비어 있습니다.',
      topCategories: [],
    };
  }

  const hits: ClicheHit[] = [];

  for (const rule of RULES) {
    const seenStarts = new Set<number>();
    for (const pattern of rule.patterns) {
      const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
      const re = new RegExp(pattern.source, flags);
      let m: RegExpExecArray | null;
      while ((m = re.exec(safe)) !== null) {
        if (m[0].length === 0) {
          re.lastIndex += 1;
          continue;
        }
        if (seenStarts.has(m.index)) continue;
        seenStarts.add(m.index);
        hits.push({
          category: rule.category,
          severity: rule.severity,
          match: m[0],
          excerpt: makeExcerpt(safe, m.index, m[0].length),
          reason: rule.reason,
          suggestion: rule.suggestion,
        });
      }
    }
  }

  hits.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  // Score: start at 100, subtract penalties (high=15, medium=8, low=4),
  // diminishing return for repeated hits (cap penalty per category at 30).
  const penaltyPerSeverity: Record<ClicheSeverity, number> = { high: 15, medium: 8, low: 4 };
  const penaltyByCategory = new Map<ClicheCategory, number>();
  for (const hit of hits) {
    const current = penaltyByCategory.get(hit.category) ?? 0;
    const add = penaltyPerSeverity[hit.severity];
    penaltyByCategory.set(hit.category, Math.min(30, current + add));
  }
  const totalPenalty = Array.from(penaltyByCategory.values()).reduce((a, b) => a + b, 0);
  const score = Math.max(0, Math.min(100, 100 - totalPenalty));

  const countByCategory = new Map<ClicheCategory, number>();
  for (const hit of hits) {
    countByCategory.set(hit.category, (countByCategory.get(hit.category) ?? 0) + 1);
  }
  const topCategories = Array.from(countByCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => ({
      category,
      categoryLabel: CATEGORY_LABELS[category],
      count,
    }));

  let tone: ClicheTone;
  let summary: string;
  if (hits.length === 0) {
    tone = 'good';
    summary =
      '대표적인 자소서 클리셰는 보이지 않습니다. 다음은 정량 성과 + 채용공고 키워드 매칭에 집중하세요.';
  } else if (score >= 75) {
    tone = 'neutral';
    summary = `클리셰 ${hits.length}개. 큰 흐름은 좋지만 "${topCategories[0]?.categoryLabel ?? '클리셰'}" 표현은 한 번 더 다듬으면 좋습니다.`;
  } else if (score >= 50) {
    tone = 'warning';
    summary = `클리셰 ${hits.length}개. "${topCategories[0]?.categoryLabel ?? '클리셰'}" 류 표현이 본문 인상을 평준화시킵니다.`;
  } else {
    tone = 'warning';
    summary = `클리셰 ${hits.length}개로 본문의 변별력이 낮습니다. 추상 형용사를 모두 정량 사례로 바꾸세요.`;
  }

  return {
    hits,
    score,
    tone,
    label: `클리셰 ${hits.length}개`,
    summary,
    topCategories,
  };
}

export const __CLICHE_CATEGORY_LABELS__ = CATEGORY_LABELS;
