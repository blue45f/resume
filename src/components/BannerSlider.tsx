import React, { useEffect, useState, useCallback } from 'react';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  bgColor: string;
}

const API_URL = import.meta.env.VITE_API_URL || '';

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);

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

  return (
    <div className="banner-slider" style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', marginBottom: '2rem' }}>
      <div
        className="banner-slide"
        style={{
          background: banner.bgColor || '#6366f1',
          padding: '2.5rem',
          color: '#fff',
          cursor: banner.linkUrl ? 'pointer' : 'default',
          minHeight: '160px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
        onClick={() => banner.linkUrl && window.open(banner.linkUrl, '_blank')}
      >
        {banner.imageUrl && (
          <img src={banner.imageUrl} alt="" style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', height: '120px', objectFit: 'contain', opacity: 0.85 }} />
        )}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{banner.title}</h2>
        {banner.subtitle && <p style={{ margin: '0.5rem 0 0', opacity: 0.9 }}>{banner.subtitle}</p>}
      </div>

      {banners.length > 1 && (
        <>
          <button onClick={prev} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '1rem' }}>&#8249;</button>
          <button onClick={next} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '1rem' }}>&#8250;</button>
          <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
            {banners.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{ width: '8px', height: '8px', borderRadius: '50%', border: 'none', background: i === current ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
