interface Props {
  resumeCount: number;
  commentCount?: number;
  isAdmin?: boolean;
}

const badges = [
  { id: 'first', label: '첫 이력서', icon: '📝', condition: (p: Props) => p.resumeCount >= 1 },
  { id: 'prolific', label: '이력서 5개+', icon: '📚', condition: (p: Props) => p.resumeCount >= 5 },
  { id: 'helper', label: '조언자', icon: '💬', condition: (p: Props) => (p.commentCount || 0) >= 3 },
  { id: 'admin', label: '관리자', icon: '👑', condition: (p: Props) => p.isAdmin === true },
];

export default function ProfileBadges(props: Props) {
  const earned = badges.filter(b => b.condition(props));
  if (earned.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {earned.map(b => (
        <span
          key={b.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full"
          title={b.label}
        >
          {b.icon} {b.label}
        </span>
      ))}
    </div>
  );
}
