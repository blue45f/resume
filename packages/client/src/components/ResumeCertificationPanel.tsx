import { useMemo } from 'react'

import type { DetectedCert } from '@/lib/resumeCertificationAnalyzer'

import { analyzeResumeCertifications } from '@/lib/resumeCertificationAnalyzer'

interface Props {
  text: string
}

const CATEGORY_LABEL: Record<DetectedCert['category'], string> = {
  it: 'IT',
  language: '어학',
  business: '경영/비즈니스',
  engineering: '공학',
  cloud: '클라우드',
  other: '기타',
}

const TIER_CHIP: Record<DetectedCert['tier'], string> = {
  national: '국가자격증',
  global: '국제인증',
  vendor: '벤더인증',
}

export default function ResumeCertificationPanel({ text }: Props) {
  const report = useMemo(() => analyzeResumeCertifications(text), [text])

  if (text.trim().length < 40) return null
  // Show panel if there ARE certs (to display them) or if missing important ones (0 total)
  // Don't show if we have plenty of relevant certs already
  if (report.totalCount >= 5 && report.hasItCert && report.hasLanguageCert) return null

  const isWarning = report.totalCount === 0

  return (
    <aside
      className={`cert-panel-card${isWarning ? ' cert-panel-card--warning' : ''}`}
      aria-label="자격증·인증 분석"
    >
      <header className="cert-panel-card__head">
        <span className="cert-panel-card__eyebrow">Certifications</span>
        <span
          className={`cert-panel-card__badge cert-panel-card__badge--${isWarning ? 'none' : 'ok'}`}
        >
          {report.totalCount === 0 ? '없음' : `${report.totalCount}개 감지`}
        </span>
      </header>

      <p className="cert-panel-card__hint">{report.suggestion}</p>

      {report.certs.length > 0 && (
        <ul className="cert-panel-card__list" aria-label="감지된 자격증">
          {report.certs.map((cert, i) => (
            <li key={i} className="cert-panel-card__item">
              <span className="cert-panel-card__cert-name">{cert.name}</span>
              <span className="cert-panel-card__cert-category">
                {CATEGORY_LABEL[cert.category]}
              </span>
              <span className="cert-panel-card__cert-tier">{TIER_CHIP[cert.tier]}</span>
            </li>
          ))}
        </ul>
      )}

      {report.totalCount === 0 && (
        <section className="cert-panel-card__suggestions" aria-label="권장 자격증">
          <h4 className="cert-panel-card__sugg-title">IT 직종 주요 자격증 예시</h4>
          <div className="cert-panel-card__sugg-chips">
            {['정보처리기사', 'AWS SAA', 'SQLD', 'OPIc IH+', '정보보안기사', 'CKA', 'ADsP'].map(
              (name) => (
                <span key={name} className="cert-panel-card__sugg-chip">
                  {name}
                </span>
              )
            )}
          </div>
        </section>
      )}
    </aside>
  )
}
