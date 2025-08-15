import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { toast } from '@/components/Toast';
import type { Tag } from '@/types/resume';
import { fetchTags, createTag, deleteTag } from '@/lib/api';

const COLOR_PRESETS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export default function TagsPage() {
  const [tags, setTags] = useState<(Tag & { resumeCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchTags().then(t => { if (!cancelled) { setTags(t); setLoading(false); } }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      await createTag({ name: newName.trim(), color: newColor });
      setNewName('');
      toast('태그가 생성되었습니다', 'success');
      setTags(await fetchTags());
    } catch (err: any) {
      setError(err.message || '태그 생성에 실패했습니다');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 태그를 삭제하시겠습니까?`)) return;
    try {
      await deleteTag(id);
      toast('태그가 삭제되었습니다', 'success');
      setTags(await fetchTags());
    } catch (err: any) {
      toast(err.message || '삭제에 실패했습니다', 'error');
    }
  };

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">태그 관리</h1>

        {/* Create form */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">새 태그 추가</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="tag-name" className="sr-only">태그 이름</label>
              <input
                id="tag-name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="태그 이름 (예: 프론트엔드, 2026 상반기)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 shrink-0">색상:</span>
              <div className="flex gap-1">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform focus:outline-none ${
                      newColor === c ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`색상 ${c}`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shrink-0"
            >
              {creating ? '추가 중...' : '추가'}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Tag list */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 animate-pulse">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3 px-6 py-3">
                <div className="w-4 h-4 bg-slate-200 rounded-full" />
                <div className="h-4 bg-slate-200 rounded w-24" />
                <div className="h-3 bg-slate-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : tags.length === 0 ? (
          <p className="text-center text-slate-500 py-12">등록된 태그가 없습니다</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center justify-between px-4 sm:px-6 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm font-medium text-slate-900 truncate">{tag.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">
                    이력서 {tag.resumeCount}개
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(tag.id, tag.name)}
                  className="ml-3 px-3 py-1 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors shrink-0"
                  aria-label={`${tag.name} 삭제`}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
