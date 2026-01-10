import { useState, useEffect, useRef } from 'react';
import type { Tag } from '@/types/resume';
import { fetchTags, addTagToResume, removeTagFromResume, createTag } from '@/lib/api';

interface Props {
  resumeId: string;
  currentTags: Tag[];
  onUpdate: () => void;
}

export default function TagSelector({ resumeId, currentTags, onUpdate }: Props) {
  const [allTags, setAllTags] = useState<(Tag & { resumeCount: number })[]>([]);
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) fetchTags().then(setAllTags).catch(() => {});
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentIds = new Set(currentTags.map(t => t.id));

  const handleToggle = async (tagId: string) => {
    if (currentIds.has(tagId)) {
      await removeTagFromResume(tagId, resumeId);
    } else {
      await addTagToResume(tagId, resumeId);
    }
    onUpdate();
  };

  const handleCreateAndAdd = async () => {
    if (!newTagName.trim()) return;
    setCreating(true);
    try {
      const tag = await createTag({ name: newTagName.trim() });
      await addTagToResume(tag.id, resumeId);
      setNewTagName('');
      onUpdate();
      fetchTags().then(setAllTags);
    } catch {
      // tag might already exist
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={ref} className="relative inline-block">
      {/* Current tags + add button */}
      <div className="flex flex-wrap items-center gap-1.5">
        {currentTags.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
          >
            {tag.name}
            <button
              onClick={() => handleToggle(tag.id)}
              className="hover:opacity-70 focus:outline-none"
              aria-label={`${tag.name} 태그 제거`}
            >
              &times;
            </button>
          </span>
        ))}
        <button
          onClick={() => setOpen(!open)}
          className="px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          aria-label="태그 추가"
          aria-expanded={open}
        >
          + 태그
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-30 py-2">
          {/* Create new */}
          <div className="px-3 pb-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex gap-1">
              <input
                className="flex-1 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100"
                placeholder="새 태그 이름"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateAndAdd()}
              />
              <button
                onClick={handleCreateAndAdd}
                disabled={creating || !newTagName.trim()}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                추가
              </button>
            </div>
          </div>

          {/* Tag list */}
          <div className="max-h-48 overflow-y-auto">
            {allTags.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500">태그가 없습니다</p>
            ) : (
              allTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleToggle(tag.id)}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-700"
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="flex-1 truncate text-slate-700 dark:text-slate-300">{tag.name}</span>
                  {currentIds.has(tag.id) && (
                    <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
