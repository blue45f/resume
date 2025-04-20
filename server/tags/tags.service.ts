import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const tags = await this.prisma.tag.findMany({
      include: { _count: { select: { resumes: true } } },
      orderBy: { name: 'asc' },
    });
    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      resumeCount: t._count.resumes,
    }));
  }

  async create(data: { name: string; color?: string }) {
    const existing = await this.prisma.tag.findUnique({
      where: { name: data.name },
    });
    if (existing) throw new ConflictException('이미 존재하는 태그입니다');
    return this.prisma.tag.create({ data });
  }

  async remove(id: string) {
    const existing = await this.prisma.tag.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('태그를 찾을 수 없습니다');
    await this.prisma.tag.delete({ where: { id } });
    return { success: true };
  }

  async addTagToResume(resumeId: string, tagId: string) {
    await this.prisma.tagsOnResumes.create({
      data: { resumeId, tagId },
    });
    return { success: true };
  }

  async removeTagFromResume(resumeId: string, tagId: string) {
    await this.prisma.tagsOnResumes.delete({
      where: { resumeId_tagId: { resumeId, tagId } },
    });
    return { success: true };
  }
}
