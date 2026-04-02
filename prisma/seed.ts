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

  // Seed sample job applications
  const appCount = await prisma.jobApplication.count();
  if (appCount === 0) {
    const sampleApplications = [
      { company: '네이버', position: '프론트엔드 개발자', status: 'interview', url: 'https://recruit.navercorp.com', location: '성남시 분당구', salary: '6,000만원', notes: '2차 면접 예정', appliedDate: '2025-03-15' },
      { company: '카카오', position: 'React 개발자', status: 'applied', url: 'https://careers.kakao.com', location: '성남시 판교', salary: '5,500만원', notes: '서류 접수 완료', appliedDate: '2025-03-20' },
      { company: '토스', position: '웹 프론트엔드', status: 'screening', url: 'https://toss.im/career', location: '서울시 강남구', salary: '7,000만원', appliedDate: '2025-03-18' },
      { company: '쿠팡', position: 'Software Engineer', status: 'offer', url: 'https://www.coupang.jobs', location: '서울시 송파구', salary: '8,000만원', notes: '오퍼 수령, 처우 협상 중', appliedDate: '2025-02-28' },
      { company: '당근마켓', position: 'Frontend Developer', status: 'rejected', url: 'https://about.daangn.com/jobs', location: '서울시 서초구', salary: '6,500만원', notes: '코딩 테스트 탈락', appliedDate: '2025-03-01' },
      { company: '라인', position: 'Web Developer', status: 'applied', url: 'https://careers.linecorp.com', location: '성남시 분당구', salary: '6,000만원', appliedDate: '2025-03-25' },
      { company: 'NHN', position: '프론트엔드 엔지니어', status: 'interview', location: '성남시 분당구', salary: '5,000만원', notes: '1차 기술 면접 통과', appliedDate: '2025-03-10' },
      { company: '우아한형제들', position: 'React Developer', status: 'withdrawn', url: 'https://career.woowahan.com', location: '서울시 송파구', notes: '다른 오퍼 수락으로 취소', appliedDate: '2025-03-05' },
    ];

    for (const app of sampleApplications) {
      await prisma.jobApplication.create({ data: app });
    }
    console.log(`  ✓ 샘플 지원 내역 ${sampleApplications.length}개 생성`);
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
