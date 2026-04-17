// Type declarations for Swiper.js CSS side-effect imports.
// Swiper's package.json exports these paths as CSS assets which the Vite
// bundler can load, but TypeScript's `noUncheckedSideEffectImports` requires
// explicit module declarations.

declare module 'swiper/css';
declare module 'swiper/css/*';
