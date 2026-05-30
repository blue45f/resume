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
      providers: [TemplatesService, { provide: PrismaService, useValue: mockPrisma }],
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

    it('비공개 사용자 템플릿 + 비소유자 → NotFoundException (IDOR 방지)', async () => {
      mockPrisma.template.findUnique.mockResolvedValue({
        id: 't1',
        name: 'priv',
        visibility: 'private',
        userId: 'owner-1',
        isDefault: false,
      });
      await expect(service.findOne('t1', 'attacker-2')).rejects.toThrow(NotFoundException);
    });

    it('시스템 기본 템플릿(userId=null) → 누구나 조회 가능', async () => {
      mockPrisma.template.findUnique.mockResolvedValue({
        id: 't0',
        name: 'sys',
        visibility: 'private',
        userId: null,
        isDefault: true,
      });
      const r = await service.findOne('t0', 'anyone');
      expect(r.id).toBe('t0');
    });

    it('소유자는 자신의 비공개 템플릿 조회 가능', async () => {
      mockPrisma.template.findUnique.mockResolvedValue({
        id: 't2',
        name: 'mine',
        visibility: 'private',
        userId: 'owner-1',
        isDefault: false,
      });
      const r = await service.findOne('t2', 'owner-1');
      expect(r.id).toBe('t2');
    });
  });

  describe('create', () => {
    it('템플릿 생성', async () => {
      const data = { name: '새 템플릿', category: 'developer' };
      mockPrisma.template.create.mockResolvedValue({ id: '1', ...data });
      const result = await service.create(data);
      expect(result.name).toBe('새 템플릿');
    });

    it('비관리자는 isDefault:true 설정 불가 (강제 false)', async () => {
      mockPrisma.template.create.mockResolvedValue({ id: '1' });
      await service.create({ name: 't', isDefault: true }, 'user-1', 'user');
      expect(mockPrisma.template.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isDefault: false, userId: 'user-1' }),
      });
    });

    it('관리자는 isDefault:true 설정 가능', async () => {
      mockPrisma.template.create.mockResolvedValue({ id: '1' });
      await service.create({ name: 't', isDefault: true }, 'admin-1', 'admin');
      expect(mockPrisma.template.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isDefault: true, userId: 'admin-1' }),
      });
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
