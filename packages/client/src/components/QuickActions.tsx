import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DropdownMenu from '@/shared/ui/DropdownMenu';
import { getUser } from '@/lib/auth';

const ACTIONS = [
  { label: '새 이력서', to: '/resumes/new', icon: '📝' },
  { label: 'AI 자동 생성', to: '/auto-generate', icon: '🤖' },
  { label: '자소서 생성', to: '/cover-letter', icon: '✉️' },
  { label: '면접 준비', to: '/interview-prep', icon: '🎯' },
  { label: '이력서 비교', to: '/compare', icon: '⚖️' },
];

const RECRUITER_ACTIONS = [
  { label: '채용공고 등록', to: '/jobs/new', icon: '📋' },
  { label: '스카우트', to: '/scouts', icon: '🔍' },
];

export default function QuickActions() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = getUser();
  const isRecruiter = user?.userType === 'recruiter' || user?.userType === 'company';

  const actions = isRecruiter ? [...ACTIONS, ...RECRUITER_ACTIONS] : ACTIONS;

  return (
    <div className="fixed bottom-20 sm:bottom-20 right-4 sm:right-6 z-40 no-print">
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            className={`btn-press w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
              open
                ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 rotate-45 scale-90'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl hover:scale-105'
            }`}
            aria-label={open ? '빠른 메뉴 닫기' : '빠른 메뉴 열기'}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content side="top" align="end" sideOffset={12}>
          {actions.map((action) => (
            <DropdownMenu.Item
              key={action.to}
              onSelect={() => navigate(action.to)}
              className="gap-2.5"
            >
              <span className="text-base" aria-hidden="true">
                {action.icon}
              </span>
              <span>{action.label}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
}
