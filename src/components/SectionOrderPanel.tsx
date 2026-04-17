import { useRef, useState, useCallback } from 'react';
import type { SectionId } from '@/types/resume';
import { DEFAULT_SECTION_ORDER } from '@/types/resume';

const SECTION_LABELS: Record<SectionId, string> = {
  experience: '경력',
  education: '학력',
  skills: '기술',
  projects: '프로젝트',
  certifications: '자격증',
  languages: '어학',
  awards: '수상',
  activities: '활동',
};

interface Props {
  sectionOrder: SectionId[];
  hiddenSections: SectionId[];
  onOrderChange: (order: SectionId[]) => void;
  onHiddenChange: (hidden: SectionId[]) => void;
}

export default function SectionOrderPanel({ sectionOrder, hiddenSections, onOrderChange, onHiddenChange }: Props) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const order = sectionOrder.length > 0 ? sectionOrder : [...DEFAULT_SECTION_ORDER];

  const handleDragStart = useCallback((idx: number) => {
    setDragging(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOver(idx);
  }, []);

  const handleDrop = useCallback((idx: number) => {
    if (dragging === null || dragging === idx) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const newOrder = [...order];
    const [moved] = newOrder.splice(dragging, 1);
    newOrder.splice(idx, 0, moved);
    onOrderChange(newOrder);
    setDragging(null);
    setDragOver(null);
  }, [dragging, order, onOrderChange]);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setDragOver(null);
  }, []);

  const moveSection = useCallback((fromIdx: number, direction: -1 | 1) => {
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= order.length) return;
    const newOrder = [...order];
    [newOrder[fromIdx], newOrder[toIdx]] = [newOrder[toIdx], newOrder[fromIdx]];
    onOrderChange(newOrder);
  }, [order, onOrderChange]);

  const toggleVisibility = useCallback((sectionId: SectionId) => {
    const isHidden = hiddenSections.includes(sectionId);
    if (isHidden) {
      onHiddenChange(hiddenSections.filter(s => s !== sectionId));
    } else {
      onHiddenChange([...hiddenSections, sectionId]);
    }
  }, [hiddenSections, onHiddenChange]);

  const resetOrder = useCallback(() => {
    onOrderChange([...DEFAULT_SECTION_ORDER]);
    onHiddenChange([]);
  }, [onOrderChange, onHiddenChange]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          섹션 순서 및 표시
        </h3>
        <button
          type="button"
          onClick={resetOrder}
          className="text-xs text-slate-400 hover:text-blue-600 transition-colors"
        >
          초기화
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
        role="list"
        aria-label="섹션 순서 변경"
      >
        {order.map((sectionId, idx) => {
          const isHidden = hiddenSections.includes(sectionId);
          const isDraggingThis = dragging === idx;
          const isDragOverThis = dragOver === idx;

          return (
            <div
              key={sectionId}
              role="listitem"
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={`
                group flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium
                border transition-all duration-200 cursor-grab active:cursor-grabbing select-none
                ${isDraggingThis ? 'opacity-40 scale-95' : ''}
                ${isDragOverThis && !isDraggingThis ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
                ${isHidden
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600 line-through'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500 shadow-sm hover:shadow'
                }
              `}
            >
              {/* Drag handle */}
              <svg className="w-3 h-3 text-slate-300 dark:text-slate-500 shrink-0" viewBox="0 0 6 10" fill="currentColor">
                <circle cx="1" cy="1" r="1" /><circle cx="5" cy="1" r="1" />
                <circle cx="1" cy="5" r="1" /><circle cx="5" cy="5" r="1" />
                <circle cx="1" cy="9" r="1" /><circle cx="5" cy="9" r="1" />
              </svg>

              <span>{SECTION_LABELS[sectionId]}</span>

              {/* Arrow buttons for accessibility */}
              <div className="hidden group-hover:flex items-center gap-0.5 ml-0.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveSection(idx, -1); }}
                  disabled={idx === 0}
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-20 transition-colors"
                  aria-label={`${SECTION_LABELS[sectionId]} 앞으로 이동`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveSection(idx, 1); }}
                  disabled={idx === order.length - 1}
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-20 transition-colors"
                  aria-label={`${SECTION_LABELS[sectionId]} 뒤로 이동`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              {/* Visibility toggle */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleVisibility(sectionId); }}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors ml-0.5"
                aria-label={isHidden ? `${SECTION_LABELS[sectionId]} 표시` : `${SECTION_LABELS[sectionId]} 숨기기`}
                title={isHidden ? '표시' : '숨기기'}
              >
                {isHidden ? (
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
        드래그하여 순서를 변경하세요. 눈 아이콘으로 섹션을 숨길 수 있습니다.
      </p>
    </div>
  );
}
