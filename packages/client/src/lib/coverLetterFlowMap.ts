/**
 * 자기소개서 흐름 맵 — 문단별로 어떤 내용 블록(지원동기·역량·경험·포부)을 주로
 * 다루는지 분류해, 글의 서사 구조와 균형을 한눈에 보이도록 시각화 데이터를 만든다.
 *
 * coverLetterCoverageChecker가 "블록이 있는가"를 본다면, 여기서는 "어디에·어떤 순서로
 * 배치됐는가"라는 흐름을 본다.
 */

export type FlowBlock = 'motivation' | 'competency' | 'experience' | 'aspiration' | 'narrative';

export interface FlowSegment {
  index: number;
  block: FlowBlock;
  charLength: number;
  weight: number; // 0–1, 전체 대비 길이 비중
  preview: string;
}

export interface CoverLetterFlowReport {
  segments: FlowSegment[];
  paragraphCount: number;
  dominantBlock: FlowBlock | null;
  aspirationAtEnd: boolean;
  notes: string[];
}

const BLOCK_PATTERNS: Record<Exclude<FlowBlock, 'narrative'>, RegExp> = {
  motivation:
    /(?:지원\s*동기|지원하게\s*된|지원\s*(?:한\s*)?이유|매력을?\s*느|관심을\s*갖게|이\s*직무에\s*지원|입사를\s*희망|함께\s*하고\s*싶)/g,
  competency:
    /(?:역량|강점|전문성|적합|기여할\s*수\s*있|잘\s*할\s*수\s*있|능력을\s*갖|차별화|경쟁력)/g,
  experience:
    /(?:경험|프로젝트|사례|당시|진행했|개발했|구축했|담당했|수행했|참여했|이끌었|해결했)/g,
  aspiration:
    /(?:입사\s*후|포부|목표|이루고\s*싶|성장하여|성장하고\s*싶|기여하고\s*싶|앞으로|비전을|되고\s*싶)/g,
};

const BLOCK_ORDER: Array<Exclude<FlowBlock, 'narrative'>> = [
  'motivation',
  'competency',
  'experience',
  'aspiration',
];

const BLOCK_LABEL: Record<FlowBlock, string> = {
  motivation: '지원동기',
  competency: '역량',
  experience: '경험',
  aspiration: '포부',
  narrative: '서술',
};

function splitParagraphs(text: string): string[] {
  const byBlank = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (byBlank.length >= 2) return byBlank;
  // Fallback: single-newline split when no blank-line paragraphs.
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function classifyParagraph(para: string): FlowBlock {
  let bestBlock: FlowBlock = 'narrative';
  let bestCount = 0;
  for (const block of BLOCK_ORDER) {
    const count = (para.match(BLOCK_PATTERNS[block]) ?? []).length;
    if (count > bestCount) {
      bestCount = count;
      bestBlock = block;
    }
  }
  return bestBlock;
}

export function buildCoverLetterFlowMap(text: string): CoverLetterFlowReport {
  const t = (text ?? '').trim();
  const paragraphs = splitParagraphs(t);
  const totalChars = paragraphs.reduce((sum, p) => sum + p.length, 0) || 1;

  const segments: FlowSegment[] = paragraphs.map((para, index) => ({
    index,
    block: classifyParagraph(para),
    charLength: para.length,
    weight: para.length / totalChars,
    preview: para.slice(0, 60),
  }));

  // Dominant block by total char weight.
  const blockWeights = new Map<FlowBlock, number>();
  for (const seg of segments) {
    blockWeights.set(seg.block, (blockWeights.get(seg.block) ?? 0) + seg.weight);
  }
  let dominantBlock: FlowBlock | null = null;
  let maxWeight = 0;
  for (const [block, w] of blockWeights) {
    if (w > maxWeight) {
      maxWeight = w;
      dominantBlock = block;
    }
  }

  const lastBlock = segments.length > 0 ? segments[segments.length - 1].block : null;
  const aspirationAtEnd = lastBlock === 'aspiration';

  // Notes
  const notes: string[] = [];
  const presentBlocks = new Set(segments.map((s) => s.block));
  if (segments.length === 1) {
    notes.push(
      '문단 구분이 없어 한 덩어리로 보입니다. 블록별로 문단을 나누면 가독성이 좋아집니다.',
    );
  }
  if (!presentBlocks.has('motivation')) {
    notes.push('지원 동기 문단이 뚜렷하지 않습니다. 도입부에 배치하면 흐름이 자연스럽습니다.');
  }
  if (!presentBlocks.has('aspiration')) {
    notes.push('포부 문단이 없습니다. 마지막에 입사 후 목표를 덧붙이면 마무리가 강해집니다.');
  } else if (!aspirationAtEnd) {
    notes.push('포부가 마지막 문단이 아닙니다. 보통 포부는 글의 끝에 두는 것이 자연스럽습니다.');
  }
  if (dominantBlock && maxWeight > 0.6) {
    notes.push(
      `'${BLOCK_LABEL[dominantBlock]}' 비중이 과도합니다(${Math.round(maxWeight * 100)}%). 다른 블록과 균형을 맞추세요.`,
    );
  }

  return {
    segments,
    paragraphCount: segments.length,
    dominantBlock,
    aspirationAtEnd,
    notes,
  };
}

export { BLOCK_LABEL as FLOW_BLOCK_LABEL };
