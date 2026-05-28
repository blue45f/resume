/**
 * 이력서 소셜 프루프(외부 검증 신호) 분석 — 논문, 특허, 컨퍼런스 발표, 오픈소스 기여,
 * 수상 이력, 기술 블로그/강의 등 동료 평가 기반 신뢰 신호를 감지한다.
 */

export type SocialProofType =
  | 'publication' // 논문/아티클/기술 포스팅
  | 'conference_talk' // 컨퍼런스/밋업 발표
  | 'patent' // 특허
  | 'award' // 수상
  | 'open_source' // 오픈소스 기여/스타
  | 'teaching' // 강의/튜터링
  | 'media'; // 인터뷰/언론 보도/팟캐스트

export interface SocialProofSignal {
  type: SocialProofType;
  phrase: string;
}

export interface SocialProofReport {
  signals: SocialProofSignal[];
  types: Set<SocialProofType>;
  score: number; // 0-100
  level: 'high' | 'medium' | 'low' | 'none';
  suggestion: string;
  missingTips: string[];
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

interface ProofPattern {
  re: RegExp;
  type: SocialProofType;
  weight: number;
}

const PROOF_PATTERNS: ProofPattern[] = [
  // Publications
  { re: /(?:논문|paper|arXiv|preprint)\s*(?:게재|출판|발표|제출|accept|reject)/, type: 'publication', weight: 25 },
  { re: /(?:KCI|SCI|SCIE|IEEE|ACM|CVPR|NeurIPS|ICLR|ICML)\s*(?:게재|논문|발표)/, type: 'publication', weight: 30 },
  { re: /(?:기술\s*(?:블로그|아티클)|Tech\s*blog)\s*(?:운영|연재|작성)/, type: 'publication', weight: 10 },
  { re: /(?:velog|tistory|medium|brunch)\s*(?:블로그|연재|작성|기고)/, type: 'publication', weight: 8 },

  // Conference / meetup talks
  { re: /(?:DEVIEW|if\s*Kakao|Pycon|JSConf|GDC|우아콘|토스콘|당근마켓\s*컨퍼)\s*(?:발표|연사|스피커)/, type: 'conference_talk', weight: 30 },
  { re: /(?:컨퍼런스|세미나|밋업|meetup)\s*(?:발표|연사|스피커|진행)/, type: 'conference_talk', weight: 20 },
  { re: /사내\s*(?:Tech\s*Talk|테크\s*토크|발표|세션)\s*(?:진행|운영)/, type: 'conference_talk', weight: 10 },

  // Patents
  { re: /(?:특허|patent)\s*(?:등록|출원|취득|보유)\s*(?:\d+건)?/, type: 'patent', weight: 30 },
  { re: /등록\s*특허\s*(?:번호|제)/, type: 'patent', weight: 30 },

  // Awards / competitions
  { re: /(?:해커톤|hackathon)\s*(?:우승|대상|최우수|1위|수상)/, type: 'award', weight: 20 },
  { re: /(?:공모전|경진대회|contest)\s*(?:우수|최우수|수상|입선|당선)/, type: 'award', weight: 15 },
  { re: /(?:포상|대상|금상|은상|동상|장관상|수상)\s*(?:수상|수여|받음)?/, type: 'award', weight: 15 },
  { re: /(?:MVP|Best\s*(?:Employee|Developer|Engineer))\s*(?:선정|수상)/, type: 'award', weight: 15 },

  // Open source
  { re: /(?:GitHub|깃허브)\s*(?:star|스타)\s*\d+/, type: 'open_source', weight: 20 },
  { re: /(?:오픈소스|open\s*source)\s*(?:메인테이너|contributor|기여자|운영)/, type: 'open_source', weight: 20 },
  { re: /(?:npm|pypi|crates\.io)\s*(?:패키지|라이브러리)\s*(?:배포|공개|운영)/, type: 'open_source', weight: 18 },
  { re: /(?:PR|pull\s*request)\s*(?:merge|merged|승인|기여)\s*(?:\d+건)?/, type: 'open_source', weight: 12 },

  // Teaching / tutoring
  { re: /(?:인강|강의|강좌)\s*(?:제작|운영|출강|진행|촬영)/, type: 'teaching', weight: 15 },
  { re: /(?:멘토\s*프로그램|패스트캠퍼스|인프런|유데미)\s*(?:강사|강의|출강)/, type: 'teaching', weight: 18 },
  { re: /(?:사내\s*교육|팀\s*교육)\s*(?:개발|운영|진행|담당)/, type: 'teaching', weight: 10 },

  // Media / press
  { re: /(?:언론|뉴스|인터뷰|기사)\s*(?:게재|보도|인용)/, type: 'media', weight: 15 },
  { re: /(?:팟캐스트|podcast|유튜브|YouTube)\s*(?:출연|인터뷰|영상|채널)/, type: 'media', weight: 10 },
];

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeResumeSocialProof(text: string): SocialProofReport {
  const t = text ?? '';
  const signals: SocialProofSignal[] = [];
  const types = new Set<SocialProofType>();
  let totalWeight = 0;

  for (const { re, type, weight } of PROOF_PATTERNS) {
    const m = t.match(re);
    if (m) {
      signals.push({ type, phrase: m[0].slice(0, 60) });
      if (!types.has(type)) {
        types.add(type);
        totalWeight += weight;
      }
    }
  }

  const score = Math.min(100, totalWeight);

  let level: SocialProofReport['level'];
  if (score >= 50) level = 'high';
  else if (score >= 20) level = 'medium';
  else if (score >= 5) level = 'low';
  else level = 'none';

  let suggestion: string;
  if (level === 'high') {
    suggestion = '외부 검증 신호가 풍부합니다. 서류 전형과 면접에서 강력한 차별화 요소가 됩니다.';
  } else if (level === 'medium') {
    suggestion = '일부 소셜 프루프 신호가 있습니다. 더 추가할 수 있는 항목을 확인하세요.';
  } else if (level === 'low') {
    suggestion = '소셜 프루프 신호가 적습니다. 외부 검증 활동이 경쟁력을 높입니다.';
  } else {
    suggestion = '논문·특허·수상·오픈소스·발표 등 외부 검증 신호가 없습니다.';
  }

  const missingTips: string[] = [];
  if (!types.has('open_source')) {
    missingTips.push('GitHub 오픈소스 기여 또는 개인 라이브러리 배포 이력을 추가하세요.');
  }
  if (!types.has('award') && !types.has('conference_talk')) {
    missingTips.push('해커톤 수상, 컨퍼런스 발표 경험이 있다면 반드시 기재하세요.');
  }
  if (!types.has('publication') && !types.has('teaching')) {
    missingTips.push('기술 블로그 연재, 사내 Tech Talk 진행, 논문 게재 이력이 있으면 추가하세요.');
  }

  return { signals, types, score, level, suggestion, missingTips };
}
