import { Link } from 'react-router-dom';

interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  items: Crumb[];
}

export default function Breadcrumb({ items }: Props) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-4 no-print" aria-label="breadcrumb">
      <Link to="/" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">홈</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {item.to ? (
            <Link to={item.to} className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">{item.label}</Link>
          ) : (
            <span className="text-slate-700 dark:text-slate-200 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
