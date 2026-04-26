/**
 * 클라이언트 이미지 전처리 — 업로드 전 HEIC 변환 + 자동 압축.
 *
 * 사용처: AvatarEditor / 향후 photo-resume-import / community attachment 등.
 * 모두 dynamic import 로 lazy load — 메인 번들 부담 0.
 *
 * - HEIC: iPhone 기본 포맷, browser native 미지원 → JPEG 으로 변환
 * - 압축: 5MB 초과 / 큰 해상도 → maxWidthOrHeight 1920 + quality 0.85 정도로 축소
 */

const MAX_DIM = 1920;
const COMPRESSION_THRESHOLD_BYTES = 1.5 * 1024 * 1024; // 1.5MB 초과만 압축

/** HEIC 파일 → JPEG. 다른 포맷은 그대로 반환. */
async function convertHeicIfNeeded(file: File): Promise<File> {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif');
  if (!isHeic) return file;

  // heic2any 는 ESM-only 무거운 라이브러리 — 동적 로드
  const heic2any = (await import('heic2any')).default;
  const blob = (await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })) as Blob;
  const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
  return new File([blob], newName, { type: 'image/jpeg' });
}

/** 큰 이미지 압축 — 1.5MB 미만이면 그대로 반환. */
async function compressIfLarge(file: File): Promise<File> {
  if (file.size < COMPRESSION_THRESHOLD_BYTES) return file;
  const imageCompression = (await import('browser-image-compression')).default;
  const compressed = await imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: MAX_DIM,
    useWebWorker: true,
    fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
  });
  // imageCompression 반환은 Blob — File 로 wrap
  return new File([compressed], file.name, { type: compressed.type || file.type });
}

/**
 * 업로드 전 이미지 처리 — HEIC → JPEG 변환 + 큰 파일 압축.
 * 실패 시 원본 그대로 반환 (silent fallback) — 업로드는 계속 가능.
 */
export async function processImageForUpload(file: File): Promise<File> {
  try {
    const converted = await convertHeicIfNeeded(file);
    const compressed = await compressIfLarge(converted);
    return compressed;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[imageProcess] 처리 실패, 원본 사용:', err);
    }
    return file;
  }
}
