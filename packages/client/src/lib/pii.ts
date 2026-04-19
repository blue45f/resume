/**
 * PII·연락처 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * 제공:
 * - detectContactInfo: 이메일/전화 추출 + 형식 검증
 * - detectPersonalInfo: 주민번호/카드번호/생년월일/상세주소/우편번호 등 고위험 PII 검출
 *
 * 관련 타입: ContactInfo, PiiHit, PiiAnalysis.
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

/**
 * 연락처 정보 검증 — 이력서에 포함된 이메일·전화번호 형식 확인.
 * 이메일 RFC 기본 패턴 / 한국 전화번호 010-xxxx-xxxx 또는 02-xxxx-xxxx 등.
 */
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

/**
 * 민감정보(PII) 검출 — 주민등록번호/카드번호/생년월일(YYYYMMDD)/상세 주소처럼
 * 공개 이력서에 노출되면 위험한 항목. PIPA 준수 + 구직자 개인정보 보호 관점.
 */
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
