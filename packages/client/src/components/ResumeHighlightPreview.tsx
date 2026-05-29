import { useMemo } from 'react';
import { highlightResume } from '@/lib/resumeHighlighter';

interface Props {
  text: string;
}

export default function ResumeHighlightPreview({ text }: Props) {
  const result = useMemo(() => highlightResume(text), [text]);

  if (text.trim().length < 80) return null;

  return (
    <section className="hl-preview" aria-label="이력서 하이라이트 미리보기">
      <header className="hl-preview__head">
        <span className="hl-preview__title">🔦 6초 스캔 하이라이트</span>
        <div className="hl-preview__legend" aria-label="하이라이트 범례">
          <span className="hl-preview__chip hl-preview__chip--metric">
            성과 {result.counts.metric}
          </span>
          <span className="hl-preview__chip hl-preview__chip--strongVerb">
            액션 {result.counts.strongVerb}
          </span>
          <span className="hl-preview__chip hl-preview__chip--filler">
            모호 {result.counts.filler}
          </span>
        </div>
      </header>

      <div className="hl-preview__body">
        {result.tokens.map((tok, i) =>
          tok.category ? (
            <mark key={i} className={`hl hl--${tok.category}`}>
              {tok.text}
            </mark>
          ) : (
            <span key={i}>{tok.text}</span>
          ),
        )}
      </div>

      {result.truncated && (
        <p className="hl-preview__note">미리보기는 앞부분 1,500자만 표시합니다.</p>
      )}
      {result.counts.metric === 0 && (
        <p className="hl-preview__hint">
          정량 성과(숫자) 표현이 없습니다. 수치를 추가하면 채용 담당자 눈에 먼저 띕니다.
        </p>
      )}
    </section>
  );
}
