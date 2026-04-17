import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { API_URL } from '@/lib/config';

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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/banners/active`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setBanners(Array.isArray(data) ? data : []))
      .catch(err => { console.warn('[BannerSlider] Failed to fetch banners:', err); });
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrent(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || banners.length <= 1) return;
    const timer = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(timer);
  }, [emblaApi, banners.length]);

  if (!banners.length) return null;

  const getSlideStyle = (banner: Banner): React.CSSProperties => {
    const isCss = (v: string) => v.startsWith('linear-gradient') || v.startsWith('#') || v.startsWith('rgb');
    const bg = isCss(banner.bgColor) ? banner.bgColor : 'linear-gradient(135deg, #4f46e5, #6366f1)';
    const safeUrl = banner.imageUrl && /^https?:\/\//.test(banner.imageUrl) ? banner.imageUrl.replace(/["\\]/g, '') : '';
    return safeUrl
      ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url("${safeUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: bg };
  };

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8 shadow-lg">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {banners.map(banner => (
            <div key={banner.id} className="flex-[0_0_100%] min-w-0">
              <div
                style={{ ...getSlideStyle(banner), padding: '2.5rem 3rem', minHeight: '160px' }}
                className="flex flex-col justify-center cursor-pointer"
                onClick={() => {
                  if (!banner.linkUrl) return;
                  banner.linkUrl.startsWith('http') ? window.open(banner.linkUrl, '_blank') : navigate(banner.linkUrl);
                }}
              >
                <h2 className="text-2xl font-extrabold text-white mb-0 leading-tight" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="mt-2 text-white/90 text-sm" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.25)' }}>
                    {banner.subtitle}
                  </p>
                )}
                {banner.linkUrl && (
                  <span className="mt-3 inline-flex items-center gap-1 text-white text-xs font-semibold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full w-fit">
                    자세히 보기 →
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button onClick={() => emblaApi?.scrollPrev()} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/25 backdrop-blur-sm border border-white/30 rounded-full text-white text-lg flex items-center justify-center hover:bg-white/40 transition-colors" aria-label="이전">
            ‹
          </button>
          <button onClick={() => emblaApi?.scrollNext()} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/25 backdrop-blur-sm border border-white/30 rounded-full text-white text-lg flex items-center justify-center hover:bg-white/40 transition-colors" aria-label="다음">
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-5 bg-white' : 'w-2 bg-white/50'}`}
                aria-label={`${i + 1}번째 배너`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
