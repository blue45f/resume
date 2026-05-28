import { useMemo } from 'react';
import { buildCoverLetterJdAlignmentReport } from '@/lib/coverLetterJdAlignment';

interface Props {
  coverLetterText: string;
  jdText: string;
}

export default function CoverLetterJdAlignmentPanel({ coverLetterText, jdText }: Props) {
  const report = useMemo(
    () => buildCoverLetterJdAlignmentReport(coverLetterText, jdText),
    [coverLetterText, jdText],
  );

  if (report.checks.length === 0 || jdText.trim().length < 20) return null;

  const fill = Math.max(0.04, report.alignmentScore / 100);

  return (
    <aside
      className={`cl-jd-align-card cl-jd-align-card--${report.tone}`}
      aria-label="자기소개서 JD 정렬도 분석"
    >
      <header className="cl-jd-align-card__head">
        <span className="cl-jd-align-card__eyebrow">JD alignment</span>
        <span className="cl-jd-align-card__label">{report.label}</span>
      </header>

      <div
        className="cl-jd-align-card__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={report.alignmentScore}
        aria-label="JD 정렬 점수"
      >
        <span
          className="cl-jd-align-card__meter-fill"
          style={{ ['--align-fill' as never]: String(fill) }}
        />
      </div>

      <p className="cl-jd-align-card__summary">{report.summary}</p>

      <ul className="cl-jd-align-card__checks" aria-label="JD 정렬 항목">
        {report.checks.map((check, i) => (
          <li
            key={i}
            className={`cl-jd-align-card__check${check.addressed ? '' : ' cl-jd-align-card__check--warn'}`}
          >
            <span className="cl-jd-align-card__check-icon" aria-hidden="true">
              {check.addressed ? '✓' : '○'}
            </span>
            <div>
              <strong>{check.label}</strong>
              <p className="cl-jd-align-card__check-detail">{check.detail}</p>
              {!check.addressed && <p className="cl-jd-align-card__check-tip">{check.tip}</p>}
            </div>
          </li>
        ))}
      </ul>

      {report.missingKeywords.length > 0 && (
        <div className="cl-jd-align-card__missing">
          <span className="cl-jd-align-card__missing-label">미언급 키워드</span>
          {report.missingKeywords.map((k) => (
            <code key={k} className="cl-jd-align-card__keyword">
              {k}
            </code>
          ))}
        </div>
      )}
    </aside>
  );
}
