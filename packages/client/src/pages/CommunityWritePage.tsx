import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { getUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { API_URL } from '@/lib/config';
import { t, tx } from '@/lib/i18n';

const CATEGORY_PATTERN = /^[\w가-힣 ·/\-()]{1,24}$/;

const postSchema = z.object({
  title: z.string().min(2, '제목을 2자 이상 입력하세요').max(100, '제목은 100자 이내여야 합니다'),
  content: z
    .string()
    .min(10, '내용을 10자 이상 입력하세요')
    .max(10000, '내용은 10000자 이내여야 합니다'),
  category: z
    .string()
    .min(1, '카테고리를 선택하거나 입력하세요')
    .max(24, '카테고리는 24자 이내여야 합니다')
    .regex(CATEGORY_PATTERN, '한글·영문·숫자·공백·- · / ( ) 만 사용 가능합니다'),
});

type PostForm = z.infer<typeof postSchema>;

interface CategoryDef {
  id: string;
  labelKey: string;
  icon: string;
  adminOnly?: boolean;
}
const CATEGORY_DEFS: CategoryDef[] = [
  { id: 'notice', labelKey: 'community.category.notice', icon: '📢', adminOnly: true },
  { id: 'free', labelKey: 'community.category.free', icon: '💬' },
  { id: 'tips', labelKey: 'community.category.tips', icon: '💡' },
  { id: 'resume', labelKey: 'community.category.resume', icon: '📄' },
  { id: 'cover-letter', labelKey: 'community.category.coverLetter', icon: '✍️' },
  { id: 'question', labelKey: 'community.category.question', icon: '❓' },
];
const getCATEGORIES = () =>
  CATEGORY_DEFS.map((c) => ({
    id: c.id,
    label: tx(c.labelKey),
    icon: c.icon,
    adminOnly: c.adminOnly,
  }));

// ── Markdown renderer for preview ────────────────────────────────────────────
function renderMarkdown(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = text.split('\n');
  const out: string[] = [];
  let inCode = false;
  let inList = false;
  let inQuote = false;

  const closeList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };
  const closeQuote = () => {
    if (inQuote) {
      out.push('</blockquote>');
      inQuote = false;
    }
  };

  for (const raw of lines) {
    // Code block fence
    if (raw.startsWith('```')) {
      closeList();
      closeQuote();
      if (!inCode) {
        out.push(
          '<pre class="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 overflow-x-auto text-sm font-mono my-3 text-slate-800 dark:text-slate-200">',
        );
        inCode = true;
      } else {
        out.push('</pre>');
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      out.push(escape(raw));
      continue;
    }

    // Headings
    if (raw.startsWith('### ')) {
      closeList();
      closeQuote();
      out.push(
        `<h3 class="text-lg font-bold mt-5 mb-2 text-slate-900 dark:text-slate-100">${escape(raw.slice(4))}</h3>`,
      );
      continue;
    }
    if (raw.startsWith('## ')) {
      closeList();
      closeQuote();
      out.push(
        `<h2 class="text-xl font-bold mt-6 mb-2 text-slate-900 dark:text-slate-100">${escape(raw.slice(3))}</h2>`,
      );
      continue;
    }
    if (raw.startsWith('# ')) {
      closeList();
      closeQuote();
      out.push(
        `<h1 class="text-2xl font-bold mt-6 mb-3 text-slate-900 dark:text-slate-100">${escape(raw.slice(2))}</h1>`,
      );
      continue;
    }

    // Blockquote
    if (raw.startsWith('> ')) {
      closeList();
      if (!inQuote) {
        out.push(
          '<blockquote class="border-l-4 border-indigo-400 pl-4 my-3 text-slate-500 dark:text-slate-400 italic">',
        );
        inQuote = true;
      }
      out.push(`<p class="mb-1">${inlineFormat(escape(raw.slice(2)))}</p>`);
      continue;
    } else {
      closeQuote();
    }

    // Unordered list
    if (raw.startsWith('- ') || raw.startsWith('* ')) {
      if (!inList) {
        out.push(
          '<ul class="list-disc list-inside my-2 space-y-1 text-slate-700 dark:text-slate-300">',
        );
        inList = true;
      }
      out.push(`<li>${inlineFormat(escape(raw.slice(2)))}</li>`);
      continue;
    } else {
      closeList();
    }

    // Ordered list
    const olMatch = raw.match(/^(\d+)\. (.+)/);
    if (olMatch) {
      closeList();
      closeQuote();
      // simple: just render as paragraph with number
      out.push(
        `<p class="my-1 ml-4 text-slate-700 dark:text-slate-300">${olMatch[1]}. ${inlineFormat(escape(olMatch[2]))}</p>`,
      );
      continue;
    }

    // Horizontal rule
    if (raw === '---' || raw === '***') {
      closeList();
      closeQuote();
      out.push('<hr class="my-4 border-slate-200 dark:border-slate-700" />');
      continue;
    }

    // Empty line
    if (raw.trim() === '') {
      closeList();
      closeQuote();
      out.push('<div class="h-3" />');
      continue;
    }

    // Normal paragraph
    out.push(
      `<p class="my-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">${inlineFormat(escape(raw))}</p>`,
    );
  }
  closeList();
  closeQuote();
  if (inCode) out.push('</pre>');
  return out.join('\n');
}

function inlineFormat(s: string): string {
  // Bold+italic
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  s = s.replace(
    /`([^`]+)`/g,
    '<code class="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>',
  );
  // Strikethrough
  s = s.replace(/~~(.+?)~~/g, '<del class="opacity-60">$1</del>');
  // Link
  s = s.replace(
    /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener" class="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:opacity-80">$1</a>',
  );
  // Auto URL
  s = s.replace(
    /(^|[\s])(https?:\/\/[^\s<]+)/g,
    '$1<a href="$2" target="_blank" rel="noopener" class="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:opacity-80">$2</a>',
  );
  return s;
}

// ── Toolbar button helper ────────────────────────────────────────────────────
interface ToolbarAction {
  label: string;
  icon: string;
  title: string;
  wrap?: [string, string]; // wrap selection
  prefix?: string; // prefix each line
  block?: string; // insert block at cursor
}

const TOOLBAR: (ToolbarAction | null)[] = [
  { label: 'H2', icon: 'H2', title: '제목2', wrap: ['## ', ''] },
  { label: 'H3', icon: 'H3', title: '제목3', wrap: ['### ', ''] },
  null,
  { label: 'Bold', icon: 'B', title: '굵게 (Ctrl+B)', wrap: ['**', '**'] },
  { label: 'Italic', icon: 'I', title: '기울임 (Ctrl+I)', wrap: ['*', '*'] },
  { label: 'Strike', icon: 'S', title: '취소선', wrap: ['~~', '~~'] },
  null,
  { label: 'Code', icon: '<>', title: '인라인 코드', wrap: ['`', '`'] },
  { label: 'CodeBlock', icon: '{ }', title: '코드블록', block: '```\n\n```' },
  null,
  { label: 'Quote', icon: '❝', title: '인용', prefix: '> ' },
  { label: 'List', icon: '≡', title: '목록', prefix: '- ' },
  null,
  { label: 'Link', icon: '🔗', title: '링크', wrap: ['[', '](url)'] },
  { label: 'HR', icon: '──', title: '구분선', block: '\n---\n' },
];

export default function CommunityWritePage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const user = getUser();

  // ?category= 쿼리로부터 기본값 읽기 (커뮤니티 리스트 → 글쓰기 진입 시 현재 필터 유지)
  const [searchParams] = useSearchParams();
  const initialCategory = (() => {
    const q = searchParams.get('category');
    const valid = ['notice', 'free', 'tips', 'resume', 'cover-letter', 'interview', 'question'];
    return q && valid.includes(q) ? q : 'free';
  })();
  const initialTitle = searchParams.get('title') || '';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: { title: initialTitle, content: '', category: initialCategory },
  });

  const title = watch('title');
  const content = watch('content');
  const category = watch('category');

  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);
  const [customCatMode, setCustomCatMode] = useState(false);
  const [customCat, setCustomCat] = useState('');
  const [attachments, setAttachments] = useState<
    { url: string; name: string; size: number; type: string }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // 서버 Draft 로드
  useEffect(() => {
    if (isEdit || !user) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_URL}/api/health/drafts/community_post`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.title) setValue('title', d.title);
        if (d?.content) setValue('content', d.content);
        if (d?.category) setValue('category', d.category);
      })
      .catch(() => {});
  }, [isEdit, user?.id, setValue]);

  // 서버 Draft 자동 저장 (3초 디바운스)
  useEffect(() => {
    if (isEdit || !user) return;
    const sub = watch((values) => {
      // no-op: subscription body handled via timer below
      void values;
    });
    const timer = setTimeout(() => {
      if (title?.trim() || content?.trim()) {
        const token = localStorage.getItem('token');
        if (!token) return;
        fetch(`${API_URL}/api/health/drafts/community_post`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title, content, category }),
        })
          .then(() => {
            setDraftSaved(true);
            setTimeout(() => setDraftSaved(false), 2000);
          })
          .catch(() => {});
      }
    }, 3000);
    return () => {
      clearTimeout(timer);
      sub.unsubscribe();
    };
  }, [title, content, category, isEdit, user?.id, watch]);

  const clearDraft = () => {
    const token = localStorage.getItem('token');
    if (token)
      fetch(`${API_URL}/api/health/drafts/community_post`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user) navigate(ROUTES.login);
  }, [user, navigate]);

  const { data: editData } = useQuery({
    queryKey: ['community-post', id],
    queryFn: async () => {
      const r = await fetch(`${API_URL}/api/community/${id}`);
      return r.ok ? await r.json() : null;
    },
    enabled: !!isEdit && !!id,
  });

  useEffect(() => {
    if (editData) {
      setValue('title', editData.title || '');
      setValue('content', editData.content || '');
      const cat = editData.category || 'free';
      setValue('category', cat);
      if (!CATEGORY_DEFS.some((c) => c.id === cat)) {
        setCustomCatMode(true);
        setCustomCat(cat);
      }
      setAttachments(Array.isArray(editData.attachments) ? editData.attachments : []);
    }
  }, [editData, setValue]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const token = localStorage.getItem('token');
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        setError(`${file.name}: 20MB 이하 파일만 첨부 가능합니다.`);
        continue;
      }
      if (attachments.length >= 5) {
        setError('첨부파일은 최대 5개까지 가능합니다.');
        break;
      }
      const formData = new FormData();
      formData.append('file', file);
      const r = await fetch(`${API_URL}/api/community/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (r.ok) {
        const data = await r.json();
        setAttachments((prev) => [...prev, data]);
      } else {
        setError(`${file.name} 업로드 실패`);
      }
    }
    setUploading(false);
  };

  // ── Apply toolbar action ───────────────────────────────────────────────
  const applyAction = useCallback(
    (action: ToolbarAction) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const currentContent = content || '';
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = currentContent.slice(start, end);
      let newContent = currentContent;
      let newCursorStart = start;
      let newCursorEnd = end;

      if (action.block) {
        newContent = currentContent.slice(0, start) + action.block + currentContent.slice(end);
        newCursorStart = newCursorEnd = start + action.block.length;
      } else if (action.prefix) {
        const before = currentContent.slice(0, start);
        const lineStart = before.lastIndexOf('\n') + 1;
        const lineContent = currentContent.slice(lineStart, end);
        const prefixed = lineContent
          .split('\n')
          .map((l) =>
            l.startsWith(action.prefix!) ? l.slice(action.prefix!.length) : action.prefix + l,
          )
          .join('\n');
        newContent = currentContent.slice(0, lineStart) + prefixed + currentContent.slice(end);
        newCursorStart = lineStart;
        newCursorEnd = lineStart + prefixed.length;
      } else if (action.wrap) {
        const [pre, post] = action.wrap;
        if (selected) {
          newContent =
            currentContent.slice(0, start) + pre + selected + post + currentContent.slice(end);
          newCursorStart = start + pre.length;
          newCursorEnd = start + pre.length + selected.length;
        } else {
          const placeholder = '텍스트';
          newContent =
            currentContent.slice(0, start) + pre + placeholder + post + currentContent.slice(end);
          newCursorStart = start + pre.length;
          newCursorEnd = start + pre.length + placeholder.length;
        }
      }

      setValue('content', newContent, { shouldValidate: true, shouldDirty: true });
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(newCursorStart, newCursorEnd);
      });
    },
    [content, setValue],
  );

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b') {
          e.preventDefault();
          applyAction({ label: 'Bold', icon: 'B', title: '', wrap: ['**', '**'] });
        }
        if (e.key === 'i') {
          e.preventDefault();
          applyAction({ label: 'Italic', icon: 'I', title: '', wrap: ['*', '*'] });
        }
        if (e.key === 'k') {
          e.preventDefault();
          applyAction({ label: 'Code', icon: '', title: '', wrap: ['`', '`'] });
        }
      }
      const currentContent = content || '';
      // Auto-indent list continuation
      if (e.key === 'Enter') {
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const before = currentContent.slice(0, start);
        const lineStart = before.lastIndexOf('\n') + 1;
        const currentLine = before.slice(lineStart);
        const listMatch = currentLine.match(/^(- |\* |\d+\. )/);
        if (listMatch) {
          e.preventDefault();
          const prefix = listMatch[1];
          const newContent =
            currentContent.slice(0, start) + '\n' + prefix + currentContent.slice(ta.selectionEnd);
          setValue('content', newContent, { shouldValidate: true, shouldDirty: true });
          requestAnimationFrame(() => {
            ta.setSelectionRange(start + 1 + prefix.length, start + 1 + prefix.length);
          });
        }
      }
      // Tab → insert 2 spaces
      if (e.key === 'Tab') {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newContent = currentContent.slice(0, start) + '  ' + currentContent.slice(end);
        setValue('content', newContent, { shouldValidate: true, shouldDirty: true });
        requestAnimationFrame(() => {
          ta.setSelectionRange(start + 2, start + 2);
        });
      }
    },
    [content, applyAction, setValue],
  );

  const onSubmit = async (values: PostForm) => {
    setError('');

    const token = localStorage.getItem('token');
    const url = isEdit ? `${API_URL}/api/community/${id}` : `${API_URL}/api/community`;
    const method = isEdit ? 'PATCH' : 'POST';

    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: values.title.trim(),
        content: values.content.trim(),
        category: values.category,
        attachments,
      }),
    });

    if (r.ok) {
      const data = await r.json();
      clearDraft();
      navigate(ROUTES.community.post(isEdit ? (id as string) : data.id));
    } else {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const charCount = (content || '').replace(/\s/g, '').length;
  const titleRegister = register('title');
  const contentRegister = register('content');

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isEdit ? t('community.write') + ' 수정' : t('community.write')}
            </h1>
            {draftSaved && !isEdit && (
              <span className="text-[10px] text-emerald-500 animate-fade-in flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                자동 저장됨
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">Ctrl+B 굵게</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Ctrl+I 기울임</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Ctrl+K 코드</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              카테고리
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {getCATEGORIES()
                .filter(
                  (cat) =>
                    !('adminOnly' in cat && cat.adminOnly) ||
                    user?.role === 'admin' ||
                    user?.role === 'superadmin',
                )
                .map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCustomCatMode(false);
                      setValue('category', cat.id, { shouldValidate: true, shouldDirty: true });
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl border transition-all ${
                      category === cat.id && !customCatMode
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              {!customCatMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setCustomCatMode(true);
                    setCustomCat('');
                    setValue('category', '', { shouldValidate: false });
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                  aria-label="새 카테고리 입력"
                >
                  <span aria-hidden>＋</span> 새 카테고리
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl border border-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20">
                  <input
                    type="text"
                    value={customCat}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCustomCat(v);
                      setValue('category', v, { shouldValidate: true, shouldDirty: true });
                    }}
                    placeholder="예: 테크면접, 신입공채"
                    maxLength={24}
                    autoFocus
                    className="w-32 sm:w-48 px-2 py-1 text-sm bg-transparent border-0 outline-none text-indigo-700 dark:text-indigo-300 placeholder-indigo-300 dark:placeholder-indigo-500/60"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCatMode(false);
                      setCustomCat('');
                      setValue('category', 'free', { shouldValidate: true });
                    }}
                    className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 px-1"
                    aria-label="커스텀 카테고리 취소"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            {errors.category?.message && (
              <p className="mt-1.5 text-xs text-red-500" role="alert">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              제목
            </label>
            <input
              type="text"
              {...titleRegister}
              placeholder="제목을 입력하세요"
              maxLength={100}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
            <div className="flex items-center justify-between mt-1">
              {errors.title?.message ? (
                <span className="text-xs text-red-500">{errors.title.message}</span>
              ) : (
                <span />
              )}
              <div className="text-right text-xs text-slate-400">{(title || '').length}/100</div>
            </div>
          </div>

          {/* Editor */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              {TOOLBAR.map((action, idx) =>
                action === null ? (
                  <div
                    key={`sep-${idx}`}
                    className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"
                  />
                ) : (
                  <button
                    key={action.label}
                    type="button"
                    title={action.title}
                    onClick={() => applyAction(action)}
                    className={`px-2 py-1 text-xs rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono select-none ${
                      action.label === 'Bold'
                        ? 'font-bold'
                        : action.label === 'Italic'
                          ? 'italic'
                          : action.label === 'Strike'
                            ? 'line-through'
                            : ''
                    }`}
                  >
                    {action.icon}
                  </button>
                ),
              )}
              <div className="flex-1" />
              {/* Preview toggle */}
              <button
                type="button"
                onClick={() => setPreview((p) => !p)}
                className={`ml-2 px-3 py-1 text-xs rounded-lg border transition-all ${
                  preview
                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {preview ? '✏️ 편집' : '👁 미리보기'}
              </button>
            </div>

            {/* Editor / Preview pane */}
            {preview ? (
              <div
                className="min-h-[360px] max-h-[600px] overflow-y-auto px-5 py-4 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: content
                    ? renderMarkdown(content)
                    : '<p class="text-slate-400">내용이 없습니다.</p>',
                }}
              />
            ) : (
              <textarea
                {...contentRegister}
                ref={(el) => {
                  contentRegister.ref(el);
                  textareaRef.current = el;
                }}
                onKeyDown={handleKeyDown}
                placeholder={`내용을 마크다운으로 작성하세요 (최소 10자)\n\n**굵게** *기울임* \`코드\`\n## 제목\n- 목록 항목\n> 인용문`}
                rows={18}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-y font-mono leading-relaxed"
              />
            )}

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
              <span className="text-xs text-slate-400">
                마크다운 지원 · Tab 들여쓰기 · Enter 목록 자동완성
              </span>
              <span className={`text-xs ${charCount > 5000 ? 'text-red-500' : 'text-slate-400'}`}>
                {charCount.toLocaleString()}자
              </span>
            </div>
          </div>
          {errors.content?.message && (
            <div className="text-xs text-red-500 -mt-2">{errors.content.message}</div>
          )}

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                첨부파일{' '}
                <span className="text-xs text-slate-400 font-normal">
                  ({attachments.length}/5 · 최대 20MB)
                </span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || attachments.length >= 5}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 transition-colors"
              >
                {uploading ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                )}
                {uploading ? '업로드 중...' : '파일 첨부'}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <span className="text-base flex-shrink-0">
                      {att.type.startsWith('image/')
                        ? '🖼️'
                        : att.type === 'application/pdf'
                          ? '📄'
                          : '📎'}
                    </span>
                    <span className="flex-1 truncate text-slate-700 dark:text-slate-300">
                      {att.name}
                    </span>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {(att.size / 1024).toFixed(0)}KB
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                      aria-label="첨부파일 삭제"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Markdown cheatsheet (collapsible hint) */}
          <details className="group">
            <summary className="cursor-pointer text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 select-none list-none flex items-center gap-1">
              <svg
                className="w-3 h-3 transition-transform group-open:rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              마크다운 단축키 보기
            </summary>
            <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500 dark:text-slate-400 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                ['**굵게**', '굵은 텍스트'],
                ['*기울임*', '기울인 텍스트'],
                ['~~취소선~~', '취소선'],
                ['`코드`', '인라인 코드'],
                ['```\\n코드\\n```', '코드 블록'],
                ['> 텍스트', '인용'],
                ['## 제목', '2단계 제목'],
                ['### 제목', '3단계 제목'],
                ['- 항목', '목록'],
                ['[링크텍스트](URL)', '하이퍼링크'],
                ['---', '구분선'],
              ].map(([syntax, desc]) => (
                <div key={syntax} className="flex flex-col gap-0.5">
                  <code className="font-mono text-indigo-600 dark:text-indigo-400">{syntax}</code>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </details>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              {isSubmitting
                ? t('common.loading')
                : isEdit
                  ? t('common.edit')
                  : t('community.write')}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
