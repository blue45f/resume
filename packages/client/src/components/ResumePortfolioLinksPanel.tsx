import { useMemo } from 'react'

import type { ExtractedLink } from '@/lib/metaUtils'

import { extractLinks } from '@/lib/metaUtils'

interface Props {
  text: string
}

const PLATFORM_LABEL: Record<ExtractedLink['platform'], string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  notion: 'Notion',
  behance: 'Behance',
  dribbble: 'Dribbble',
  velog: 'velog',
  blog: '블로그',
  other: '기타',
}

const PLATFORM_ICON: Record<ExtractedLink['platform'], string> = {
  github: '⌨',
  linkedin: '💼',
  notion: '📝',
  behance: '🎨',
  dribbble: '🏀',
  velog: '✍',
  blog: '📰',
  other: '🔗',
}

export default function ResumePortfolioLinksPanel({ text }: Props) {
  const report = useMemo(() => extractLinks(text), [text])

  const hasMissingScheme = report.missingScheme > 0
  const noGithub = !report.platforms.includes('github')
  const noLinkedIn = !report.platforms.includes('linkedin')

  const hasIssues = hasMissingScheme || report.count === 0 || (noGithub && noLinkedIn)
  if (!hasIssues) return null
  if (text.trim().length < 40) return null

  const isWarning = report.count === 0 || hasMissingScheme

  return (
    <aside
      className={`portfolio-links-card${isWarning ? ' portfolio-links-card--warning' : ''}`}
      aria-label="포트폴리오 링크 분석"
    >
      <header className="portfolio-links-card__head">
        <span className="portfolio-links-card__eyebrow">Portfolio links</span>
        {report.count === 0 ? (
          <span className="portfolio-links-card__badge portfolio-links-card__badge--warn">
            링크 없음
          </span>
        ) : hasMissingScheme ? (
          <span className="portfolio-links-card__badge portfolio-links-card__badge--warn">
            스킴 누락 {report.missingScheme}건
          </span>
        ) : (
          <span className="portfolio-links-card__badge portfolio-links-card__badge--ok">
            {report.count}개 검출
          </span>
        )}
      </header>

      {report.count === 0 ? (
        <p className="portfolio-links-card__hint">
          GitHub, LinkedIn, 개인 블로그 등 외부 링크가 없습니다. 포트폴리오 URL을 추가하면 채용
          담당자가 실제 결과물을 확인할 수 있습니다.
        </p>
      ) : (
        <>
          {hasMissingScheme && (
            <p className="portfolio-links-card__hint">
              {report.missingScheme}개 링크에 <code>https://</code> 스킴이 없습니다. 클릭 가능한
              링크가 되려면 <code>https://</code>를 앞에 붙여야 합니다.
            </p>
          )}

          <ul className="portfolio-links-card__list">
            {report.links.slice(0, 6).map((link, i) => (
              <li
                key={i}
                className={`portfolio-links-card__item${!link.hasScheme ? ' portfolio-links-card__item--warn' : ''}`}
              >
                <span className="portfolio-links-card__icon" aria-hidden="true">
                  {PLATFORM_ICON[link.platform]}
                </span>
                <span className="portfolio-links-card__platform">
                  {PLATFORM_LABEL[link.platform]}
                </span>
                <span className="portfolio-links-card__url">{link.url.slice(0, 48)}</span>
                {!link.hasScheme && (
                  <span className="portfolio-links-card__warn-chip">https:// 누락</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {(noGithub || noLinkedIn) && report.count > 0 && (
        <p className="portfolio-links-card__missing">
          {noGithub && noLinkedIn
            ? 'GitHub·LinkedIn 링크 모두 없습니다. 기술직 지원 시 두 링크 모두 권장됩니다.'
            : noGithub
              ? 'GitHub 링크가 없습니다. 코드 샘플을 보여주는 공개 저장소 URL을 추가하세요.'
              : 'LinkedIn 링크가 없습니다. 프로필 URL을 추가하면 네트워크 신뢰도가 높아집니다.'}
        </p>
      )}
    </aside>
  )
}
