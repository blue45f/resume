import { useMemo } from 'react'

import { detectContactInfo, detectPersonalInfo } from '@/lib/pii'

interface Props {
  text: string
}

const PII_TYPE_LABEL: Record<string, string> = {
  rrn: '주민등록번호',
  card: '카드번호',
  birthYmd: '생년월일',
  address: '상세주소',
  zipcode: '우편번호',
}

export default function ResumePiiPanel({ text }: Props) {
  const contact = useMemo(() => detectContactInfo(text), [text])
  const pii = useMemo(() => detectPersonalInfo(text), [text])

  const invalidEmails = contact.emails.filter((e) => !e.valid)
  const invalidPhones = contact.phones.filter((p) => !p.valid)
  const hasContactIssue = invalidEmails.length > 0 || invalidPhones.length > 0
  const hasPii = pii.severity !== 'none'
  const hasNoContact = contact.emails.length === 0 && contact.phones.length === 0

  if (!hasContactIssue && !hasPii && !hasNoContact) return null

  return (
    <aside
      className={`pii-card${pii.severity === 'critical' ? ' pii-card--critical' : pii.severity === 'warning' ? ' pii-card--warning' : ''}`}
      aria-label="개인정보 및 연락처 분석"
    >
      <header className="pii-card__head">
        <span className="pii-card__eyebrow">privacy check</span>
        <span className="pii-card__title">
          {pii.severity === 'critical' ? '고위험 개인정보 감지' : '개인정보·연락처 확인'}
        </span>
      </header>

      {/* Critical PII warning */}
      {hasPii && (
        <div className={`pii-card__pii-block pii-card__pii-block--${pii.severity}`}>
          <p className="pii-card__pii-summary">{pii.suggestion}</p>
          <ul className="pii-card__pii-list" aria-label="감지된 개인정보">
            {pii.hits.slice(0, 5).map((h, i) => (
              <li key={i} className="pii-card__pii-item">
                <span className="pii-card__pii-type">{PII_TYPE_LABEL[h.type] ?? h.type}</span>
                <code className="pii-card__pii-sample">{h.sample}</code>
                <span className="pii-card__pii-reason">{h.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contact validation */}
      {(hasContactIssue || hasNoContact) && (
        <div className="pii-card__contact">
          {hasNoContact ? (
            <p className="pii-card__contact-hint">
              연락처(이메일·전화)가 감지되지 않았습니다. 이력서에 포함되어 있는지 확인하세요.
            </p>
          ) : (
            <>
              {invalidEmails.length > 0 && (
                <p className="pii-card__contact-hint">
                  잘못된 이메일: {invalidEmails.map((e) => e.address).join(', ')}
                </p>
              )}
              {invalidPhones.length > 0 && (
                <p className="pii-card__contact-hint">
                  잘못된 전화번호: {invalidPhones.map((p) => p.raw).join(', ')}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Valid contact summary */}
      {!hasNoContact && (contact.emails.length > 0 || contact.phones.length > 0) && (
        <p className="pii-card__contact-ok">{contact.summary}</p>
      )}
    </aside>
  )
}
