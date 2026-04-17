import { API_URL } from '@/lib/config';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  bgColor: string;
}



export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/banners/active`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setBanners(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const next = useCallback(() => setCurrent(c => (c + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [banners.length, next]);

  if (!banners.length) return null;

  const banner = banners[current];

  // bgColor가 Tailwind 클래스명이면 기본 인디고로 fallback
  const isCssGradient = (v: string) => v.startsWith('linear-gradient') || v.startsWith('#') || v.startsWith('rgb');
  const bgStyle = isCssGradient(banner.bgColor)
    ? banner.bgColor
    : 'linear-gradient(135deg, #6366f1, #9333ea)';

  const slideStyle: React.CSSProperties = banner.imageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${banner.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { background: bgStyle };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', marginBottom: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
      <div
        style={{
          ...slideStyle,
          padding: '2.5rem 3rem',
          minHeight: '160px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          cursor: banner.linkUrl ? 'pointer' : 'default',
          transition: 'opacity 0.3s ease',
        }}
        onClick={() => {
          if (!banner.linkUrl) return;
          if (banner.linkUrl.startsWith('http')) { window.open(banner.linkUrl, '_blank'); }
          else { navigate(banner.linkUrl); }
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.3)', lineHeight: 1.3 }}>{banner.title}</h2>
        {banner.subtitle && (
          <p style={{ margin: '0.5rem 0 0', color: 'rgba(255,255,255,0.92)', fontSize: '0.95rem', textShadow: '0 1px 3px rgba(0,0,0,0.25)' }}>
            {banner.subtitle}
          </p>
        )}
        {banner.linkUrl && (
          <span style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#fff', fontSize: '0.8rem', fontWeight: 600, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '4px 12px', borderRadius: '999px', width: 'fit-content' }}>
            자세히 보기 →
          </span>
        )}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="이전"
          >‹</button>
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="다음"
          >›</button>
          <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setCurrent(i); }}
                style={{ width: i === current ? '20px' : '8px', height: '8px', borderRadius: '999px', border: 'none', background: i === current ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease' }}
                aria-label={`${i + 1}번째 배너`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
