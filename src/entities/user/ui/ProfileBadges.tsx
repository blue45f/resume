interface Props {
  resumeCount: number;
  commentCount?: number;
  isAdmin?: boolean;
  userType?: string;
}

const badges = [
  { id: 'first', label: '첫 이력서', icon: '📝', condition: (p: Props) => p.resumeCount >= 1 },
  { id: 'prolific', label: '이력서 5개+', icon: '📚', condition: (p: Props) => p.resumeCount >= 5 },
  {
    id: 'helper',
    label: '조언자',
    icon: '💬',
    condition: (p: Props) => (p.commentCount || 0) >= 3,
  },
  { id: 'admin', label: '관리자', icon: '👑', condition: (p: Props) => p.isAdmin === true },
  {
    id: 'recruiter',
    label: '리크루터',
    icon: '🔍',
    condition: (p: Props) => p.userType === 'recruiter',
  },
  { id: 'company', label: '기업', icon: '🏢', condition: (p: Props) => p.userType === 'company' },
];

export default function ProfileBadges(props: Props) {
  const earned = badges.filter((b) => b.condition(props));
  if (earned.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {earned.map((b) => (
        <span key={b.id} className="badge-sm badge-amber" title={b.label}>
          {b.icon} {b.label}
        </span>
      ))}
    </div>
  );
}
