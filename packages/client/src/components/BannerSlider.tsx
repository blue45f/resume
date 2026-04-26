import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, A11y, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
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
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/banners/active`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBanners(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.warn('[BannerSlider] Failed to fetch banners:', err);
      });
  }, []);

  if (!banners.length) return null;

  const getSlideStyle = (banner: Banner): React.CSSProperties => {
    const isCss = (v: string) =>
      v.startsWith('linear-gradient') || v.startsWith('#') || v.startsWith('rgb');
    const bg = isCss(banner.bgColor) ? banner.bgColor : 'linear-gradient(135deg, #2563eb, #1d4ed8)';
    const safeUrl =
      banner.imageUrl && /^https?:\/\//.test(banner.imageUrl)
        ? banner.imageUrl.replace(/["\\]/g, '')
        : '';
    return safeUrl
      ? {
          backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url("${safeUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : { background: bg };
  };

  const handleClick = (banner: Banner) => {
    if (!banner.linkUrl) return;
    if (banner.linkUrl.startsWith('http')) {
      window.open(banner.linkUrl, '_blank');
    } else {
      navigate(banner.linkUrl);
    }
  };

  return (
    <div className="relative rounded-2xl mb-8 shadow-lg overflow-hidden banner-swiper-root">
      <Swiper
        modules={[Autoplay, Navigation, Pagination, A11y, Keyboard]}
        autoplay={
          banners.length > 1
            ? { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }
            : false
        }
        pagination={banners.length > 1 ? { clickable: true } : false}
        navigation={banners.length > 1}
        keyboard={{ enabled: true }}
        loop={banners.length > 1}
        slidesPerView={1}
        a11y={{
          prevSlideMessage: '이전 배너',
          nextSlideMessage: '다음 배너',
          paginationBulletMessage: '{{index}}번째 배너로 이동',
        }}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div
              style={{ ...getSlideStyle(banner), padding: '2.5rem 3rem', minHeight: '180px' }}
              className="flex flex-col justify-center cursor-pointer"
              onClick={() => handleClick(banner)}
              role={banner.linkUrl ? 'link' : undefined}
              tabIndex={banner.linkUrl ? 0 : -1}
              onKeyDown={(e) => {
                if (banner.linkUrl && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleClick(banner);
                }
              }}
            >
              <h2
                className="text-2xl font-extrabold text-white mb-0 leading-tight"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
              >
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p
                  className="mt-2 text-white/90 text-sm"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.25)' }}
                >
                  {banner.subtitle}
                </p>
              )}
              {banner.linkUrl && (
                <span
                  className="mt-3 inline-flex items-center gap-1.5 text-white text-xs font-semibold border-b border-white/50 pb-0.5 w-fit transition-colors group-hover:border-white"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                >
                  자세히 보기
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
