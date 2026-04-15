import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async getAll(type?: string, page = 1, limit = 10) {
    const where: any = {};
    if (type) where.type = type;
    const [items, total] = await Promise.all([
      this.prisma.notice.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notice.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPopup() {
    const now = new Date();
    return this.prisma.notice.findMany({
      where: {
        isPopup: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
  }

  async getOne(id: string) {
    return this.prisma.notice.findUniqueOrThrow({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.notice.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.notice.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.notice.delete({ where: { id } });
  }
}
