import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FileTextExtractorService } from './file-text-extractor.service';
import { GeminiProvider } from './providers/gemini.provider';

const makeFile = (name: string, content: string | Buffer, mime?: string): Express.Multer.File =>
  ({
    originalname: name,
    mimetype: mime || '',
    buffer: typeof content === 'string' ? Buffer.from(content) : content,
    size: typeof content === 'string' ? Buffer.byteLength(content) : content.length,
  }) as Express.Multer.File;

describe('FileTextExtractorService', () => {
  let service: FileTextExtractorService;
  let mockGemini: {
    isAvailable: boolean;
    extractImageText: jest.Mock;
  };

  beforeEach(async () => {
    mockGemini = { isAvailable: true, extractImageText: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileTextExtractorService, { provide: GeminiProvider, useValue: mockGemini }],
    }).compile();
    service = module.get(FileTextExtractorService);
  });

  describe('TXT 파일', () => {
    it('utf-8 텍스트 그대로 추출', async () => {
      const file = makeFile('resume.txt', '안녕하세요 홍길동입니다');
      const text = await service.extract(file);
      expect(text).toContain('홍길동');
    });

    it('빈 텍스트 → BadRequestException', async () => {
      const file = makeFile('empty.txt', '   \n  ');
      await expect(service.extract(file)).rejects.toThrow(BadRequestException);
    });
  });

  describe('RTF 파일', () => {
    it('RTF control word 제거하고 텍스트만 추출', async () => {
      const rtf =
        '{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Arial;}} \\f0\\fs24 안녕하세요 홍길동입니다}';
      const file = makeFile('resume.rtf', rtf);
      const text = await service.extract(file);
      expect(text).toContain('홍길동');
      expect(text).not.toContain('\\rtf1');
      expect(text).not.toContain('{');
    });
  });

  describe('지원하지 않는 형식', () => {
    it('.doc 형식 → docx 변환 안내 에러', async () => {
      const file = makeFile('old.doc', 'binary', 'application/msword');
      await expect(service.extract(file)).rejects.toThrow(/.docx/);
    });

    it('알 수 없는 확장자 → BadRequestException', async () => {
      const file = makeFile('weird.xyz', 'content');
      await expect(service.extract(file)).rejects.toThrow(BadRequestException);
    });
  });

  describe('파일 크기 제한', () => {
    it('10MB 초과 → BadRequestException', async () => {
      const huge = Buffer.alloc(11 * 1024 * 1024);
      const file = makeFile('big.pdf', huge, 'application/pdf');
      await expect(service.extract(file)).rejects.toThrow(/너무 큽니다/);
    });
  });

  describe('파일 누락', () => {
    it('null/undefined 파일 → BadRequestException', async () => {
      await expect(service.extract(undefined as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('스캔 이미지 PDF 폴백 (Gemini Vision)', () => {
    // pdf-parse mock — extractPdf 결과 직접 제어
    let extractPdfSpy: jest.SpyInstance;
    afterEach(() => extractPdfSpy?.mockRestore());

    it('pdf-parse 결과 < 50자 + Gemini available → Vision 폴백', async () => {
      extractPdfSpy = jest
        .spyOn<any, any>(service as any, 'extractPdf')
        .mockResolvedValue('짧은\n');
      mockGemini.extractImageText.mockResolvedValueOnce('Vision OCR 결과 — 풍부한 텍스트');

      const file = makeFile('scan.pdf', Buffer.from([0x25, 0x50, 0x44, 0x46]), 'application/pdf');
      const text = await service.extract(file);
      expect(text).toContain('Vision OCR');
      expect(mockGemini.extractImageText).toHaveBeenCalledWith(
        expect.any(Buffer),
        'application/pdf',
      );
    });

    it('pdf-parse 결과 충분 (>50자) → Vision 폴백 안 함', async () => {
      extractPdfSpy = jest
        .spyOn<any, any>(service as any, 'extractPdf')
        .mockResolvedValue('이력서 본문이 충분히 길어서 OCR 폴백이 불필요한 경우입니다.'.repeat(2));

      const file = makeFile('text.pdf', Buffer.from([0x25, 0x50, 0x44, 0x46]), 'application/pdf');
      await service.extract(file);
      expect(mockGemini.extractImageText).not.toHaveBeenCalled();
    });

    it('Gemini 비활성 시 폴백 시도 안 함 (짧은 텍스트라도 그대로)', async () => {
      mockGemini.isAvailable = false;
      extractPdfSpy = jest
        .spyOn<any, any>(service as any, 'extractPdf')
        .mockResolvedValue('짧은 텍스트만 있음');

      const file = makeFile('scan.pdf', Buffer.from([0x25, 0x50, 0x44, 0x46]), 'application/pdf');
      const text = await service.extract(file);
      expect(text).toBe('짧은 텍스트만 있음');
      expect(mockGemini.extractImageText).not.toHaveBeenCalled();
    });
  });

  describe('한글 OCR 후처리 (postProcessKoreanOcr)', () => {
    it('한글 음절 사이 공백 제거: 경 력 → 경력', () => {
      const out = service.postProcessKoreanOcr('경 력 사 항: 카 카 오 5 년');
      expect(out).toContain('경력');
      expect(out).toContain('카카오');
    });

    it('숫자 + 한글 단위 결합: 5 년 → 5년', () => {
      expect(service.postProcessKoreanOcr('경력 5 년')).toBe('경력 5년');
      expect(service.postProcessKoreanOcr('100 명 규모')).toBe('100명 규모');
    });

    it('4자리 연도 결합: 20 23년 → 2023년', () => {
      expect(service.postProcessKoreanOcr('20 23년')).toBe('2023년');
      expect(service.postProcessKoreanOcr('20 23.05')).toBe('2023.05');
    });

    it('회사·대학 흔한 suffix 결합', () => {
      expect(service.postProcessKoreanOcr('주식 회사 카카오')).toBe('주식회사 카카오');
      expect(service.postProcessKoreanOcr('서울 대 학 교')).toBe('서울 대학교');
    });

    it('NFD 한글 자모 → NFC 결합', () => {
      // '한글' (자모 분리) → '한글' (NFC)
      const decomposed = '한글'.normalize('NFD');
      expect(service.postProcessKoreanOcr(decomposed)).toBe('한글');
    });

    it('빈 입력 → 빈 출력', () => {
      expect(service.postProcessKoreanOcr('')).toBe('');
    });

    it('영문 텍스트 변경 안 함', () => {
      expect(service.postProcessKoreanOcr('Hello World 2023')).toBe('Hello World 2023');
    });
  });

  describe('이미지 OCR (Gemini Vision)', () => {
    it('jpg → Gemini extractImageText 호출 → 결과 반환', async () => {
      mockGemini.extractImageText.mockResolvedValueOnce('OCR 결과 텍스트');
      const file = makeFile('photo.jpg', Buffer.from([0xff, 0xd8, 0xff]), 'image/jpeg');
      const text = await service.extract(file);
      expect(text).toContain('OCR 결과 텍스트');
      expect(mockGemini.extractImageText).toHaveBeenCalledWith(expect.any(Buffer), 'image/jpeg');
    });

    it('png → 동작', async () => {
      mockGemini.extractImageText.mockResolvedValueOnce('PNG 텍스트');
      const file = makeFile('scan.png', Buffer.from([0x89, 0x50, 0x4e, 0x47]), 'image/png');
      const text = await service.extract(file);
      expect(text).toBe('PNG 텍스트');
    });

    it('Gemini 비활성 → 명시 에러', async () => {
      mockGemini.isAvailable = false;
      const file = makeFile('photo.jpg', Buffer.from([0xff]), 'image/jpeg');
      await expect(service.extract(file)).rejects.toThrow(/이미지 OCR/);
    });

    it('5MB 초과 이미지 → 압축 안내 에러', async () => {
      const huge = Buffer.alloc(6 * 1024 * 1024);
      const file = makeFile('big.png', huge, 'image/png');
      await expect(service.extract(file)).rejects.toThrow(/너무 큽니다/);
    });
  });
});
