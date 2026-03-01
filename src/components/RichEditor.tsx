import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichEditor({ value, onChange, placeholder, className }: Props) {
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
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[80px] px-3 py-2',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // 빈 에디터면 빈 문자열 반환
      onChange(html === '<p></p>' ? '' : html);
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

  if (!editor) return null;

  return (
    <div className={`border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-colors dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 ${className || ''}`}>
      {/* Toolbar */}
      <div role="toolbar" aria-label="텍스트 서식" className="flex items-center gap-0.5 px-2 py-1 bg-slate-50 border-b border-slate-200 dark:bg-slate-800 dark:border-slate-600">
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
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <ToolbarBtn
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="글머리 기호"
          ariaLabel="목록"
          ariaPressed={editor.isActive('bulletList')}
        >
          •
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="번호 매기기"
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
          🔗
        </ToolbarBtn>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({ active, onClick, title, ariaLabel, ariaPressed, children }: { active: boolean; onClick: () => void; title: string; ariaLabel?: string; ariaPressed?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-colors dark:text-slate-300 dark:hover:bg-slate-700 ${
        active ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}
