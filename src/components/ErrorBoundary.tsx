import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
          <div className="text-center p-8 max-w-md">
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              문제가 발생했습니다
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              일시적인 오류가 발생했습니다.
              <br />
              잠시 후 다시 시도하거나, 홈 페이지로 이동해주세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors font-medium"
              >
                다시 시도
              </button>
              <a
                href="/"
                className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                홈으로 돌아가기
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
