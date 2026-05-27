export default function HomeHeroVisual() {
  return (
    <div className="home-hero-visual pointer-events-none hidden lg:block" aria-hidden="true">
      <div className="home-hero-visual__badge" />
      <div className="home-hero-visual__halo" />
      <div className="home-hero-visual__orbit" />
      <div className="home-hero-visual__orbit home-hero-visual__orbit--ring" />
      <div className="home-hero-visual__bar home-hero-visual__bar--1" />
      <div className="home-hero-visual__bar home-hero-visual__bar--2" />
      <div className="home-hero-visual__bar home-hero-visual__bar--3" />
      <div className="home-hero-visual__dot home-hero-visual__dot--1" />
      <div className="home-hero-visual__dot home-hero-visual__dot--2" />
      <div className="home-hero-visual__spark home-hero-visual__spark--1" />
      <div className="home-hero-visual__spark home-hero-visual__spark--2" />
      <div className="home-hero-visual__spark home-hero-visual__spark--3" />
      <svg
        viewBox="0 0 560 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="home-hero-visual__diagram"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hero-soft-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hero-soft-cyan" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="64" y="72" width="360" height="210" rx="14" fill="url(#hero-soft-blue)" />
        <rect
          x="88"
          y="84"
          width="300"
          height="186"
          rx="12"
          fill="var(--color-surface)"
          fillOpacity="0.92"
        />
        <rect
          x="98"
          y="94"
          width="280"
          height="18"
          rx="9"
          fill="var(--color-surface-raised)"
          fillOpacity="0.9"
        />
        <rect
          x="122"
          y="124"
          width="252"
          height="12"
          rx="6"
          fill="var(--color-accent-soft)"
          opacity="0.5"
        />
        <rect
          x="122"
          y="144"
          width="192"
          height="12"
          rx="6"
          fill="var(--color-accent-soft)"
          opacity="0.44"
        />
        <path
          d="M130 130L188 150L238 136L286 168L352 118L423 149"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="home-hero-visual__line"
        />
        <rect
          x="110"
          y="176"
          width="84"
          height="72"
          rx="10"
          fill="var(--color-accent-soft)"
          opacity="0.8"
        />
        <rect
          x="208"
          y="176"
          width="84"
          height="72"
          rx="10"
          fill="var(--color-accent-soft)"
          opacity="0.65"
        />
        <rect
          x="306"
          y="176"
          width="84"
          height="72"
          rx="10"
          fill="var(--color-accent-soft)"
          opacity="0.45"
        />
        <circle cx="152" cy="212" r="18" stroke="var(--color-accent)" strokeWidth="2" fill="none" />
        <circle cx="250" cy="212" r="18" stroke="var(--color-accent)" strokeWidth="2" fill="none" />
        <circle cx="348" cy="212" r="18" stroke="var(--color-accent)" strokeWidth="2" fill="none" />
        <circle cx="152" cy="212" r="5" fill="var(--color-accent)" />
        <circle cx="250" cy="212" r="5" fill="var(--color-accent)" />
        <circle cx="348" cy="212" r="5" fill="var(--color-accent)" />
        <path
          d="M132 260L170 228L207 248L253 214L300 236L350 214L393 226L430 196L480 214"
          stroke="url(#hero-soft-cyan)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M160 248L210 248L268 234L310 246L358 236"
          stroke="rgba(15, 118, 110, 0.35)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M130 112L423 112"
          stroke="rgba(15, 118, 110, 0.22)"
          strokeWidth="1"
          strokeDasharray="3 8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
