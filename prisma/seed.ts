import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed default templates
  const templateCount = await prisma.template.count();
  if (templateCount === 0) {
    await prisma.template.createMany({
      data: [
        {
          name: '표준 이력서',
          description: '깔끔하고 전문적인 한국어 표준 이력서',
          category: 'general',
          prompt:
            '주어진 데이터를 전문적인 한국어 표준 이력서 양식으로 변환해주세요. 성과 중심으로 서술하고, 간결하고 명확한 문장을 사용하세요.',
          isDefault: true,
        },
        {
          name: '경력기술서',
          description: '상세한 프로젝트/업무별 경력 기술',
          category: 'general',
          prompt:
            '주어진 데이터를 상세한 경력기술서로 변환해주세요. STAR 기법(Situation, Task, Action, Result)을 활용하여 각 경험을 구체적으로 서술하세요.',
          isDefault: true,
        },
        {
          name: '영문 이력서',
          description: 'US 스타일 영문 이력서',
          category: 'international',
          prompt:
            'Transform the resume data into a polished US-style English resume. Use strong action verbs, quantify achievements, and keep it ATS-friendly.',
          isDefault: true,
        },
        {
          name: '개발자 이력서',
          description: '기술 스택과 프로젝트 중심 개발자 이력서',
          category: 'developer',
          prompt:
            '개발자에 최적화된 이력서로 변환해주세요. 기술 스택을 눈에 띄게 정리하고, 프로젝트별 기술적 기여도와 아키텍처 결정 사항을 강조하세요.',
          isDefault: true,
        },
        {
          name: '자기소개서',
          description: '스토리텔링 기반 자기소개서',
          category: 'general',
          prompt:
            '주어진 데이터를 바탕으로 설득력 있는 자기소개서를 작성해주세요. 지원 동기, 성장 과정, 직무 역량, 입사 후 포부로 구성하세요.',
          isDefault: true,
        },
        {
          name: 'LinkedIn 프로필',
          description: 'LinkedIn 최적화 프로필 텍스트',
          category: 'international',
          prompt:
            'Optimize this resume data for a LinkedIn profile. Include a compelling headline, engaging summary, and keyword-rich experience descriptions.',
          isDefault: true,
        },
      ],
    });
    console.log('✓ 기본 템플릿 6개 생성 완료');
  }

  // Seed sample tags
  const tagCount = await prisma.tag.count();
  if (tagCount === 0) {
    await prisma.tag.createMany({
      data: [
        { name: '프론트엔드', color: '#3b82f6' },
        { name: '백엔드', color: '#10b981' },
        { name: '풀스택', color: '#8b5cf6' },
        { name: '2026 상반기', color: '#f59e0b' },
        { name: '인턴', color: '#ec4899' },
      ],
    });
    console.log('✓ 기본 태그 5개 생성 완료');
  }

  console.log('시드 완료!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
