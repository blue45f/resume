import { beforeEach, describe, expect, it, vi } from 'vitest';
import { processImageForUpload } from './imageProcess';

const heic2anyMock = vi.fn(async () => new Blob(['converted'], { type: 'image/jpeg' }));

vi.mock('heic2any', () => ({
  default: heic2anyMock,
}));

describe('processImageForUpload', () => {
  beforeEach(() => {
    heic2anyMock.mockClear();
  });

  it('renames MIME-detected HEIC files without HEIC extensions to .jpg after conversion', async () => {
    const original = new File(['heic'], 'camera-upload', { type: 'image/heic' });

    const processed = await processImageForUpload(original);

    expect(heic2anyMock).toHaveBeenCalledWith({
      blob: original,
      toType: 'image/jpeg',
      quality: 0.85,
    });
    expect(processed.name).toBe('camera-upload.jpg');
    expect(processed.type).toBe('image/jpeg');
  });
});
