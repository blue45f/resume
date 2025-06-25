import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  template: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createMany: jest.fn(),
  },
};

describe('TemplatesService', () => {
  let service: TemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(TemplatesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('템플릿 목록 반환 (isDefault DESC, name ASC)', async () => {
      mockPrisma.template.findMany.mockResolvedValue([
        { id: '1', name: '표준', isDefault: true },
        { id: '2', name: '커스텀', isDefault: false },
      ]);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      });
    });
  });

  describe('findOne', () => {
    it('템플릿 조회 성공', async () => {
      mockPrisma.template.findUnique.mockResolvedValue({ id: '1', name: '표준' });
      const result = await service.findOne('1');
      expect(result.name).toBe('표준');
    });

    it('없는 템플릿 → NotFoundException', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(null);
      await expect(service.findOne('fake')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('템플릿 생성', async () => {
      const data = { name: '새 템플릿', category: 'developer' };
      mockPrisma.template.create.mockResolvedValue({ id: '1', ...data });
      const result = await service.create(data);
      expect(result.name).toBe('새 템플릿');
    });
  });

  describe('update', () => {
    it('부분 수정 성공', async () => {
      mockPrisma.template.findUnique.mockResolvedValue({ id: '1', name: '이전' });
      mockPrisma.template.update.mockResolvedValue({ id: '1', name: '수정됨' });
      const result = await service.update('1', { name: '수정됨' });
      expect(result.name).toBe('수정됨');
    });

    it('없는 템플릿 수정 → NotFoundException', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(null);
      await expect(service.update('fake', { name: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('삭제 성공', async () => {
      mockPrisma.template.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.template.delete.mockResolvedValue({});
      const result = await service.remove('1');
      expect(result).toEqual({ success: true });
    });

    it('없는 템플릿 삭제 → NotFoundException', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(null);
      await expect(service.remove('fake')).rejects.toThrow(NotFoundException);
    });
  });

  describe('seed', () => {
    it('이미 시드 있으면 스킵', async () => {
      mockPrisma.template.count.mockResolvedValue(6);
      const result = await service.seed();
      expect(result.message).toContain('이미');
      expect(mockPrisma.template.createMany).not.toHaveBeenCalled();
    });

    it('시드 없으면 6개 기본 템플릿 생성', async () => {
      mockPrisma.template.count.mockResolvedValue(0);
      mockPrisma.template.createMany.mockResolvedValue({ count: 6 });
      const result = await service.seed();
      expect(result.message).toContain('6개');
      expect(mockPrisma.template.createMany).toHaveBeenCalledTimes(1);
    });
  });
});
