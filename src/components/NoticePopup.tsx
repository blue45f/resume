import React, { useEffect, useState } from 'react';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: string;
}

const API_URL = import.meta.env.VITE_API_URL || '';
const DISMISSED_KEY = 'dismissed_notices';

export default function NoticePopup() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/notices/popup`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Notice[]) => {
        const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') as string[];
        const visible = data.filter(n => !dismissed.includes(n.id));
        setNotices(visible);
      })
      .catch(() => {});
  }, []);

  const dismiss = (id: string, today = false) => {
    if (today) {
      const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') as string[];
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed, id]));
    }
    const next = notices.filter(n => n.id !== id);
    setNotices(next);
    if (index >= next.length) setIndex(Math.max(0, next.length - 1));
  };

  if (!notices.length) return null;
  const notice = notices[index];

  const typeColor = ({ MAINTENANCE: '#ef4444', EVENT: '#10b981', GENERAL: '#6366f1' } as Record<string, string>)[notice.type] || '#6366f1';
  const typeLabel = ({ MAINTENANCE: '점검', EVENT: '이벤트', GENERAL: '공지' } as Record<string, string>)[notice.type] || '공지';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '480px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ background: typeColor, color: '#fff', padding: '2px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>{typeLabel}</span>
          {notices.length > 1 && <span style={{ fontSize: '0.85rem', color: '#888' }}>{index + 1} / {notices.length}</span>}
        </div>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 700 }}>{notice.title}</h3>
        <p style={{ margin: '0 0 1.5rem', color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{notice.content}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={() => dismiss(notice.id, true)} style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', color: '#666' }}>오늘 하루 보지 않기</button>
          {notices.length > 1 && index < notices.length - 1 && (
            <button onClick={() => setIndex(i => i + 1)} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', background: '#f3f4f6', cursor: 'pointer', fontSize: '0.875rem' }}>다음</button>
          )}
          <button onClick={() => dismiss(notice.id)} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>확인</button>
        </div>
      </div>
    </div>
  );
}
