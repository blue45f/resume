import * as RadixDialog from '@radix-ui/react-dialog';
import type { ResumeTheme } from '@/lib/resumeThemes';

interface Props {
  theme: ResumeTheme;
  onClose: () => void;
  onSelect: () => void;
}

export default function ThemePreviewModal({ theme, onClose, onSelect }: Props) {
  const p = theme.preview;

  return (
    <RadixDialog.Root
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[100] bg-black/60 animate-fade-in" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-3xl bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-fade-in-up flex flex-col focus:outline-none"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
            <div className="flex items-center gap-3">
              <RadixDialog.Title className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {theme.name}
              </RadixDialog.Title>
              {theme.premium && (
                <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full">
                  프리미엄
                </span>
              )}
            </div>
            <RadixDialog.Close asChild>
              <button
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </RadixDialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-neutral-200 dark:border-neutral-600 rounded-xl overflow-hidden shadow-sm">
                <div className="aspect-[210/297] relative bg-white">
                  <div
                    className="h-[28%] flex flex-col justify-end px-6 pb-4"
                    style={{ background: p?.headerBg || '#f1f5f9' }}
                  >
                    <div className="space-y-2">
                      <div
                        className="h-4 rounded w-1/2"
                        style={{ backgroundColor: p?.headerText || '#1e293b', opacity: 0.9 }}
                      />
                      <div
                        className="h-2 rounded w-2/3"
                        style={{ backgroundColor: p?.headerText || '#1e293b', opacity: 0.5 }}
                      />
                      <div className="flex gap-3">
                        <div
                          className="h-1.5 rounded w-20"
                          style={{ backgroundColor: p?.headerText || '#1e293b', opacity: 0.35 }}
                        />
                        <div
                          className="h-1.5 rounded w-24"
                          style={{ backgroundColor: p?.headerText || '#1e293b', opacity: 0.35 }}
                        />
                        <div
                          className="h-1.5 rounded w-16"
                          style={{ backgroundColor: p?.headerText || '#1e293b', opacity: 0.35 }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="h-1" style={{ backgroundColor: p?.accentBar || '#3b82f6' }} />
                  <div
                    className="px-6 pt-5 space-y-5"
                    style={{ backgroundColor: p?.bodyBg || '#ffffff' }}
                  >
                    <div className="space-y-1.5">
                      <div
                        className="h-2 rounded w-1/4"
                        style={{ backgroundColor: p?.accentBar || '#3b82f6', opacity: 0.8 }}
                      />
                      <div className="h-1.5 bg-neutral-200 rounded w-full" />
                      <div className="h-1.5 bg-neutral-200 rounded w-[90%]" />
                      <div className="h-1.5 bg-neutral-200 rounded w-3/4" />
                    </div>
                    <div className="space-y-1.5">
                      <div
                        className="h-2 rounded w-1/5"
                        style={{ backgroundColor: p?.accentBar || '#3b82f6', opacity: 0.8 }}
                      />
                      <div className="flex justify-between items-center">
                        <div className="h-2 bg-neutral-300 rounded w-2/5" />
                        <div className="h-1.5 bg-neutral-200 rounded w-1/6" />
                      </div>
                      <div className="h-1.5 bg-neutral-200 rounded w-1/3" />
                      <div className="h-1.5 bg-neutral-100 rounded w-full" />
                      <div className="h-1.5 bg-neutral-100 rounded w-[85%]" />
                    </div>
                    <div className="space-y-1.5">
                      <div
                        className="h-2 rounded w-1/6"
                        style={{ backgroundColor: p?.accentBar || '#3b82f6', opacity: 0.8 }}
                      />
                      <div className="flex justify-between items-center">
                        <div className="h-2 bg-neutral-300 rounded w-1/3" />
                        <div className="h-1.5 bg-neutral-200 rounded w-1/6" />
                      </div>
                      <div className="h-1.5 bg-neutral-200 rounded w-1/4" />
                    </div>
                    <div className="space-y-1.5">
                      <div
                        className="h-2 rounded w-1/6"
                        style={{ backgroundColor: p?.accentBar || '#3b82f6', opacity: 0.8 }}
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {[28, 22, 18, 24, 20, 16].map((w, i) => (
                          <div
                            key={i}
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${w}%`,
                              backgroundColor: p?.accentBar || '#3b82f6',
                              opacity: 0.15,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    테마 설명
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {theme.description}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    글꼴
                  </h3>
                  <p
                    className="text-sm text-neutral-600 dark:text-neutral-400"
                    style={{ fontFamily: theme.fontFamily }}
                  >
                    {theme.fontFamily.split(',')[0].replace(/'/g, '')}
                  </p>
                  <p
                    className="text-lg mt-1 text-neutral-800 dark:text-neutral-200"
                    style={{ fontFamily: theme.fontFamily }}
                  >
                    가나다라마바사 ABCDEFG 0123456789
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    컬러 팔레트
                  </h3>
                  <div className="flex gap-2">
                    {p && (
                      <>
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-600 shadow-inner"
                            style={{
                              background: p.headerBg.startsWith('linear')
                                ? p.accentBar
                                : p.headerBg,
                            }}
                          />
                          <span className="text-[10px] text-neutral-500">헤더</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-600 shadow-inner"
                            style={{ backgroundColor: p.accentBar }}
                          />
                          <span className="text-[10px] text-neutral-500">포인트</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-600 shadow-inner"
                            style={{ backgroundColor: p.headerText }}
                          />
                          <span className="text-[10px] text-neutral-500">텍스트</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-600 shadow-inner"
                            style={{ backgroundColor: p.bodyBg }}
                          />
                          <span className="text-[10px] text-neutral-500">배경</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {p?.bestFor && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      추천 대상
                    </h3>
                    <div className="flex gap-1.5 flex-wrap">
                      {p.bestFor.split(', ').map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {p?.category && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      카테고리
                    </h3>
                    <span className="px-2.5 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-full capitalize">
                      {p.category === 'basic'
                        ? '기본'
                        : p.category === 'professional'
                          ? '프로페셔널'
                          : p.category === 'creative'
                            ? '크리에이티브'
                            : p.category === 'academic'
                              ? '학술/연구'
                              : '테크/개발'}
                    </span>
                  </div>
                )}
                <div className="pt-2">
                  <button
                    onClick={onSelect}
                    className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
                  >
                    이 테마로 시작
                  </button>
                </div>
              </div>
            </div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
