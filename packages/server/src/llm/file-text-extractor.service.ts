import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // Gemini Vision 권장 5MB
const MAX_TEXT_LEN = 30_000;

const IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']);
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];

/**
 * 업로드된 파일(PDF / DOCX / TXT / RTF / 이미지) → 평문 텍스트 추출.
 *
 * 사용처: AutoGenerateController — 사용자가 기존 PDF/Word/사진 이력서 업로드 시
 * 텍스트 추출 → AI 가 구조화 이력서로 변환.
 *
 * 의존성:
 * - pdf-parse: PDF (텍스트 임베드된 PDF 만, 스캔 이미지 PDF 는 향후 페이지 → 이미지 변환 필요)
 * - mammoth: DOCX (Word 신형식)
 * - Gemini Vision: 이미지 OCR (.jpg / .png / .webp). API 키 없으면 명시 에러
 * - 기본 utf-8 디코딩: TXT/RTF (RTF 는 control word 제거 후)
 */
@Injectable()
export class FileTextExtractorService {
  private readonly logger = new Logger(FileTextExtractorService.name);

  constructor(private gemini: GeminiProvider) {}

  async extract(file: Express.Multer.File): Promise<string> {
    if (!file) throw new BadRequestException('파일이 필요합니다');
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException(
        `파일이 너무 큽니다 (${(file.size / 1024 / 1024).toFixed(1)}MB / 최대 10MB)`,
      );
    }
    const name = (file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    const isImage = IMAGE_MIMES.has(mime) || IMAGE_EXTS.some((e) => name.endsWith(e));

    let text = '';
    try {
      if (name.endsWith('.pdf') || mime === 'application/pdf') {
        text = await this.extractPdf(file.buffer);
      } else if (
        name.endsWith('.docx') ||
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        text = await this.extractDocx(file.buffer);
      } else if (name.endsWith('.txt') || mime === 'text/plain') {
        text = file.buffer.toString('utf-8');
      } else if (name.endsWith('.rtf') || mime === 'application/rtf' || mime === 'text/rtf') {
        text = this.stripRtf(file.buffer.toString('utf-8'));
      } else if (isImage) {
        text = await this.extractImage(file);
      } else if (name.endsWith('.doc') || mime === 'application/msword') {
        // 옛날 .doc 형식 — mammoth 불가. 사용자에게 docx 변환 안내.
        throw new BadRequestException(
          'Word 97-2003 (.doc) 형식은 지원하지 않습니다. .docx 로 변환 후 업로드해주세요.',
        );
      } else {
        throw new BadRequestException(
          '지원하지 않는 파일 형식입니다. PDF / DOCX / TXT / RTF / 이미지(JPG/PNG) 만 가능합니다.',
        );
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.warn(`텍스트 추출 실패 (${name}): ${(err as Error).message}`);
      throw new BadRequestException(
        '파일에서 텍스트를 추출하지 못했습니다. 파일이 손상되었거나 보호되어 있을 수 있습니다.',
      );
    }

    const cleaned = text
      .replace(/\r\n/g, '\n')
      // PDF parser 가 가끔 NUL 바이트를 끼워넣음 — 제거.
      // eslint-disable-next-line no-control-regex
      .replace(/\x00/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!cleaned) {
      throw new BadRequestException(
        '파일에서 텍스트를 찾을 수 없습니다. 스캔 이미지 PDF 라면 텍스트 임베드된 버전이 필요합니다.',
      );
    }

    return cleaned.slice(0, MAX_TEXT_LEN);
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    // pdf-parse 는 default export 를 가짐 — dynamic import 로 ESM/CJS 양쪽 호환
    const mod = (await import('pdf-parse')) as unknown as {
      default?: (b: Buffer) => Promise<{ text?: string }>;
    } & ((b: Buffer) => Promise<{ text?: string }>);
    const fn = mod.default || mod;
    const data = await fn(buffer);
    return String(data?.text || '');
  }

  private async extractDocx(buffer: Buffer): Promise<string> {
    const mod = (await import('mammoth')) as unknown as {
      extractRawText: (input: { buffer: Buffer }) => Promise<{ value?: string }>;
    };
    const result = await mod.extractRawText({ buffer });
    return String(result?.value || '');
  }

  /** Gemini Vision 으로 이미지 OCR. 사진/스캔본/명함 모두 지원. */
  private async extractImage(file: Express.Multer.File): Promise<string> {
    if (!this.gemini.isAvailable) {
      throw new BadRequestException('이미지 OCR 기능이 비활성화되어 있습니다 (관리자 설정 필요)');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException(
        `이미지가 너무 큽니다 (${(file.size / 1024 / 1024).toFixed(1)}MB / 최대 5MB). 압축 후 다시 시도해주세요.`,
      );
    }
    const mime = file.mimetype && file.mimetype.startsWith('image/') ? file.mimetype : 'image/jpeg';
    return this.gemini.extractImageText(file.buffer, mime);
  }

  /** RTF control words / groups 제거 — 매우 단순한 구현 (완전한 RTF parser 아님). */
  private stripRtf(rtf: string): string {
    return rtf
      .replace(/\{\\\*?[^{}]*\}/g, ' ') // {\* ... } 메타 그룹
      .replace(/\\[a-z]+(-?\d+)?\s?/gi, ' ') // \rtf1 \ansi 등
      .replace(/\\'[\dA-Fa-f]{2}/g, ' ') // hex escape (\'XX)
      .replace(/[{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
