import type { ReactNode } from 'react'

interface Props {
  /** 접기 헤더에 표시할 제목 (이모지 포함 가능). */
  title: string
  /** 기본 펼침 여부. 기본값 false(접힘). */
  defaultOpen?: boolean
  children: ReactNode
}

/**
 * 분석 패널 묶음을 접기/펼치기로 감싸는 공용 섹션.
 * 상단 요약 시각화 아래 상세 패널들을 정리해 "요약 → 드릴다운" 위계를 만든다.
 */
export default function CollapsibleAnalysisSection({
  title,
  defaultOpen = false,
  children,
}: Props) {
  return (
    <details className="analysis-fold" open={defaultOpen}>
      <summary className="analysis-fold__summary">
        <span>{title}</span>
        <span className="analysis-fold__chevron" aria-hidden="true">
          ⌄
        </span>
      </summary>
      <div className="analysis-fold__body">{children}</div>
    </details>
  )
}
