import { useState } from 'react';
import type { Resume } from '@/types/resume';
import { calculateCompleteness } from '@/lib/completeness';
import { analyzeAtsCompatibility } from '@/lib/ats';

interface Props {
  resume: Resume;
}

export default function ResumeScoreboard({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);

  const completeness = calculateCompleteness(resume);
  const ats = analyzeAtsCompatibility(resume);

  // Calculate various scores
  const expYears = resume.experiences.length;
  const skillCount = resume.skills.reduce((sum, s) => sum + s.items.split(',').length, 0);
  const projectCount = resume.projects.length;
  const certCount = resume.certifications.length;
  const hasPhoto = !!resume.personalInfo.photo;
  const hasSummary = !!(resume.personalInfo.summary && resume.personalInfo.summary.replace(/<[^>]*>/g, '').length > 30);

  // Composite score (0-100)
  const scores = {
    completeness: completeness.percentage,
    ats: ats.score,
    detail: Math.min(100, (expYears * 15) + (skillCount * 5) + (projectCount * 10) + (certCount * 10) + (hasPhoto ? 5 : 0) + (hasSummary ? 10 : 0)),
  };
  const overallScore = Math.round((scores.completeness + scores.ats + scores.detail) / 3);

  // Percentile estimation (simplified - based on score ranges)
  const getPercentile = (score: number): number => {
    if (score >= 90) return 95;
    if (score >= 80) return 85;
    if (score >= 70) return 70;
    if (score >= 60) return 55;
    if (score >= 50) return 40;
    if (score >= 40) return 25;
    return 15;
  };

  const percentile = getPercentile(overallScore);
  const gradeEmoji = overallScore >= 90 ? '\u{1F3C6}' : overallScore >= 75 ? '\u2B50' : overallScore >= 60 ? '\u{1F44D}' : overallScore >= 40 ? '\u{1F4AA}' : '\u{1F4DD}';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{'\uC774\uB825\uC11C \uACBD\uC7C1\uB825'}</h3>
        <div className="flex items-center gap-2">
          <span className="text-lg">{gradeEmoji}</span>
          <span className="text-sm font-bold text-blue-600">{overallScore}{'\uC810'}</span>
          <span className="text-xs text-slate-400">{'\uC0C1\uC704'} {100 - percentile}%</span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 animate-fade-in">
          {/* Overall gauge */}
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${overallScore}, 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{overallScore}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{'\uAC19\uC740 \uBD84\uC57C \uAD6C\uC9C1\uC790 \uC911'} <strong className="text-blue-600">{'\uC0C1\uC704'} {100 - percentile}%</strong></p>
          </div>

          {/* Score breakdown */}
          <div className="space-y-2">
            {[
              { label: '\uC644\uC131\uB3C4', score: scores.completeness, color: 'bg-green-500' },
              { label: 'ATS \uD638\uD658', score: scores.ats, color: 'bg-blue-500' },
              { label: '\uC0C1\uC138\uB3C4', score: scores.detail, color: 'bg-purple-500' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-16 shrink-0">{s.label}</span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className={`${s.color} rounded-full h-2 transition-all duration-500`} style={{ width: `${s.score}%` }} />
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-8 text-right">{s.score}</span>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">{'\u{1F4A1} \uACBD\uC7C1\uB825 \uB192\uC774\uAE30'}</p>
            {overallScore < 60 && <p>{'\u2022 \uACBD\uB825\uACFC \uD504\uB85C\uC81D\uD2B8 \uC139\uC158\uC744 \uB354 \uC0C1\uC138\uD558\uAC8C \uC791\uC131\uD558\uC138\uC694'}</p>}
            {!hasPhoto && <p>{'\u2022 \uC99D\uBA85\uC0AC\uC9C4\uC744 \uCD94\uAC00\uD558\uBA74 +5\uC810'}</p>}
            {!hasSummary && <p>{'\u2022 \uC790\uAE30\uC18C\uAC1C\uB97C 30\uC790 \uC774\uC0C1 \uC791\uC131\uD558\uC138\uC694'}</p>}
            {skillCount < 5 && <p>{'\u2022 \uAE30\uC220 \uC2A4\uD0DD\uC744 5\uAC1C \uC774\uC0C1 \uCD94\uAC00\uD558\uC138\uC694'}</p>}
            {certCount === 0 && <p>{'\u2022 \uC790\uACA9\uC99D\uC744 \uCD94\uAC00\uD558\uBA74 \uACBD\uC7C1\uB825\uC774 \uB192\uC544\uC9D1\uB2C8\uB2E4'}</p>}
            {overallScore >= 80 && <p>{'\u2022 \uD6CC\uB96D\uD569\uB2C8\uB2E4! AI \uCF54\uCE6D\uC73C\uB85C \uB354 \uB2E4\uB4EC\uC5B4\uBCF4\uC138\uC694'}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
