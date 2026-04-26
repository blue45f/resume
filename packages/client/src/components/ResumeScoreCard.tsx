import { useState, useRef } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import type { Resume } from '@/types/resume';
import { calculateCompleteness } from '@/lib/completeness';
import { toast } from '@/components/Toast';

interface Props {
  resume: Resume;
  onClose: () => void;
}

function getGradeEmoji(grade: string): string {
  return { S: '🏆', A: '⭐', B: '✅', C: '📈', D: '💪' }[grade] || '📄';
}

function getGradeMessage(grade: string, _pct: number): string {
  if (grade === 'S') return `상위 5% 수준의 완성도! 채용 담당자가 주목할 이력서입니다.`;
  if (grade === 'A') return `높은 완성도! 대부분의 지원자보다 잘 작성된 이력서입니다.`;
  if (grade === 'B') return `양호한 수준. 몇 가지만 보완하면 A등급이 가능합니다.`;
  if (grade === 'C') return `기본기는 갖췄습니다. 경력 상세화와 기술 스택 보강을 권장합니다.`;
  return `이력서 작성을 시작했습니다. 각 섹션을 채워나가 보세요!`;
}

export default function ResumeScoreCard({ resume, onClose }: Props) {
  const result = calculateCompleteness(resume);
  const { percentage: pct, grade, sections } = result;
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const color =
    grade === 'S'
      ? '#7c3aed'
      : grade === 'A'
        ? '#3b82f6'
        : grade === 'B'
          ? '#22c55e'
          : grade === 'C'
            ? '#f97316'
            : '#ef4444';
  const topSkills = resume.skills
    .flatMap((s) =>
      s.items
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean),
    )
    .slice(0, 5);
  const expYears = resume.experiences.length;
  const name = resume.personalInfo.name || resume.title || '이력서';

  const shareText = [
    `📄 이력서공방에서 이력서 진단을 받았습니다!`,
    ``,
    `👤 ${name}`,
    `📊 이력서 완성도: ${pct}% (${grade}등급)`,
    topSkills.length > 0 ? `⚡ 주요 기술: ${topSkills.join(', ')}` : '',
    expYears > 0 ? `💼 경력: ${expYears}개 경력 보유` : '',
    ``,
    `${getGradeMessage(grade, pct)}`,
    ``,
    `🔗 이력서공방에서 무료로 이력서 진단받기`,
    `https://이력서공방.com`,
  ]
    .filter((l) => l !== null && l !== undefined && !(l === '' && topSkills.length === 0))
    .join('\n');

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast('공유 텍스트가 복사되었습니다', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('복사에 실패했습니다', 'error');
    }
  };

  const handleShareLinkedIn = () => {
    const text = encodeURIComponent(
      `이력서공방에서 이력서 진단 ${pct}% (${grade}등급)을 받았습니다! 무료로 이력서 진단받기 → 이력서공방.com #이력서 #취업 #이직`,
    );
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://이력서공방.com')}&summary=${text}`,
      '_blank',
    );
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `이력서공방 이력서 진단 결과 🎯\n\n완성도 ${pct}% / ${grade}등급 달성!\n\n${getGradeMessage(grade, pct)}\n\n무료로 내 이력서도 진단받기 👇`,
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <RadixDialog.Root
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[100] bg-black/50 animate-fade-in" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up focus:outline-none max-h-[90vh] overflow-y-auto"
        >
          <RadixDialog.Title className="sr-only">이력서 점수</RadixDialog.Title>
          <RadixDialog.Close asChild>
            <button
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              aria-label="닫기"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </RadixDialog.Close>

          {/* Card visual */}
          <div
            ref={cardRef}
            style={{ background: `linear-gradient(135deg, ${color}22, ${color}11)` }}
          >
            <div className="px-6 pt-8 pb-6" style={{ borderBottom: `3px solid ${color}33` }}>
              {/* Logo + Grade */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                    이력서공방
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Resume Score
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black" style={{ color }}>
                    {pct}%
                  </div>
                  <div className="text-sm font-bold" style={{ color }}>
                    {grade}등급
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="mb-5">
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-0.5 truncate">
                  {name}
                </div>
                {resume.experiences[0] && (
                  <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {resume.experiences[0].position} @ {resume.experiences[0].company}
                  </div>
                )}
              </div>

              {/* Section scores */}
              <div className="space-y-2">
                {sections.slice(0, 4).map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-20 shrink-0">
                      {s.label}
                    </span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round((s.score / s.maxScore) * 100)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium w-10 text-right" style={{ color }}>
                      {Math.round((s.score / s.maxScore) * 100)}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Skills */}
              {topSkills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {topSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 text-xs rounded-full border"
                      style={{ borderColor: `${color}40`, color, backgroundColor: `${color}10` }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Grade message */}
            <div className="px-6 py-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center italic">
                {getGradeEmoji(grade)} {getGradeMessage(grade, pct)}
              </p>
            </div>
          </div>

          {/* Share buttons */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-3">
              이 결과를 공유해보세요!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCopyText}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {copied ? '✅ 복사됨' : '📋 텍스트 복사'}
              </button>
              <button
                onClick={handleShareLinkedIn}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition-colors"
              >
                💼 LinkedIn
              </button>
              <button
                onClick={handleShareTwitter}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-medium transition-colors"
              >
                𝕏 Twitter
              </button>
            </div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
