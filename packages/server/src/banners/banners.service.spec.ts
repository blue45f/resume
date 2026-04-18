import { Test, TestingModule } from '@nestjs/testing';
import { BannersService } from './banners.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma: any = {
  banner: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('BannersService', () => {
  let service: BannersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BannersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(BannersService);
    jest.clearAllMocks();
  });

  it('getActive: isActive=true + 유효기간 조건 + order asc 정렬', async () => {
    mockPrisma.banner.findMany.mockResolvedValueOnce([]);
    await service.getActive();
    const call = mockPrisma.banner.findMany.mock.calls[0][0];
    expect(call.where.isActive).toBe(true);
    expect(call.orderBy).toEqual({ order: 'asc' });
    // startAt/endAt 조건 형태 체크 (null 허용 + 현재시각 포함)
    expect(call.where.OR).toHaveLength(2);
    expect(call.where.AND[0].OR).toHaveLength(2);
  });

  it('getAll: order asc 전체 목록', async () => {
    mockPrisma.banner.findMany.mockResolvedValueOnce([]);
    await service.getAll();
    expect(mockPrisma.banner.findMany).toHaveBeenCalledWith({ orderBy: { order: 'asc' } });
  });

  it('create: 입력 데이터 그대로 전달', async () => {
    mockPrisma.banner.create.mockResolvedValueOnce({ id: 'b1' });
    await service.create({ title: '공지', image: 'x.png' });
    expect(mockPrisma.banner.create).toHaveBeenCalledWith({
      data: { title: '공지', image: 'x.png' },
    });
  });

  it('reorder: ids 순서대로 order 인덱스 업데이트', async () => {
    mockPrisma.banner.update.mockResolvedValue({});
    await service.reorder(['b3', 'b1', 'b2']);
    expect(mockPrisma.banner.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'b3' },
      data: { order: 0 },
    });
    expect(mockPrisma.banner.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'b1' },
      data: { order: 1 },
    });
    expect(mockPrisma.banner.update).toHaveBeenNthCalledWith(3, {
      where: { id: 'b2' },
      data: { order: 2 },
    });
  });

  it('remove: id 기준 삭제', async () => {
    mockPrisma.banner.delete.mockResolvedValueOnce({});
    await service.remove('b1');
    expect(mockPrisma.banner.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
  });
});
