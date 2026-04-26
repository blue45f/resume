import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  items: Crumb[];
}

export default function Breadcrumb({ items }: Props) {
  const lastIndex = items.length - 1;
  return (
    <nav
      className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-4 no-print"
      aria-label="breadcrumb"
    >
      <Link
        to={ROUTES.home}
        className="hover:text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-[var(--radius-sm)]"
      >
        홈
      </Link>
      {items.map((item, i) => {
        const isLast = i === lastIndex;
        return (
          <span key={i} className="flex items-center gap-2">
            <svg
              className="w-3.5 h-3.5 text-[var(--color-border)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="hover:text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-[var(--radius-sm)]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="text-[var(--color-text)] font-medium truncate max-w-[180px] sm:max-w-xs"
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
