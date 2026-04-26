import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FileTextExtractorService } from './file-text-extractor.service';

const makeFile = (name: string, content: string | Buffer, mime?: string): Express.Multer.File =>
  ({
    originalname: name,
    mimetype: mime || '',
    buffer: typeof content === 'string' ? Buffer.from(content) : content,
    size: typeof content === 'string' ? Buffer.byteLength(content) : content.length,
  }) as Express.Multer.File;

describe('FileTextExtractorService', () => {
  let service: FileTextExtractorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileTextExtractorService],
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
});
