import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import { getUser } from '@/lib/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

const CATEGORIES = [
  { id: 'free', label: '자유', icon: '💬' },
  { id: 'tips', label: '취업팁', icon: '💡' },
  { id: 'resume', label: '이력서피드백', icon: '📄' },
  { id: 'cover-letter', label: '자소서', icon: '✍️' },
  { id: 'question', label: '질문', icon: '❓' },
];

export default function CommunityWritePage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const user = getUser();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('free');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (isEdit) {
      fetch(`${API_URL}/api/community/${id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setTitle(data.title || '');
            setContent(data.content || '');
            setCategory(data.category || 'free');
          }
        });
    }
  }, [id, isEdit, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('제목을 입력해주세요.'); return; }
    if (!content.trim()) { setError('내용을 입력해주세요.'); return; }
    if (content.trim().length < 10) { setError('내용을 10자 이상 입력해주세요.'); return; }

    setSaving(true);
    setError('');

    const token = localStorage.getItem('token');
    const url = isEdit ? `${API_URL}/api/community/${id}` : `${API_URL}/api/community`;
    const method = isEdit ? 'PATCH' : 'POST';

    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: title.trim(), content: content.trim(), category }),
    });

    if (r.ok) {
      const data = await r.json();
      navigate(`/community/${isEdit ? id : data.id}`);
    } else {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    }
    setSaving(false);
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isEdit ? '게시글 수정' : '글쓰기'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl border transition-all ${
                    category === cat.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={100}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
            <div className="text-right text-xs text-slate-400 mt-1">{title.length}/100</div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">내용</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="내용을 입력하세요 (최소 10자)"
              rows={16}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-y"
            />
            <div className="text-right text-xs text-slate-400 mt-1">{content.length}자</div>
          </div>

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
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              {saving ? '저장 중...' : isEdit ? '수정하기' : '게시하기'}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
