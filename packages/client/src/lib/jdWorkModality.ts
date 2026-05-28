export type WorkModality = 'remote' | 'hybrid' | 'onsite' | 'flexible' | 'unknown';

export interface WorkModalityReport {
  modality: WorkModality;
  /** Korean label. */
  label: string;
  /** Detected signal excerpt. */
  signals: string[];
  /** Number of reimbursed commute/office signals. */
  onsiteSignals: number;
  /** Number of remote/WFH signals. */
  remoteSignals: number;
  /** Korean one-sentence summary. */
  summary: string;
  /** Whether relocation is mentioned. */
  relocationRequired: boolean;
}

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

const REMOTE_PATTERNS: RegExp[] = [
  /(?:전면|완전|100%)\s*재택/g,
  /재택\s*근무\s*(?:가능|허용|보장|지원|우선)/g,
  /원격\s*근무/g,
  /\bfull(?:y)?\s*remote\b/gi,
  /\bwork\s*from\s*home\b/gi,
  /\bwfh\b/gi,
  /\bremote[-\s]?first\b/gi,
  /\bremote\s*ok\b/gi,
];

const HYBRID_PATTERNS: RegExp[] = [
  /주\s*[1-4]\s*일\s*(?:재택|원격)/g,
  /하이브리드\s*(?:근무|형태|방식)/g,
  /재택\s*[+&·]\s*출근/g,
  /출근\s*[+&·]\s*재택/g,
  /\bhybrid\b/gi,
  /\bflexible\s*(?:work|location)\b/gi,
  /선택적\s*재택/g,
  /부분\s*재택/g,
];

const ONSITE_PATTERNS: RegExp[] = [
  /(?:전면|필수|반드시)\s*출근/g,
  /사무실\s*(?:근무|출근|위치)/g,
  /오피스\s*근무/g,
  /(?:본사|지사|센터)\s*근무\s*(?:필수)?/g,
  /\bon(?:[-\s]?site|[-\s]?premise)\b/gi,
  /\bin[-\s]?office\b/gi,
  /재택\s*(?:불가|불허)/g,
  /출퇴근\s*(?:필수|가능한\s*분)/g,
];

const FLEXIBLE_PATTERNS: RegExp[] = [
  /자율\s*출퇴근/g,
  /유연\s*근무/g,
  /탄력\s*(?:근무|근로)/g,
  /스마트\s*(?:워크|근무)/g,
  /\bflextime\b/gi,
  /\bflexible\s*hours?\b/gi,
];

const RELOCATION_PATTERNS: RegExp[] = [
  /(?:이사|이주|이전)\s*지원/g,
  /전근\s*(?:가능|필수)/g,
  /지방\s*(?:거주|근무)/g,
  /\brelocation\b/gi,
];

const CONTEXT_RADIUS = 20;

function findSignals(text: string, patterns: RegExp[]): string[] {
  const signals: string[] = [];
  const seen = new Set<number>();
  for (const p of patterns) {
    const flags = p.flags.includes('g') ? p.flags : p.flags + 'g';
    const re = new RegExp(p.source, flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      if (seen.has(m.index)) continue;
      seen.add(m.index);
      const left = Math.max(0, m.index - CONTEXT_RADIUS);
      const right = Math.min(text.length, m.index + m[0].length + CONTEXT_RADIUS);
      signals.push(text.slice(left, right).trim());
    }
  }
  return signals;
}

function countMatches(text: string, patterns: RegExp[]): number {
  let n = 0;
  for (const p of patterns) {
    const flags = p.flags.includes('g') ? p.flags : p.flags + 'g';
    const re = new RegExp(p.source, flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      n++;
    }
  }
  return n;
}

// ---------------------------------------------------------------------------

const MODALITY_LABELS: Record<WorkModality, string> = {
  remote: '전면 재택',
  hybrid: '하이브리드',
  onsite: '상시 출근',
  flexible: '유연 근무',
  unknown: '근무 방식 미명시',
};

export function buildWorkModalityReport(text: string): WorkModalityReport {
  const safe = (text ?? '').trim();

  if (!safe) {
    return {
      modality: 'unknown',
      label: '근무 방식 미명시',
      signals: [],
      onsiteSignals: 0,
      remoteSignals: 0,
      summary: '분석할 채용공고 본문이 없습니다.',
      relocationRequired: false,
    };
  }

  const remoteCount = countMatches(safe, REMOTE_PATTERNS);
  const hybridCount = countMatches(safe, HYBRID_PATTERNS);
  const onsiteCount = countMatches(safe, ONSITE_PATTERNS);
  const flexibleCount = countMatches(safe, FLEXIBLE_PATTERNS);
  const relocationRequired = countMatches(safe, RELOCATION_PATTERNS) > 0;

  let modality: WorkModality;
  let signals: string[];

  if (remoteCount > 0 && hybridCount === 0 && onsiteCount === 0) {
    modality = 'remote';
    signals = findSignals(safe, REMOTE_PATTERNS);
  } else if (hybridCount > 0 || (remoteCount > 0 && onsiteCount > 0)) {
    modality = 'hybrid';
    signals = [
      ...findSignals(safe, HYBRID_PATTERNS),
      ...findSignals(safe, REMOTE_PATTERNS),
      ...findSignals(safe, ONSITE_PATTERNS),
    ].slice(0, 4);
  } else if (onsiteCount > 0) {
    modality = 'onsite';
    signals = findSignals(safe, ONSITE_PATTERNS);
  } else if (flexibleCount > 0) {
    modality = 'flexible';
    signals = findSignals(safe, FLEXIBLE_PATTERNS);
  } else {
    modality = 'unknown';
    signals = [];
  }

  const label = MODALITY_LABELS[modality];

  let summary: string;
  switch (modality) {
    case 'remote':
      summary = '전면 재택을 지원하는 공고입니다. 온보딩·협업 방식을 면접에서 확인해 보세요.';
      break;
    case 'hybrid':
      summary = '사무실 출근과 재택을 병행하는 공고입니다. 주당 출근 일수와 유연성을 확인하세요.';
      break;
    case 'onsite':
      summary = '상시 사무실 출근이 요구되는 공고입니다. 통근 거리를 미리 확인하세요.';
      break;
    case 'flexible':
      summary =
        '자율·탄력 근무를 지원합니다. 코어 타임 유무와 구체적 운영 방식을 면접에서 확인하세요.';
      break;
    default:
      summary = '근무 방식(재택/출근)이 명시되지 않았습니다. 면접에서 직접 물어보세요.';
  }

  if (relocationRequired) {
    summary += ' 이주·전근 언급이 있으니 확인이 필요합니다.';
  }

  return {
    modality,
    label,
    signals: signals.slice(0, 3),
    onsiteSignals: onsiteCount,
    remoteSignals: remoteCount,
    summary,
    relocationRequired,
  };
}
