import { Test, TestingModule } from '@nestjs/testing';
import { AutoGenerateController } from './auto-generate.controller';
import { LlmService } from './llm.service';
import { ResumesService } from '../resumes/resumes.service';
import { FileTextExtractorService } from './file-text-extractor.service';

const mockLlm = { autoGenerate: jest.fn() };
const mockResumes = { create: jest.fn() };
const mockExtractor = { extract: jest.fn() };

const reqWith = (userId?: string): any => ({ user: userId ? { id: userId } : undefined });

describe('AutoGenerateController', () => {
  let controller: AutoGenerateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutoGenerateController],
      providers: [
        { provide: LlmService, useValue: mockLlm },
        { provide: ResumesService, useValue: mockResumes },
        { provide: FileTextExtractorService, useValue: mockExtractor },
      ],
    }).compile();
    controller = module.get(AutoGenerateController);
    jest.clearAllMocks();
  });

  describe('preview', () => {
    it('autoGenerate 호출 결과 그대로 반환 (저장 안 함)', async () => {
      mockLlm.autoGenerate.mockResolvedValueOnce({
        resume: { title: 'T' },
        tokensUsed: 100,
        provider: 'groq',
        model: 'llama',
      });
      const res = await controller.preview({ rawText: '...' } as any);
      expect(res).toEqual({
        resume: { title: 'T' },
        tokensUsed: 100,
        provider: 'groq',
        model: 'llama',
      });
      expect(mockResumes.create).not.toHaveBeenCalled();
    });

    it('instruction 전달', async () => {
      mockLlm.autoGenerate.mockResolvedValueOnce({});
      await controller.preview({ rawText: 'raw', instruction: '짧게' } as any);
      expect(mockLlm.autoGenerate).toHaveBeenCalledWith('raw', '짧게');
    });
  });

  describe('create', () => {
    it('LLM 생성 + DB 저장 + 응답에 메타 포함', async () => {
      mockLlm.autoGenerate.mockResolvedValueOnce({
        resume: { title: 'T' },
        tokensUsed: 200,
        provider: 'openai',
        model: 'gpt-4',
      });
      mockResumes.create.mockResolvedValueOnce({ id: 'r1', title: 'T' });

      const res = await controller.create({ rawText: 'raw' } as any, reqWith('u1'));
      expect(mockResumes.create).toHaveBeenCalledWith({ title: 'T' }, 'u1');
      expect(res).toEqual({
        resume: { id: 'r1', title: 'T' },
        tokensUsed: 200,
        provider: 'openai',
        model: 'gpt-4',
      });
    });

    it('비로그인도 create 시 userId=undefined 로 저장 시도 (service 에서 판정)', async () => {
      mockLlm.autoGenerate.mockResolvedValueOnce({ resume: {}, tokensUsed: 0 });
      mockResumes.create.mockResolvedValueOnce({ id: 'r1' });
      await controller.create({ rawText: 'raw' } as any, reqWith());
      expect(mockResumes.create).toHaveBeenCalledWith({}, undefined);
    });
  });

  describe('파일 업로드', () => {
    it('preview: file 첨부 시 fileExtractor.extract 결과를 rawText 로 사용', async () => {
      mockExtractor.extract.mockResolvedValueOnce('PDF에서 추출된 텍스트');
      mockLlm.autoGenerate.mockResolvedValueOnce({ resume: {}, tokensUsed: 0 });
      const fakeFile = { originalname: 'r.pdf', buffer: Buffer.from('x') } as any;
      await controller.preview({ rawText: '' } as any, fakeFile);
      expect(mockExtractor.extract).toHaveBeenCalledWith(fakeFile);
      expect(mockLlm.autoGenerate).toHaveBeenCalledWith('PDF에서 추출된 텍스트', undefined);
    });

    it('preview: file 없을 때 dto.rawText 그대로 사용 (기존 흐름)', async () => {
      mockLlm.autoGenerate.mockResolvedValueOnce({ resume: {}, tokensUsed: 0 });
      await controller.preview({ rawText: '직접 입력' } as any, undefined);
      expect(mockExtractor.extract).not.toHaveBeenCalled();
      expect(mockLlm.autoGenerate).toHaveBeenCalledWith('직접 입력', undefined);
    });

    it('create: file 첨부 → 텍스트 추출 + AI 생성 + DB 저장', async () => {
      mockExtractor.extract.mockResolvedValueOnce('docx 내용');
      mockLlm.autoGenerate.mockResolvedValueOnce({
        resume: { title: 'X' },
        tokensUsed: 100,
        provider: 'groq',
        model: 'llama',
      });
      mockResumes.create.mockResolvedValueOnce({ id: 'r1' });
      const fakeFile = { originalname: 'old.docx', buffer: Buffer.from('x') } as any;
      const res = await controller.create({ rawText: '' } as any, reqWith('u1'), fakeFile);
      expect(mockExtractor.extract).toHaveBeenCalledWith(fakeFile);
      expect(mockLlm.autoGenerate).toHaveBeenCalledWith('docx 내용', undefined);
      expect(res).toMatchObject({ resume: { id: 'r1' }, tokensUsed: 100 });
    });
  });
});
