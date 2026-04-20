/**
 * 단어·동사 제안 모듈 — koreanChecker.ts 에서 분리.
 *
 * 공통 주제: 이력서·자소서 단어 리라이트 힌트 제공.
 *
 * - suggestVerbReplacements: 약한 동사("담당/수행") → 강한 대안 매핑
 * - suggestSynonyms: 특정 단어의 동의어 조회
 * - suggestSynonymsForOveruse: 본문 남용 단어 + 동의어 묶음
 */

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

export interface OveruseWithSynonyms {
  word: string;
  count: number;
  alternatives: string[];
}

/**
 * 본문에서 남용된 단어를 찾아 동의어 후보까지 같이 반환.
 * analyzeRedundancy 와 연동해 "반복 단어 + 대안 제안" 한 번에 보여주기.
 */
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
