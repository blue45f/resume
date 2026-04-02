import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.template.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('템플릿을 찾을 수 없습니다');
    return template;
  }

  async create(data: {
    name: string;
    description?: string;
    category?: string;
    prompt?: string;
    layout?: string;
    isDefault?: boolean;
  }, userId?: string) {
    return this.prisma.template.create({ data: { ...data, userId: userId || null } });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      prompt?: string;
      layout?: string;
      isDefault?: boolean;
    },
    userId?: string,
    role?: string,
  ) {
    const existing = await this.prisma.template.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('템플릿을 찾을 수 없습니다');
    if (role !== 'admin' && role !== 'superadmin') {
      if (existing.isDefault) {
        throw new ForbiddenException('기본 템플릿은 수정할 수 없습니다');
      }
      if (existing.userId && existing.userId !== userId) {
        throw new ForbiddenException('이 템플릿을 수정할 권한이 없습니다');
      }
    }
    return this.prisma.template.update({ where: { id }, data });
  }

  async remove(id: string, userId?: string, role?: string) {
    const existing = await this.prisma.template.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('템플릿을 찾을 수 없습니다');
    if (role !== 'admin' && role !== 'superadmin') {
      if (existing.isDefault) {
        throw new ForbiddenException('기본 템플릿은 삭제할 수 없습니다');
      }
      if (existing.userId && existing.userId !== userId) {
        throw new ForbiddenException('이 템플릿을 삭제할 권한이 없습니다');
      }
    }
    await this.prisma.template.delete({ where: { id } });
    return { success: true };
  }

  async seed() {
    const count = await this.prisma.template.count();
    if (count > 0) return { message: '이미 시드 데이터가 존재합니다' };

    const defaults = [
      {
        name: '표준 이력서',
        description: '전체 섹션을 기본 순서로 깔끔하게 표시',
        category: 'general',
        prompt: '주어진 데이터를 전문적인 한국어 표준 이력서 양식으로 변환해주세요.',
        layout: JSON.stringify({
          sections: ['personalInfo', 'summary', 'experiences', 'educations', 'skills', 'certifications', 'languages', 'awards', 'projects', 'activities'],
          dateFormat: 'dot', style: 'formal',
        }),
        isDefault: true,
      },
      {
        name: '경력기술서',
        description: '경력과 프로젝트를 상세히 기술',
        category: 'general',
        prompt: '주어진 데이터를 상세한 경력기술서로 변환해주세요. STAR 기법을 활용하세요.',
        layout: JSON.stringify({
          sections: ['personalInfo', 'summary', 'experiences', 'projects', 'skills', 'certifications', 'educations'],
          dateFormat: 'dot', style: 'formal',
        }),
        isDefault: true,
      },
      {
        name: '개발자 이력서',
        description: '기술 스택과 프로젝트 중심',
        category: 'developer',
        prompt: '개발자에 최적화된 이력서로 변환해주세요. 기술 스택과 기술적 기여도를 강조하세요.',
        layout: JSON.stringify({
          sections: ['personalInfo', 'summary', 'skills', 'experiences', 'projects', 'certifications', 'educations', 'languages'],
          dateFormat: 'dot', style: 'modern',
        }),
        isDefault: true,
      },
      {
        name: '영문 이력서',
        description: 'US 스타일 영문 이력서',
        category: 'international',
        prompt: 'Transform the resume data into a polished US-style English resume.',
        layout: JSON.stringify({
          sections: ['personalInfo', 'summary', 'experiences', 'educations', 'skills', 'projects', 'certifications'],
          dateFormat: 'dash', style: 'modern',
        }),
        isDefault: true,
      },
      {
        name: '자기소개서',
        description: '스토리텔링 기반 자기소개서',
        category: 'general',
        prompt: '주어진 데이터를 바탕으로 설득력 있는 자기소개서를 작성해주세요.',
        layout: JSON.stringify({
          sections: ['personalInfo', 'summary', 'experiences', 'projects', 'educations', 'awards'],
          dateFormat: 'text', style: 'formal',
        }),
        isDefault: true,
      },
      {
        name: 'LinkedIn 프로필',
        description: 'LinkedIn 최적화 프로필',
        category: 'international',
        prompt: 'Optimize this resume data for a LinkedIn profile.',
        layout: JSON.stringify({
          sections: ['personalInfo', 'summary', 'experiences', 'skills', 'educations', 'certifications', 'projects'],
          dateFormat: 'dot', style: 'modern',
        }),
        isDefault: true,
      },
    ];

    await this.prisma.template.createMany({ data: defaults });
    return { message: `${defaults.length}개의 기본 템플릿이 생성되었습니다` };
  }
}
