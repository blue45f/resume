import { useState, useEffect, lazy, Suspense } from 'react';
import type { Experience, Education, Skill, Project, Certification, Language, Award, Activity } from '@/types/resume';
import type { Resume } from '@/types/resume';
import { toast } from '@/components/Toast';

const RichEditor = lazy(() => import('@/components/RichEditor'));

type ResumeData = Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>;

interface Props {
  initialData: ResumeData;
  onSave: (data: ResumeData) => void;
  saving?: boolean;
}

export default function ResumeForm({ initialData, onSave, saving }: Props) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState('personal');
  const [dirty, setDirty] = useState(false);

  // Ctrl+S / Cmd+S 키보드 저장
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!saving) {
          onSave(data);
          toast('저장 중...', 'info');
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [data, saving, onSave]);

  // 저장되지 않은 변경사항 경고
  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);


  const tabs = [
    { id: 'personal', label: '인적사항' },
    { id: 'experience', label: '경력' },
    { id: 'education', label: '학력' },
    { id: 'skills', label: '기술' },
    { id: 'projects', label: '프로젝트' },
    { id: 'certifications', label: '자격증' },
    { id: 'languages', label: '어학' },
    { id: 'awards', label: '수상' },
    { id: 'activities', label: '활동' },
  ];

  const updatePersonalInfo = (field: string, value: string) => {
    setDirty(true);
    setData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  const addExperience = () => {
    const item: Experience = {
      id: crypto.randomUUID(), company: '', position: '',
      startDate: '', endDate: '', current: false, description: '',
    };
    setData(prev => ({ ...prev, experiences: [...prev.experiences, item] }));
  };
  const updateExperience = (id: string, field: string, value: string | boolean) => {
    setData(prev => ({
      ...prev,
      experiences: prev.experiences.map(e => e.id === id ? { ...e, [field]: value } : e),
    }));
  };
  const removeExperience = (id: string) => {
    setData(prev => ({ ...prev, experiences: prev.experiences.filter(e => e.id !== id) }));
  };

  const addEducation = () => {
    const item: Education = {
      id: crypto.randomUUID(), school: '', degree: '', field: '',
      startDate: '', endDate: '', description: '',
    };
    setData(prev => ({ ...prev, educations: [...prev.educations, item] }));
  };
  const updateEducation = (id: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      educations: prev.educations.map(e => e.id === id ? { ...e, [field]: value } : e),
    }));
  };
  const removeEducation = (id: string) => {
    setData(prev => ({ ...prev, educations: prev.educations.filter(e => e.id !== id) }));
  };

  const addSkill = () => {
    const item: Skill = { id: crypto.randomUUID(), category: '', items: '' };
    setData(prev => ({ ...prev, skills: [...prev.skills, item] }));
  };
  const updateSkill = (id: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.map(s => s.id === id ? { ...s, [field]: value } : s),
    }));
  };
  const removeSkill = (id: string) => {
    setData(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== id) }));
  };

  const addProject = () => {
    const item: Project = {
      id: crypto.randomUUID(), name: '', role: '',
      startDate: '', endDate: '', description: '', link: '',
    };
    setData(prev => ({ ...prev, projects: [...prev.projects, item] }));
  };
  const updateProject = (id: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, [field]: value } : p),
    }));
  };
  const removeProject = (id: string) => {
    setData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  };

  const addCertification = () => {
    const item: Certification = {
      id: crypto.randomUUID(), name: '', issuer: '',
      issueDate: '', expiryDate: '', credentialId: '', description: '',
    };
    setData(prev => ({ ...prev, certifications: [...prev.certifications, item] }));
  };
  const updateCertification = (id: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      certifications: prev.certifications.map(c => c.id === id ? { ...c, [field]: value } : c),
    }));
  };
  const removeCertification = (id: string) => {
    setData(prev => ({ ...prev, certifications: prev.certifications.filter(c => c.id !== id) }));
  };

  const addLanguage = () => {
    const item: Language = {
      id: crypto.randomUUID(), name: '', testName: '', score: '', testDate: '',
    };
    setData(prev => ({ ...prev, languages: [...prev.languages, item] }));
  };
  const updateLanguage = (id: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      languages: prev.languages.map(l => l.id === id ? { ...l, [field]: value } : l),
    }));
  };
  const removeLanguage = (id: string) => {
    setData(prev => ({ ...prev, languages: prev.languages.filter(l => l.id !== id) }));
  };

  const addAward = () => {
    const item: Award = {
      id: crypto.randomUUID(), name: '', issuer: '', awardDate: '', description: '',
    };
    setData(prev => ({ ...prev, awards: [...prev.awards, item] }));
  };
  const updateAward = (id: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      awards: prev.awards.map(a => a.id === id ? { ...a, [field]: value } : a),
    }));
  };
  const removeAward = (id: string) => {
    setData(prev => ({ ...prev, awards: prev.awards.filter(a => a.id !== id) }));
  };

  const addActivity = () => {
    const item: Activity = {
      id: crypto.randomUUID(), name: '', organization: '', role: '',
      startDate: '', endDate: '', description: '',
    };
    setData(prev => ({ ...prev, activities: [...prev.activities, item] }));
  };
  const updateActivity = (id: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      activities: prev.activities.map(a => a.id === id ? { ...a, [field]: value } : a),
    }));
  };
  const removeActivity = (id: string) => {
    setData(prev => ({ ...prev, activities: prev.activities.filter(a => a.id !== id) }));
  };

  const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';
  const deleteBtn = 'text-red-600 text-sm hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1 transition-colors';
  const addBtn = 'w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors';

  return (
    <form
      className="space-y-6"
      onSubmit={e => { e.preventDefault(); onSave(data); }}
      aria-label="이력서 편집 폼"
    >
      <div>
        <label htmlFor="resume-title" className={labelClass}>이력서 제목</label>
        <input
          id="resume-title"
          type="text"
          className={inputClass}
          placeholder="예: 2026 상반기 이력서"
          value={data.title}
          onChange={e => { setDirty(true); setData(prev => ({ ...prev, title: e.target.value })); }}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200" role="tablist" aria-label="이력서 섹션">
        <nav className="flex gap-1 sm:gap-4 -mb-px overflow-x-auto">
          {tabs.map((tab, idx) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              tabIndex={activeTab === tab.id ? 0 : -1}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => {
                let nextIdx = idx;
                if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
                else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
                else return;
                e.preventDefault();
                setActiveTab(tabs[nextIdx].id);
                (e.currentTarget.parentElement?.children[nextIdx] as HTMLElement)?.focus();
              }}
              className={`py-3 px-2 sm:px-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Personal Info */}
      {activeTab === 'personal' && (
        <fieldset id="panel-personal" role="tabpanel" aria-label="인적사항">
          {/* 증명사진 */}
          <div className="flex items-start gap-6 mb-6">
            <div className="shrink-0">
              {data.personalInfo.photo ? (
                <div className="relative group">
                  <img src={data.personalInfo.photo} alt="증명사진" className="w-28 h-36 object-cover rounded-lg border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => updatePersonalInfo('photo', '')}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    aria-label="사진 삭제"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-28 h-36 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
                  <span className="text-2xl text-slate-300 mb-1">📷</span>
                  <span className="text-xs text-slate-400">증명사진</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) { alert('사진은 2MB 이하만 가능합니다'); return; }
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') updatePersonalInfo('photo', reader.result);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pi-name" className={labelClass}>이름</label>
                <input id="pi-name" className={inputClass} value={data.personalInfo.name} onChange={e => updatePersonalInfo('name', e.target.value)} />
              </div>
              <div>
                <label htmlFor="pi-email" className={labelClass}>이메일</label>
                <input id="pi-email" type="email" className={inputClass} value={data.personalInfo.email} onChange={e => updatePersonalInfo('email', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pi-phone" className={labelClass}>전화번호</label>
              <input id="pi-phone" type="tel" className={inputClass} value={data.personalInfo.phone} onChange={e => updatePersonalInfo('phone', e.target.value)} />
            </div>
            <div>
              <label htmlFor="pi-address" className={labelClass}>주소</label>
              <input id="pi-address" className={inputClass} value={data.personalInfo.address} onChange={e => updatePersonalInfo('address', e.target.value)} />
            </div>
            <div>
              <label htmlFor="pi-website" className={labelClass}>웹사이트</label>
              <input id="pi-website" type="url" className={inputClass} placeholder="https://example.com" value={data.personalInfo.website} onChange={e => updatePersonalInfo('website', e.target.value)} />
            </div>
            <div>
              <label htmlFor="pi-github" className={labelClass}>GitHub</label>
              <input id="pi-github" type="url" className={inputClass} placeholder="https://github.com/username" value={data.personalInfo.github || ''} onChange={e => updatePersonalInfo('github', e.target.value)} />
            </div>
            <div>
              <label htmlFor="pi-birth" className={labelClass}>생년</label>
              <input id="pi-birth" className={inputClass} placeholder="예: 1990" value={data.personalInfo.birthYear || ''} onChange={e => updatePersonalInfo('birthYear', e.target.value)} />
            </div>
            <div>
              <label htmlFor="pi-military" className={labelClass}>병역사항</label>
              <input id="pi-military" className={inputClass} placeholder="예: 군필 | 육군 병장 제대" value={data.personalInfo.military || ''} onChange={e => updatePersonalInfo('military', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>자기소개</label>
              <Suspense fallback={<textarea className={inputClass + ' h-28 resize-none'} value={data.personalInfo.summary} readOnly />}>
                <RichEditor
                  value={data.personalInfo.summary}
                  onChange={v => updatePersonalInfo('summary', v)}
                  placeholder="자기소개를 작성하세요..."
                />
              </Suspense>
            </div>
          </div>
        </fieldset>
      )}

      {/* Experience */}
      {activeTab === 'experience' && (
        <div id="panel-experience" role="tabpanel" aria-label="경력" className="space-y-4">
          {data.experiences.map((exp, idx) => (
            <fieldset key={exp.id} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <legend className="text-sm font-medium text-slate-600">경력 {idx + 1}</legend>
                <button type="button" onClick={() => removeExperience(exp.id)} className={deleteBtn} aria-label={`경력 ${idx + 1} 삭제`}>삭제</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`exp-company-${exp.id}`} className={labelClass}>회사명</label>
                  <input id={`exp-company-${exp.id}`} className={inputClass} value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`exp-position-${exp.id}`} className={labelClass}>직위</label>
                  <input id={`exp-position-${exp.id}`} className={inputClass} value={exp.position} onChange={e => updateExperience(exp.id, 'position', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`exp-dept-${exp.id}`} className={labelClass}>부서/팀</label>
                  <input id={`exp-dept-${exp.id}`} className={inputClass} value={exp.department || ''} placeholder="예: 배민주문서비스팀" onChange={e => updateExperience(exp.id, 'department', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`exp-start-${exp.id}`} className={labelClass}>시작일</label>
                  <input id={`exp-start-${exp.id}`} type="date" className={inputClass} value={exp.startDate} onChange={e => updateExperience(exp.id, 'startDate', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`exp-end-${exp.id}`} className={labelClass}>종료일</label>
                  <div className="flex items-center gap-2">
                    <input id={`exp-end-${exp.id}`} type="date" className={inputClass} value={exp.endDate} disabled={exp.current} onChange={e => updateExperience(exp.id, 'endDate', e.target.value)} />
                    <label className="flex items-center gap-1 text-sm text-slate-700 whitespace-nowrap cursor-pointer">
                      <input type="checkbox" checked={exp.current} onChange={e => updateExperience(exp.id, 'current', e.target.checked)} className="rounded" />
                      재직중
                    </label>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>업무 내용</label>
                  <Suspense fallback={<textarea className={inputClass + ' h-24 resize-none'} readOnly />}>
                    <RichEditor
                      value={exp.description}
                      onChange={v => updateExperience(exp.id, 'description', v)}
                      placeholder="주요 업무를 작성하세요 (볼드, 리스트 지원)"
                    />
                  </Suspense>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>주요 성과</label>
                  <Suspense fallback={<textarea className={inputClass + ' h-20 resize-none'} readOnly />}>
                    <RichEditor
                      value={exp.achievements || ''}
                      onChange={v => updateExperience(exp.id, 'achievements', v)}
                      placeholder="정량적 성과 (예: 번들 70% 감소)"
                    />
                  </Suspense>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`exp-tech-${exp.id}`} className={labelClass}>기술 스택</label>
                  <input id={`exp-tech-${exp.id}`} className={inputClass} value={exp.techStack || ''} onChange={e => updateExperience(exp.id, 'techStack', e.target.value)} placeholder="예: React, TypeScript, AWS S3" />
                </div>
              </div>
            </fieldset>
          ))}
          <button type="button" onClick={addExperience} className={addBtn}>+ 경력 추가</button>
        </div>
      )}

      {/* Education */}
      {activeTab === 'education' && (
        <div id="panel-education" role="tabpanel" aria-label="학력" className="space-y-4">
          {data.educations.map((edu, idx) => (
            <fieldset key={edu.id} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <legend className="text-sm font-medium text-slate-600">학력 {idx + 1}</legend>
                <button type="button" onClick={() => removeEducation(edu.id)} className={deleteBtn} aria-label={`학력 ${idx + 1} 삭제`}>삭제</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`edu-school-${edu.id}`} className={labelClass}>학교명</label>
                  <input id={`edu-school-${edu.id}`} className={inputClass} value={edu.school} onChange={e => updateEducation(edu.id, 'school', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`edu-degree-${edu.id}`} className={labelClass}>학위</label>
                  <input id={`edu-degree-${edu.id}`} className={inputClass} value={edu.degree} placeholder="예: 학사, 석사" onChange={e => updateEducation(edu.id, 'degree', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`edu-field-${edu.id}`} className={labelClass}>전공</label>
                  <input id={`edu-field-${edu.id}`} className={inputClass} value={edu.field} onChange={e => updateEducation(edu.id, 'field', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`edu-gpa-${edu.id}`} className={labelClass}>학점</label>
                  <input id={`edu-gpa-${edu.id}`} className={inputClass} value={edu.gpa || ''} placeholder="예: 3.8/4.5" onChange={e => updateEducation(edu.id, 'gpa', e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor={`edu-start-${edu.id}`} className={labelClass}>입학</label>
                    <input id={`edu-start-${edu.id}`} type="date" className={inputClass} value={edu.startDate} onChange={e => updateEducation(edu.id, 'startDate', e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <label htmlFor={`edu-end-${edu.id}`} className={labelClass}>졸업</label>
                    <input id={`edu-end-${edu.id}`} type="date" className={inputClass} value={edu.endDate} onChange={e => updateEducation(edu.id, 'endDate', e.target.value)} />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`edu-desc-${edu.id}`} className={labelClass}>비고</label>
                  <textarea id={`edu-desc-${edu.id}`} className={inputClass + ' h-20 resize-none'} value={edu.description} placeholder="학점, 수상 내역 등" onChange={e => updateEducation(edu.id, 'description', e.target.value)} />
                </div>
              </div>
            </fieldset>
          ))}
          <button type="button" onClick={addEducation} className={addBtn}>+ 학력 추가</button>
        </div>
      )}

      {/* Skills */}
      {activeTab === 'skills' && (
        <div id="panel-skills" role="tabpanel" aria-label="기술" className="space-y-4">
          {data.skills.map((skill, idx) => (
            <fieldset key={skill.id} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <legend className="text-sm font-medium text-slate-600">기술 {idx + 1}</legend>
                <button type="button" onClick={() => removeSkill(skill.id)} className={deleteBtn} aria-label={`기술 ${idx + 1} 삭제`}>삭제</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`skill-cat-${skill.id}`} className={labelClass}>카테고리</label>
                  <input id={`skill-cat-${skill.id}`} className={inputClass} value={skill.category} placeholder="예: 프로그래밍 언어" onChange={e => updateSkill(skill.id, 'category', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`skill-items-${skill.id}`} className={labelClass}>기술 목록</label>
                  <input id={`skill-items-${skill.id}`} className={inputClass} value={skill.items} placeholder="예: TypeScript, React" onChange={e => updateSkill(skill.id, 'items', e.target.value)} />
                </div>
              </div>
            </fieldset>
          ))}
          <button type="button" onClick={addSkill} className={addBtn}>+ 기술 추가</button>
        </div>
      )}

      {/* Projects */}
      {activeTab === 'projects' && (
        <div id="panel-projects" role="tabpanel" aria-label="프로젝트" className="space-y-4">
          {data.projects.map((proj, idx) => (
            <fieldset key={proj.id} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <legend className="text-sm font-medium text-slate-600">프로젝트 {idx + 1}</legend>
                <button type="button" onClick={() => removeProject(proj.id)} className={deleteBtn} aria-label={`프로젝트 ${idx + 1} 삭제`}>삭제</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`proj-name-${proj.id}`} className={labelClass}>프로젝트명</label>
                  <input id={`proj-name-${proj.id}`} className={inputClass} value={proj.name} onChange={e => updateProject(proj.id, 'name', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`proj-company-${proj.id}`} className={labelClass}>소속 회사</label>
                  <input id={`proj-company-${proj.id}`} className={inputClass} value={proj.company || ''} placeholder="예: 우아한형제들" onChange={e => updateProject(proj.id, 'company', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`proj-role-${proj.id}`} className={labelClass}>역할</label>
                  <input id={`proj-role-${proj.id}`} className={inputClass} value={proj.role} onChange={e => updateProject(proj.id, 'role', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`proj-start-${proj.id}`} className={labelClass}>시작일</label>
                  <input id={`proj-start-${proj.id}`} type="date" className={inputClass} value={proj.startDate} onChange={e => updateProject(proj.id, 'startDate', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`proj-end-${proj.id}`} className={labelClass}>종료일</label>
                  <input id={`proj-end-${proj.id}`} type="date" className={inputClass} value={proj.endDate} onChange={e => updateProject(proj.id, 'endDate', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`proj-link-${proj.id}`} className={labelClass}>링크</label>
                  <input id={`proj-link-${proj.id}`} type="url" className={inputClass} value={proj.link} placeholder="https://..." onChange={e => updateProject(proj.id, 'link', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>설명</label>
                  <Suspense fallback={<textarea className={inputClass + ' h-24 resize-none'} readOnly />}>
                    <RichEditor
                      value={proj.description}
                      onChange={v => updateProject(proj.id, 'description', v)}
                      placeholder="프로젝트 설명 및 기여한 내용"
                    />
                  </Suspense>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`proj-tech-${proj.id}`} className={labelClass}>기술 스택</label>
                  <input id={`proj-tech-${proj.id}`} className={inputClass} value={proj.techStack || ''} placeholder="예: React, TypeScript, AWS" onChange={e => updateProject(proj.id, 'techStack', e.target.value)} />
                </div>
              </div>
            </fieldset>
          ))}
          <button type="button" onClick={addProject} className={addBtn}>+ 프로젝트 추가</button>
        </div>
      )}

      {/* Certifications */}
      {activeTab === 'certifications' && (
        <div id="panel-certifications" role="tabpanel" aria-label="자격증" className="space-y-4">
          {data.certifications.map((cert, idx) => (
            <fieldset key={cert.id} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <legend className="text-sm font-medium text-slate-600">자격증 {idx + 1}</legend>
                <button type="button" onClick={() => removeCertification(cert.id)} className={deleteBtn} aria-label={`자격증 ${idx + 1} 삭제`}>삭제</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`cert-name-${cert.id}`} className={labelClass}>자격증명</label>
                  <input id={`cert-name-${cert.id}`} className={inputClass} value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`cert-issuer-${cert.id}`} className={labelClass}>발급기관</label>
                  <input id={`cert-issuer-${cert.id}`} className={inputClass} value={cert.issuer} onChange={e => updateCertification(cert.id, 'issuer', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`cert-issue-${cert.id}`} className={labelClass}>취득일</label>
                  <input id={`cert-issue-${cert.id}`} type="date" className={inputClass} value={cert.issueDate} onChange={e => updateCertification(cert.id, 'issueDate', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`cert-expiry-${cert.id}`} className={labelClass}>만료일</label>
                  <input id={`cert-expiry-${cert.id}`} type="date" className={inputClass} value={cert.expiryDate} onChange={e => updateCertification(cert.id, 'expiryDate', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`cert-cred-${cert.id}`} className={labelClass}>자격번호</label>
                  <input id={`cert-cred-${cert.id}`} className={inputClass} value={cert.credentialId} onChange={e => updateCertification(cert.id, 'credentialId', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`cert-desc-${cert.id}`} className={labelClass}>비고</label>
                  <textarea id={`cert-desc-${cert.id}`} className={inputClass + ' h-20 resize-none'} value={cert.description} onChange={e => updateCertification(cert.id, 'description', e.target.value)} />
                </div>
              </div>
            </fieldset>
          ))}
          <button type="button" onClick={addCertification} className={addBtn}>+ 자격증 추가</button>
        </div>
      )}

      {/* Languages */}
      {activeTab === 'languages' && (
        <div id="panel-languages" role="tabpanel" aria-label="어학" className="space-y-4">
          {data.languages.map((lang, idx) => (
            <fieldset key={lang.id} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <legend className="text-sm font-medium text-slate-600">어학 {idx + 1}</legend>
                <button type="button" onClick={() => removeLanguage(lang.id)} className={deleteBtn} aria-label={`어학 ${idx + 1} 삭제`}>삭제</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`lang-name-${lang.id}`} className={labelClass}>언어</label>
                  <input id={`lang-name-${lang.id}`} className={inputClass} value={lang.name} placeholder="예: 영어" onChange={e => updateLanguage(lang.id, 'name', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`lang-test-${lang.id}`} className={labelClass}>시험명</label>
                  <input id={`lang-test-${lang.id}`} className={inputClass} value={lang.testName} placeholder="예: TOEIC, JLPT" onChange={e => updateLanguage(lang.id, 'testName', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`lang-score-${lang.id}`} className={labelClass}>점수/급수</label>
                  <input id={`lang-score-${lang.id}`} className={inputClass} value={lang.score} placeholder="예: 990, N1" onChange={e => updateLanguage(lang.id, 'score', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`lang-date-${lang.id}`} className={labelClass}>응시일</label>
                  <input id={`lang-date-${lang.id}`} type="date" className={inputClass} value={lang.testDate} onChange={e => updateLanguage(lang.id, 'testDate', e.target.value)} />
                </div>
              </div>
            </fieldset>
          ))}
          <button type="button" onClick={addLanguage} className={addBtn}>+ 어학 추가</button>
        </div>
      )}

      {/* Awards */}
      {activeTab === 'awards' && (
        <div id="panel-awards" role="tabpanel" aria-label="수상" className="space-y-4">
          {data.awards.map((award, idx) => (
            <fieldset key={award.id} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <legend className="text-sm font-medium text-slate-600">수상 {idx + 1}</legend>
                <button type="button" onClick={() => removeAward(award.id)} className={deleteBtn} aria-label={`수상 ${idx + 1} 삭제`}>삭제</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`award-name-${award.id}`} className={labelClass}>수상명</label>
                  <input id={`award-name-${award.id}`} className={inputClass} value={award.name} onChange={e => updateAward(award.id, 'name', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`award-issuer-${award.id}`} className={labelClass}>수여기관</label>
                  <input id={`award-issuer-${award.id}`} className={inputClass} value={award.issuer} onChange={e => updateAward(award.id, 'issuer', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`award-date-${award.id}`} className={labelClass}>수상일</label>
                  <input id={`award-date-${award.id}`} type="date" className={inputClass} value={award.awardDate} onChange={e => updateAward(award.id, 'awardDate', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`award-desc-${award.id}`} className={labelClass}>설명</label>
                  <textarea id={`award-desc-${award.id}`} className={inputClass + ' h-20 resize-none'} value={award.description} placeholder="수상 내용 및 의의" onChange={e => updateAward(award.id, 'description', e.target.value)} />
                </div>
              </div>
            </fieldset>
          ))}
          <button type="button" onClick={addAward} className={addBtn}>+ 수상 추가</button>
        </div>
      )}

      {/* Activities */}
      {activeTab === 'activities' && (
        <div id="panel-activities" role="tabpanel" aria-label="활동" className="space-y-4">
          {data.activities.map((act, idx) => (
            <fieldset key={act.id} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <legend className="text-sm font-medium text-slate-600">활동 {idx + 1}</legend>
                <button type="button" onClick={() => removeActivity(act.id)} className={deleteBtn} aria-label={`활동 ${idx + 1} 삭제`}>삭제</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`act-name-${act.id}`} className={labelClass}>활동명</label>
                  <input id={`act-name-${act.id}`} className={inputClass} value={act.name} onChange={e => updateActivity(act.id, 'name', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`act-org-${act.id}`} className={labelClass}>기관/단체</label>
                  <input id={`act-org-${act.id}`} className={inputClass} value={act.organization} onChange={e => updateActivity(act.id, 'organization', e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`act-role-${act.id}`} className={labelClass}>역할</label>
                  <input id={`act-role-${act.id}`} className={inputClass} value={act.role} onChange={e => updateActivity(act.id, 'role', e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor={`act-start-${act.id}`} className={labelClass}>시작일</label>
                    <input id={`act-start-${act.id}`} type="date" className={inputClass} value={act.startDate} onChange={e => updateActivity(act.id, 'startDate', e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <label htmlFor={`act-end-${act.id}`} className={labelClass}>종료일</label>
                    <input id={`act-end-${act.id}`} type="date" className={inputClass} value={act.endDate} onChange={e => updateActivity(act.id, 'endDate', e.target.value)} />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`act-desc-${act.id}`} className={labelClass}>설명</label>
                  <textarea id={`act-desc-${act.id}`} className={inputClass + ' h-24 resize-none'} value={act.description} placeholder="활동 내용 및 성과" onChange={e => updateActivity(act.id, 'description', e.target.value)} />
                </div>
              </div>
            </fieldset>
          ))}
          <button type="button" onClick={addActivity} className={addBtn}>+ 활동 추가</button>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          {dirty ? '변경사항이 있습니다' : ''}
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-slate-400">Ctrl+S</span>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-busy={saving}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </form>
  );
}
