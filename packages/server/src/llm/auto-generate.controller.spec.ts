import { Test, TestingModule } from '@nestjs/testing';
import { AutoGenerateController } from './auto-generate.controller';
import { LlmService } from './llm.service';
import { ResumesService } from '../resumes/resumes.service';

const mockLlm = { autoGenerate: jest.fn() };
const mockResumes = { create: jest.fn() };

const reqWith = (userId?: string): any => ({ user: userId ? { id: userId } : undefined });

describe('AutoGenerateController', () => {
  let controller: AutoGenerateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutoGenerateController],
      providers: [
        { provide: LlmService, useValue: mockLlm },
        { provide: ResumesService, useValue: mockResumes },
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
});
