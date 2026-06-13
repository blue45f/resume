/**
 * 이력서 연락처 완성도 검사기 — 이름, 전화번호, 이메일,
 * LinkedIn, GitHub, 거주 지역 등이 포함되어 있는지 확인한다.
 */

export type ContactField =
  | 'phone' // 전화번호
  | 'email' // 이메일
  | 'linkedin' // LinkedIn URL
  | 'github' // GitHub URL/ID
  | 'location' // 거주 지역
  | 'portfolio'; // 포트폴리오/개인 사이트

export type ContactMissingType =
  | 'no_phone'
  | 'no_email'
  | 'no_linkedin'
  | 'no_github'
  | 'no_location';

export interface ContactSignal {
  field: ContactField;
  excerpt: string;
}

export type ContactCompleteness = 'complete' | 'good' | 'partial' | 'minimal';

export interface ResumeContactInfoReport {
  foundFields: ContactField[];
  missingFields: ContactMissingType[];
  signals: ContactSignal[];
  completeness: ContactCompleteness;
  summary: string;
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Detection patterns
// ---------------------------------------------------------------------------

interface ContactPattern {
  field: ContactField;
  re: RegExp;
}

const CONTACT_PATTERNS: ContactPattern[] = [
  // phone
  {
    field: 'phone',
    re: /(?:010|011|016|017|019)[-.\s]?\d{3,4}[-.\s]?\d{4}/,
  },
  {
    field: 'phone',
    re: /(?:\+82[-.\s]?10[-.\s]?\d{3,4}[-.\s]?\d{4})/,
  },

  // email
  {
    field: 'email',
    re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  },

  // linkedin
  {
    field: 'linkedin',
    re: /linkedin\.com\/in\/[a-zA-Z0-9_-]+/i,
  },
  {
    field: 'linkedin',
    re: /linkedin\.com\/profile/i,
  },

  // github
  {
    field: 'github',
    re: /github\.com\/[a-zA-Z0-9_-]+/i,
  },
  {
    field: 'github',
    re: /GitHub\s*:\s*[a-zA-Z0-9_-]+/,
  },

  // location
  {
    field: 'location',
    re: /(?:서울|경기|인천|부산|대전|광주|대구|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주)\s*(?:시|도|특별시|광역시)?/,
  },
  {
    field: 'location',
    re: /거주\s*지\s*(?:역|:|：)\s*[가-힣]+/,
  },

  // portfolio
  {
    field: 'portfolio',
    re: /(?:https?:\/\/)?(?:www\.)?(?!github|linkedin)[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/,
  },
  {
    field: 'portfolio',
    re: /(?:포트폴리오|블로그)\s*(?:URL|주소|링크)?\s*[:：]\s*\S+/,
  },
];

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkResumeContactInfo(text: string): ResumeContactInfoReport {
  const t = text ?? '';

  const foundSet = new Set<ContactField>();
  const signals: ContactSignal[] = [];

  for (const { field, re } of CONTACT_PATTERNS) {
    if (foundSet.has(field)) continue;
    const m = t.match(re);
    if (m) {
      foundSet.add(field);
      signals.push({ field, excerpt: m[0].slice(0, 50) });
    }
  }

  const foundFields = Array.from(foundSet);

  const missingFields: ContactMissingType[] = [];
  if (!foundSet.has('phone')) missingFields.push('no_phone');
  if (!foundSet.has('email')) missingFields.push('no_email');
  if (!foundSet.has('linkedin')) missingFields.push('no_linkedin');
  if (!foundSet.has('github')) missingFields.push('no_github');
  if (!foundSet.has('location')) missingFields.push('no_location');

  const essentialFound = (foundSet.has('phone') ? 1 : 0) + (foundSet.has('email') ? 1 : 0);
  const professionalFound = (foundSet.has('linkedin') ? 1 : 0) + (foundSet.has('github') ? 1 : 0);

  let completeness: ContactCompleteness;
  if (essentialFound === 2 && professionalFound >= 1) {
    completeness = foundFields.length >= 4 ? 'complete' : 'good';
  } else if (essentialFound >= 1) {
    completeness = 'partial';
  } else {
    completeness = 'minimal';
  }

  let summary: string;
  if (completeness === 'complete') {
    summary = '연락처 정보가 충분히 포함되어 있습니다.';
  } else if (completeness === 'good') {
    const missing = missingFields
      .map(
        (m) =>
          ({
            no_phone: '전화번호',
            no_email: '이메일',
            no_linkedin: 'LinkedIn',
            no_github: 'GitHub',
            no_location: '거주 지역',
          })[m],
      )
      .join(', ');
    summary = `연락처가 대부분 있으나 ${missing} 추가를 권장합니다.`;
  } else if (completeness === 'partial') {
    summary = `연락처 정보가 일부만 포함되어 있습니다. 전화번호와 이메일은 필수입니다.`;
  } else {
    summary = '연락처 정보가 거의 없습니다. 전화번호·이메일·LinkedIn을 반드시 추가하세요.';
  }

  const recommendations: string[] = [];
  if (!foundSet.has('phone')) {
    recommendations.push('전화번호: 010-XXXX-XXXX 형식으로 추가하세요.');
  }
  if (!foundSet.has('email')) {
    recommendations.push('이메일: 전문적인 주소(이름 기반)로 추가하세요.');
  }
  if (!foundSet.has('linkedin')) {
    recommendations.push('LinkedIn 프로필 URL을 추가하면 신뢰도가 높아집니다.');
  }
  if (
    !foundSet.has('github') &&
    text.match(/(?:개발|프론트|백엔드|fullstack|full.stack|엔지니어|engineer)/i)
  ) {
    recommendations.push('개발 직군은 GitHub URL을 포함하면 포트폴리오 신뢰도가 상승합니다.');
  }

  return {
    foundFields,
    missingFields,
    signals,
    completeness,
    summary,
    recommendations,
  };
}
