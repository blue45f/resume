import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect, useState, useCallback, useRef } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  onAiImprove?: (selectedText: string) => void;
}

export default function RichEditor({
  value,
  onChange,
  placeholder,
  className,
  maxLength,
  onAiImprove,
}: Props) {
  const [, setShowAiButton] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const aiButtonRef = useRef<HTMLButtonElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-600 underline' },
      }),
      Placeholder.configure({
        placeholder: placeholder || '내용을 입력하세요...',
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      ...(maxLength ? [CharacterCount.configure({ limit: maxLength })] : [CharacterCount]),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[80px] px-3 py-2',
      },
      handleKeyDown: (_view, _event) => {
        // Markdown shortcuts handled by StarterKit's inputRules
        // Additional Ctrl shortcuts
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      setShowAiButton(from !== to);
    },
  });

  // 외부에서 value가 변경될 때 (초기값 설정)
  useEffect(() => {
    if (editor && value && !editor.isFocused) {
      const currentHtml = editor.getHTML();
      if (currentHtml !== value && value !== '<p></p>') {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  const handleAiImprove = useCallback(async () => {
    if (!editor || !onAiImprove) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (!selectedText.trim()) return;
    setAiLoading(true);
    try {
      onAiImprove(selectedText);
    } finally {
      setAiLoading(false);
    }
  }, [editor, onAiImprove]);

  if (!editor) return null;

  const charCount = editor.storage.characterCount?.characters() ?? 0;
  const wordCount = editor.storage.characterCount?.words() ?? 0;
  const isOverLimit = maxLength ? charCount > maxLength : false;
  const charPercentage = maxLength ? Math.min(100, (charCount / maxLength) * 100) : 0;

  return (
    <div
      className={`border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-colors dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 ${className || ''}`}
    >
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label="텍스트 서식"
        className="flex items-center gap-0.5 px-2 py-1 bg-slate-50 border-b border-slate-200 dark:bg-slate-800 dark:border-slate-600"
      >
        <ToolbarBtn
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="굵게 (Ctrl+B)"
          ariaLabel="굵게"
          ariaPressed={editor.isActive('bold')}
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="기울임 (Ctrl+I)"
          ariaLabel="기울임"
          ariaPressed={editor.isActive('italic')}
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="취소선 (Ctrl+Shift+X)"
          ariaLabel="취소선"
          ariaPressed={editor.isActive('strike')}
        >
          <span className="line-through">S</span>
        </ToolbarBtn>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <ToolbarBtn
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="글머리 기호 (마크다운: - 또는 * )"
          ariaLabel="목록"
          ariaPressed={editor.isActive('bulletList')}
        >
          &#8226;
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="번호 매기기 (마크다운: 1. )"
          ariaLabel="번호 목록"
          ariaPressed={editor.isActive('orderedList')}
        >
          1.
        </ToolbarBtn>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <ToolbarBtn
          active={editor.isActive('link')}
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run();
            } else {
              const url = prompt('URL을 입력하세요:');
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          title="링크"
          ariaLabel="링크 추가"
          ariaPressed={editor.isActive('link')}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101"
            />
          </svg>
        </ToolbarBtn>

        {/* Markdown hint */}
        <div className="ml-auto text-[10px] text-slate-400 hidden sm:block">
          **굵게** &middot; *기울임* &middot; - 목록
        </div>
      </div>

      {/* Floating AI Improve Button (BubbleMenu) */}
      {onAiImprove && (
        <BubbleMenu
          editor={editor}
          options={{
            placement: 'top',
          }}
          shouldShow={({ editor }) => {
            const { from, to } = editor.state.selection;
            return from !== to;
          }}
        >
          <button
            ref={aiButtonRef}
            type="button"
            onClick={handleAiImprove}
            disabled={aiLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-sky-700 text-white text-xs font-medium rounded-lg shadow-lg hover:from-blue-700 hover:to-sky-700 disabled:opacity-60 transition-all"
          >
            {aiLoading ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            )}
            AI 개선
          </button>
        </BubbleMenu>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Character count bar */}
      <div className="flex items-center justify-between px-2 py-1 bg-slate-50 border-t border-slate-200 dark:bg-slate-800 dark:border-slate-600">
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span>{charCount}자</span>
          {wordCount > 0 && <span>&middot; {wordCount}단어</span>}
        </div>
        {maxLength && (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverLimit ? 'bg-red-500' : charPercentage > 80 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, charPercentage)}%` }}
              />
            </div>
            <span
              className={`text-[10px] tabular-nums ${isOverLimit ? 'text-red-500 font-medium' : 'text-slate-400'}`}
            >
              {charCount}/{maxLength}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarBtn({
  active,
  onClick,
  title,
  ariaLabel,
  ariaPressed,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-colors dark:text-slate-300 dark:hover:bg-slate-700 ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}
