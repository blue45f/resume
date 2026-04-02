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

  // Seed sample resumes
  const resumeCount = await prisma.resume.count();
  if (resumeCount === 0) {
    const sampleResumes = [
      {
        title: '프론트엔드 개발자 이력서',
        slug: 'frontend-developer',
        visibility: 'public',
        personalInfo: {
          create: {
            name: '김민수',
            email: 'minsu.kim@example.com',
            phone: '010-1234-5678',
            address: '서울시 강남구',
            website: 'https://minsu.dev',
            github: 'https://github.com/minsukim',
            summary: '<p>5년차 프론트엔드 개발자입니다. React, TypeScript 기반의 대규모 웹 서비스 개발 경험이 있으며, 사용자 경험 최적화에 관심이 많습니다.</p>',
            photo: '',
            birthYear: '1995',
            links: '[]',
            military: '육군 병장 만기전역',
          },
        },
        experiences: {
          create: [
            { company: '네이버', position: '프론트엔드 개발자', department: 'FE플랫폼', startDate: '2022-03', endDate: '', current: true, description: '<p>네이버 메인 페이지 프론트엔드 개발 및 성능 최적화</p>', achievements: '<ul><li>Core Web Vitals LCP 2.1s → 1.2s 개선 (43% 향상)</li><li>컴포넌트 라이브러리 설계 및 사내 배포</li></ul>', techStack: 'React, TypeScript, Next.js, Webpack', sortOrder: 0 },
            { company: '카카오', position: '웹 개발자', department: '서비스개발팀', startDate: '2020-01', endDate: '2022-02', current: false, description: '<p>카카오톡 웹 버전 프론트엔드 개발</p>', achievements: '<ul><li>실시간 메시징 UI 구현 (WebSocket)</li><li>모바일 반응형 대응, 접근성 AA 달성</li></ul>', techStack: 'Vue.js, TypeScript, SCSS', sortOrder: 1 },
          ],
        },
        educations: {
          create: [
            { school: '서울대학교', degree: '학사', field: '컴퓨터공학', gpa: '3.8/4.3', startDate: '2014-03', endDate: '2020-02', description: '', sortOrder: 0 },
          ],
        },
        skills: {
          create: [
            { category: 'Frontend', items: 'React, Vue.js, TypeScript, Next.js, Tailwind CSS', sortOrder: 0 },
            { category: 'Backend', items: 'Node.js, NestJS, Express', sortOrder: 1 },
            { category: 'Tools', items: 'Git, Docker, AWS, Figma, Jira', sortOrder: 2 },
          ],
        },
        projects: {
          create: [
            { name: '디자인 시스템', company: '네이버', role: '리드 개발자', startDate: '2023-01', endDate: '2023-12', description: '<p>사내 공통 UI 컴포넌트 라이브러리 설계 및 개발. Storybook 기반 문서화, 30개 팀에서 사용.</p>', techStack: 'React, TypeScript, Storybook, Rollup', link: '', sortOrder: 0 },
          ],
        },
        certifications: {
          create: [
            { name: '정보처리기사', issuer: '한국산업인력공단', issueDate: '2019-11', expiryDate: '', credentialId: '', description: '', sortOrder: 0 },
          ],
        },
        languages: {
          create: [
            { name: '영어', testName: 'TOEIC', score: '920', testDate: '2023-06', sortOrder: 0 },
          ],
        },
        awards: { create: [] },
        activities: { create: [] },
      },
      {
        title: '백엔드 개발자 이력서',
        slug: 'backend-developer',
        visibility: 'public',
        personalInfo: {
          create: {
            name: '이서연',
            email: 'seoyeon@example.com',
            phone: '010-9876-5432',
            address: '성남시 분당구',
            website: '',
            github: 'https://github.com/seoyeonlee',
            summary: '<p>Java/Spring 기반 백엔드 개발자입니다. MSA 아키텍처 설계와 대용량 트래픽 처리 경험을 보유하고 있습니다.</p>',
            photo: '',
            birthYear: '1993',
            links: '[]',
            military: '',
          },
        },
        experiences: {
          create: [
            { company: '토스', position: '서버 개발자', department: '송금서비스팀', startDate: '2021-06', endDate: '', current: true, description: '<p>송금 서비스 백엔드 API 개발 및 운영</p>', achievements: '<ul><li>일 평균 500만 건 트랜잭션 처리 시스템 설계</li><li>장애 대응 자동화로 MTTR 70% 단축</li></ul>', techStack: 'Java, Spring Boot, Kafka, Redis', sortOrder: 0 },
            { company: '쿠팡', position: '소프트웨어 엔지니어', department: '', startDate: '2018-07', endDate: '2021-05', current: false, description: '<p>이커머스 주문/결제 시스템 개발</p>', achievements: '<ul><li>로켓배송 주문 처리 API 설계</li></ul>', techStack: 'Java, Spring, MySQL, AWS', sortOrder: 1 },
          ],
        },
        educations: {
          create: [
            { school: 'KAIST', degree: '석사', field: '전산학', gpa: '4.0/4.3', startDate: '2016-03', endDate: '2018-02', description: '분산 시스템 연구실', sortOrder: 0 },
            { school: '고려대학교', degree: '학사', field: '컴퓨터공학', gpa: '3.9/4.5', startDate: '2012-03', endDate: '2016-02', description: '', sortOrder: 1 },
          ],
        },
        skills: {
          create: [
            { category: 'Backend', items: 'Java, Spring Boot, Kotlin, Python', sortOrder: 0 },
            { category: 'Database', items: 'MySQL, PostgreSQL, Redis, MongoDB', sortOrder: 1 },
            { category: 'Infra', items: 'AWS, Kubernetes, Docker, Terraform', sortOrder: 2 },
          ],
        },
        projects: { create: [] },
        certifications: {
          create: [
            { name: 'AWS Solutions Architect', issuer: 'Amazon', issueDate: '2022-03', expiryDate: '2025-03', credentialId: 'AWS-SA-001', description: '', sortOrder: 0 },
          ],
        },
        languages: {
          create: [
            { name: '영어', testName: 'TOEFL', score: '105', testDate: '2022-12', sortOrder: 0 },
          ],
        },
        awards: {
          create: [
            { name: '사내 해커톤 대상', issuer: '토스', awardDate: '2023-09', description: 'AI 기반 이상거래 탐지 시스템', sortOrder: 0 },
          ],
        },
        activities: { create: [] },
      },
    ];

    for (const data of sampleResumes) {
      await prisma.resume.create({ data });
    }
    console.log(`  ✓ 샘플 이력서 ${sampleResumes.length}개 생성`);
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
