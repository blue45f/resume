import { createElement } from 'react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { formatDate } from '@/lib/time';
import { policyPublicUrl, type PolicySlug } from '../api/policyApi';
import { usePolicy } from '../api/usePolicy';
import { parsePolicyBody, type PolicyBlock } from '../model/policyBody';

/** 신뢰 표면에 노출하는 content hash 축약 길이(앞 12자). */
const SHORT_HASH_LENGTH = 12;

function PolicyBody({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <div className="max-w-none">
      {blocks.map((block, index) => {
        if (block.kind === 'heading') {
          return createElement(
            `h${block.level}`,
            {
              key: index,
              className:
                'text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mt-8 first:mt-0',
            },
            block.text,
          );
        }
        if (block.kind === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag
              key={index}
              className={`text-sm text-slate-600 dark:text-slate-400 mt-3 space-y-1 ${
                block.ordered ? 'list-decimal' : 'list-disc'
              } list-inside`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ListTag>
          );
        }
        if (block.kind === 'divider') {
          return <hr key={index} className="my-6 border-slate-200 dark:border-slate-700" />;
        }
        return (
          <p
            key={index}
            className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed whitespace-pre-line"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

function PolicySkeleton() {
  return (
    <div role="status" aria-label="문서 불러오는 중" className="animate-pulse space-y-8">
      {[0, 1, 2].map((section) => (
        <div key={section} className="space-y-3">
          <div className="h-5 w-44 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-11/12 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

/**
 * TermsDesk 게시본 정책 문서 뷰어 — 본문 + 신뢰 표면(버전·시행일·해시·원문 링크).
 * 로딩은 스켈레톤, 실패는 ErrorState + 원문 폴백 링크.
 */
export function PolicyArticle({ slug, title }: { slug: PolicySlug; title: string }) {
  const { data, isPending, isError, refetch } = usePolicy(slug);
  const externalUrl = policyPublicUrl(slug);

  return (
    <article>
      <h1 className="heading-accent text-2xl font-bold text-slate-900 dark:text-slate-100">
        {data?.name ?? title}
      </h1>

      {data && (
        <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <dt className="text-slate-400 dark:text-slate-500">버전</dt>
            <dd className="font-semibold text-slate-600 dark:text-slate-300">
              {data.versionLabel}
            </dd>
          </div>
          {data.effectiveAt && (
            <div className="flex items-center gap-1.5">
              <dt className="text-slate-400 dark:text-slate-500">시행일</dt>
              <dd className="tabular-nums">{formatDate(data.effectiveAt)}</dd>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <dt className="text-slate-400 dark:text-slate-500">해시</dt>
            <dd>
              <code
                title={data.contentHash}
                className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {data.contentHash.slice(0, SHORT_HASH_LENGTH)}
              </code>
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">원문</dt>
            <dd>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
              >
                TermsDesk 원문 ↗
              </a>
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-8">
        {isPending && <PolicySkeleton />}

        {isError && (
          <div className="space-y-4">
            <ErrorState
              message="문서를 불러오지 못했습니다"
              hint="잠시 후 다시 시도하거나 TermsDesk 원문으로 확인해주세요."
              onRetry={() => void refetch()}
            />
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
            >
              TermsDesk 원문 보기 ↗
            </a>
          </div>
        )}

        {data && <PolicyBody blocks={parsePolicyBody(data.body)} />}
      </div>
    </article>
  );
}
