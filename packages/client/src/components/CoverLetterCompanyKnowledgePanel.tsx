import { useMemo } from 'react'

import type { CompanyKnowledgeSignalType } from '@/lib/coverLetterCompanyKnowledgeChecker'

import { checkCoverLetterCompanyKnowledge } from '@/lib/coverLetterCompanyKnowledgeChecker'

interface Props {
  text: string
}

const KNOWLEDGE_TYPE_LABEL: Record<CompanyKnowledgeSignalType, string> = {
  product_mention: '제품 언급',
  tech_stack_match: '기술 블로그',
  business_context: '비즈니스 이해',
  initiative_reference: '이니셔티브',
  culture_alignment: '문화 정렬',
  milestone_reference: '이정표',
}

const DEPTH_LABEL: Record<string, string> = {
  specific: '구체적',
  moderate: '보통',
  generic: '추상적',
  none: '미언급',
}

export default function CoverLetterCompanyKnowledgePanel({ text }: Props) {
  const report = useMemo(() => checkCoverLetterCompanyKnowledge(text), [text])

  if (text.trim().length < 80) return null
  if (report.depth === 'specific') return null
  if (report.depth === 'none' && report.vaguePraiseCount === 0) return null

  const isWarning = report.depth === 'generic'

  return (
    <aside
      className={`co-knowledge-card${isWarning ? ' co-knowledge-card--warning' : ''}`}
      aria-label="회사 이해도 깊이 분석"
    >
      <header className="co-knowledge-card__head">
        <span className="co-knowledge-card__eyebrow">회사 이해도</span>
        <span className={`co-knowledge-card__badge co-knowledge-card__badge--${report.depth}`}>
          {DEPTH_LABEL[report.depth]}
        </span>
      </header>

      <p className="co-knowledge-card__hint">{report.suggestion}</p>

      {report.knowledgeSignals.length > 0 && (
        <div className="co-knowledge-card__chips" aria-label="구체적 지식 신호">
          {report.knowledgeSignals.map((sig, i) => (
            <span key={i} className="co-knowledge-card__chip co-knowledge-card__chip--good">
              {KNOWLEDGE_TYPE_LABEL[sig.type]}
            </span>
          ))}
        </div>
      )}

      {report.vaguePraiseSignals.length > 0 && (
        <ul className="co-knowledge-card__vague-list" aria-label="추상적 찬사 감지">
          {report.vaguePraiseSignals.map((sig, i) => (
            <li key={i} className="co-knowledge-card__vague-item">
              <span className="co-knowledge-card__vague-tag">추상적</span>
              <span className="co-knowledge-card__vague-text">{sig.excerpt}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
