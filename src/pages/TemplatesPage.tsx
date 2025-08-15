import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import type { Template } from '@/types/resume';
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate } from '@/lib/api';

const SECTION_OPTIONS = [
  { value: 'personalInfo', label: '인적사항' },
  { value: 'summary', label: '자기소개' },
  { value: 'experiences', label: '경력' },
  { value: 'educations', label: '학력' },
  { value: 'skills', label: '기술' },
  { value: 'projects', label: '프로젝트' },
  { value: 'certifications', label: '자격증' },
  { value: 'languages', label: '어학' },
  { value: 'awards', label: '수상' },
  { value: 'activities', label: '활동' },
];

const CATEGORY_OPTIONS = [
  { value: 'general', label: '일반' },
  { value: 'developer', label: '개발자' },
  { value: 'designer', label: '디자이너' },
  { value: 'pm', label: '기획/PM' },
  { value: 'marketing', label: '마케팅' },
  { value: 'sales', label: '영업' },
  { value: 'data', label: '데이터' },
  { value: 'research', label: '연구' },
  { value: 'entry', label: '신입/인턴' },
  { value: 'freelance', label: '프리랜서' },
  { value: 'international', label: '해외/영문' },
  { value: 'custom', label: '커스텀' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'dot', label: '2024.03' },
  { value: 'dash', label: '2024-03' },
  { value: 'text', label: '2024년 3월' },
  { value: 'dot-day', label: '2024.03.15' },
  { value: 'dash-day', label: '2024-03-15' },
  { value: 'text-day', label: '2024년 3월 15일' },
];

interface LayoutConfig {
  sections: string[];
  dateFormat: string;
  style: string;
}

function parseLayout(layout: string): LayoutConfig {
  try {
    const parsed = JSON.parse(layout);
    return {
      sections: parsed.sections || SECTION_OPTIONS.map(s => s.value),
      dateFormat: parsed.dateFormat || 'dot',
      style: parsed.style || 'formal',
    };
  } catch {
    return {
      sections: SECTION_OPTIONS.map(s => s.value),
      dateFormat: 'dot',
      style: 'formal',
    };
  }
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formPrompt, setFormPrompt] = useState('');
  const [formSections, setFormSections] = useState<string[]>(SECTION_OPTIONS.map(s => s.value));
  const [formDateFormat, setFormDateFormat] = useState('dot');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setTemplates(await fetchTemplates());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormCategory('general');
    setFormPrompt('');
    setFormSections(SECTION_OPTIONS.map(s => s.value));
    setFormDateFormat('dot');
  };

  const startEdit = (t: Template) => {
    setEditingId(t.id);
    setShowCreate(false);
    setFormName(t.name);
    setFormDesc(t.description);
    setFormCategory(t.category);
    setFormPrompt(t.prompt);
    const layout = parseLayout(t.layout || '{}');
    setFormSections(layout.sections);
    setFormDateFormat(layout.dateFormat);
  };

  const startCreate = () => {
    setEditingId(null);
    setShowCreate(true);
    resetForm();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowCreate(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    const layout = JSON.stringify({ sections: formSections, dateFormat: formDateFormat, style: 'formal' });
    try {
      if (editingId) {
        await updateTemplate(editingId, {
          name: formName, description: formDesc, category: formCategory,
          prompt: formPrompt, layout,
        });
      } else {
        await createTemplate({
          name: formName, description: formDesc, category: formCategory,
          prompt: formPrompt, layout,
        });
      }
      cancelEdit();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 템플릿을 삭제하시겠습니까?`)) return;
    await deleteTemplate(id);
    if (editingId === id) cancelEdit();
    load();
  };

  const toggleSection = (value: string) => {
    setFormSections(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value],
    );
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= formSections.length) return;
    setFormSections(prev => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  // Drag and drop
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDragIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(index);
  };

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIdx;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    setFormSections(prev => {
      const arr = [...prev];
      const [dragged] = arr.splice(fromIndex, 1);
      arr.splice(dropIndex, 0, dragged);
      return arr;
    });
    setDragIdx(null);
    setOverIdx(null);
  };

  const onDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  const isEditing = editingId !== null || showCreate;

  const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">템플릿 관리</h1>
          {!isEditing && (
            <button
              onClick={startCreate}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              + 새 템플릿
            </button>
          )}
        </div>

        {/* Edit / Create form */}
        {isEditing && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {editingId ? '템플릿 수정' : '새 템플릿 만들기'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tpl-name" className={labelClass}>템플릿 이름 *</label>
                  <input id="tpl-name" className={inputClass} value={formName} onChange={e => setFormName(e.target.value)} placeholder="예: 개발자 이력서" />
                </div>
                <div>
                  <label htmlFor="tpl-category" className={labelClass}>카테고리</label>
                  <select id="tpl-category" className={inputClass} value={formCategory} onChange={e => setFormCategory(e.target.value)}>
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="tpl-desc" className={labelClass}>설명</label>
                <input id="tpl-desc" className={inputClass} value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="이 템플릿의 용도를 설명해주세요" />
              </div>

              {/* Section order */}
              <div>
                <span className={labelClass}>섹션 구성 및 순서</span>
                <p className="text-xs text-slate-500 mb-2">드래그하거나 화살표로 순서를 변경하세요. 체크 해제하면 숨김 처리됩니다.</p>

                {/* 선택된 섹션 (순서대로, 드래그 가능) */}
                <div className="space-y-1 mb-3">
                  {formSections.map((value, idx) => {
                    const opt = SECTION_OPTIONS.find(o => o.value === value);
                    if (!opt) return null;
                    const isDragged = dragIdx === idx;
                    const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
                    return (
                      <div
                        key={value}
                        draggable
                        onDragStart={e => onDragStart(e, idx)}
                        onDragOver={e => onDragOver(e, idx)}
                        onDrop={e => onDrop(e, idx)}
                        onDragEnd={onDragEnd}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all select-none ${
                          isDragged ? 'opacity-30 border-blue-300 bg-blue-100' :
                          isOver ? 'border-blue-500 bg-blue-100 scale-[1.02] shadow-sm' :
                          'border-blue-200 bg-blue-50 cursor-grab active:cursor-grabbing'
                        }`}
                      >
                        {/* Drag handle */}
                        <svg className="w-4 h-4 text-blue-300 shrink-0 cursor-grab active:cursor-grabbing" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                          <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                        </svg>
                        <span className="text-xs text-blue-400 font-mono w-5 text-center font-bold">{idx + 1}</span>
                        <input type="checkbox" checked onChange={() => toggleSection(value)} className="rounded" id={`sec-${value}`} />
                        <label htmlFor={`sec-${value}`} className="flex-1 text-sm text-slate-700 font-medium">{opt.label}</label>
                        <div className="flex gap-0.5">
                          <button type="button" onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded" aria-label={`${opt.label} 위로`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                          </button>
                          <button type="button" onClick={() => moveSection(idx, 1)} disabled={idx === formSections.length - 1}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded" aria-label={`${opt.label} 아래로`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 선택 안 된 섹션 */}
                {SECTION_OPTIONS.filter(o => !formSections.includes(o.value)).length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-400">미포함 섹션 (클릭하여 추가)</p>
                    {SECTION_OPTIONS.filter(o => !formSections.includes(o.value)).map(opt => (
                      <div key={opt.value} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 opacity-60">
                        <span className="w-5" />
                        <input type="checkbox" checked={false} onChange={() => toggleSection(opt.value)} className="rounded" id={`sec-off-${opt.value}`} />
                        <label htmlFor={`sec-off-${opt.value}`} className="flex-1 text-sm text-slate-500 cursor-pointer">{opt.label}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Date format */}
              <div>
                <span className={labelClass}>날짜 형식</span>
                <div className="flex gap-2 mt-1">
                  {DATE_FORMAT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormDateFormat(opt.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formDateFormat === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* LLM Prompt */}
              <div>
                <label htmlFor="tpl-prompt" className={labelClass}>LLM 프롬프트 (AI 변환 시 사용)</label>
                <textarea
                  id="tpl-prompt"
                  className={inputClass + ' h-28 resize-none'}
                  value={formPrompt}
                  onChange={e => setFormPrompt(e.target.value)}
                  placeholder="AI가 이력서를 변환할 때 사용할 프롬프트를 작성하세요 (선택)"
                />
                <p className="text-xs text-slate-400 mt-1">비워두면 로컬 변환만 사용 가능합니다.</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formName.trim()}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  {saving ? '저장 중...' : editingId ? '수정' : '생성'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template list */}
        {loading ? (
          <p className="text-center text-slate-500 py-12" aria-live="polite">불러오는 중...</p>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">등록된 템플릿이 없습니다</p>
            <button onClick={startCreate} className="text-blue-600 hover:underline">+ 첫 번째 템플릿 만들기</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => {
              const layout = parseLayout(t.layout || '{}');
              const categoryLabel = CATEGORY_OPTIONS.find(c => c.value === t.category)?.label || t.category;

              return (
                <article
                  key={t.id}
                  className={`bg-white rounded-xl border p-4 transition-shadow hover:shadow-md ${
                    editingId === t.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 truncate">{t.name}</h3>
                      <span className="inline-block mt-0.5 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                        {categoryLabel}
                      </span>
                    </div>
                    {t.isDefault && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 shrink-0">기본</span>
                    )}
                  </div>

                  {t.description && (
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{t.description}</p>
                  )}

                  {/* Section badges */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {layout.sections.slice(0, 5).map(s => {
                      const label = SECTION_OPTIONS.find(o => o.value === s)?.label || s;
                      return (
                        <span key={s} className="px-1.5 py-0.5 text-xs bg-slate-50 text-slate-500 rounded">
                          {label}
                        </span>
                      );
                    })}
                    {layout.sections.length > 5 && (
                      <span className="px-1.5 py-0.5 text-xs bg-slate-50 text-slate-400 rounded">
                        +{layout.sections.length - 5}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => startEdit(t)}
                      className="flex-1 text-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      aria-label={`${t.name} 삭제`}
                    >
                      삭제
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
