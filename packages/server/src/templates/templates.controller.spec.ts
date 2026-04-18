import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { LocalTransformService } from './local-transform.service';
import { ResumesService } from '../resumes/resumes.service';

const mockTemplates = {
  findAll: jest.fn(),
  findPublic: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  seed: jest.fn(),
};

const mockLocalTransform = {
  transform: jest.fn(),
  transformByPreset: jest.fn(),
};

const mockResumes = { findOne: jest.fn() };

const reqWith = (user?: { id?: string; role?: string }): any => ({ user });

describe('TemplatesController', () => {
  let controller: TemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [
        { provide: TemplatesService, useValue: mockTemplates },
        { provide: LocalTransformService, useValue: mockLocalTransform },
        { provide: ResumesService, useValue: mockResumes },
      ],
    }).compile();
    controller = module.get(TemplatesController);
    jest.clearAllMocks();
  });

  it('findAll / findPublic / findOne / seed 직접 위임', () => {
    controller.findAll();
    controller.findPublicTemplates('design');
    controller.findOne('t1');
    controller.seed();
    expect(mockTemplates.findAll).toHaveBeenCalled();
    expect(mockTemplates.findPublic).toHaveBeenCalledWith('design');
    expect(mockTemplates.findOne).toHaveBeenCalledWith('t1');
    expect(mockTemplates.seed).toHaveBeenCalled();
  });

  it('create/update/remove: user meta 전달', () => {
    controller.create({ name: 'T' } as any, reqWith({ id: 'u1' }));
    expect(mockTemplates.create).toHaveBeenCalledWith({ name: 'T' }, 'u1');

    controller.update('t1', { name: 'T2' } as any, reqWith({ id: 'u1', role: 'admin' }));
    expect(mockTemplates.update).toHaveBeenCalledWith('t1', { name: 'T2' }, 'u1', 'admin');

    controller.remove('t1', reqWith({ id: 'u1', role: 'admin' }));
    expect(mockTemplates.remove).toHaveBeenCalledWith('t1', 'u1', 'admin');
  });

  describe('localTransform', () => {
    it('templateId 있으면 layout 기반 변환', async () => {
      mockResumes.findOne.mockResolvedValueOnce({ id: 'r1' });
      mockTemplates.findOne.mockResolvedValueOnce({
        name: '개발자',
        layout: '{"sections":["experience"]}',
      });
      mockLocalTransform.transform.mockReturnValueOnce('변환된 텍스트');
      const res = await controller.localTransform(
        'r1',
        { templateId: 't1' } as any,
        reqWith({ id: 'u1' }),
      );
      expect(res).toEqual({ text: '변환된 텍스트', method: 'template', templateName: '개발자' });
      expect(mockLocalTransform.transform).toHaveBeenCalledWith(
        { id: 'r1' },
        { sections: ['experience'] },
      );
    });

    it('templateId 없으면 preset 기본 "standard"', async () => {
      mockResumes.findOne.mockResolvedValueOnce({ id: 'r1' });
      mockLocalTransform.transformByPreset.mockReturnValueOnce('기본');
      const res = await controller.localTransform('r1', {} as any, reqWith({ id: 'u1' }));
      expect(res).toEqual({ text: '기본', method: 'preset', preset: 'standard' });
      expect(mockLocalTransform.transformByPreset).toHaveBeenCalledWith({ id: 'r1' }, 'standard');
    });

    it('preset 지정 전달', async () => {
      mockResumes.findOne.mockResolvedValueOnce({ id: 'r1' });
      mockLocalTransform.transformByPreset.mockReturnValueOnce('dev');
      const res = await controller.localTransform(
        'r1',
        { preset: 'developer' } as any,
        reqWith({ id: 'u1' }),
      );
      expect(res.preset).toBe('developer');
      expect(mockLocalTransform.transformByPreset).toHaveBeenCalledWith({ id: 'r1' }, 'developer');
    });

    it('이력서 소유권 체크 실패 시 변환 호출 안 함 (IDOR 방지)', async () => {
      mockResumes.findOne.mockRejectedValueOnce(new Error('forbidden'));
      await expect(
        controller.localTransform('r1', { preset: 'standard' } as any, reqWith({ id: 'u1' })),
      ).rejects.toThrow();
      expect(mockLocalTransform.transform).not.toHaveBeenCalled();
      expect(mockLocalTransform.transformByPreset).not.toHaveBeenCalled();
    });
  });

  it('getPresets: 5개 프리셋 반환', () => {
    const presets = controller.getPresets();
    expect(presets).toHaveLength(5);
    expect(presets.map((p) => p.id)).toEqual([
      'standard',
      'developer',
      'career-focused',
      'academic',
      'minimal',
    ]);
  });
});
