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
        {
          name: 'AI/ML 엔지니어',
          description: 'AI 및 머신러닝 엔지니어 전용',
          category: 'developer',
          prompt: 'AI/ML 엔지니어에 최적화된 이력서로 변환해주세요. 모델 개발 경험, 논문, 기술 스택을 강조하세요.',
          isDefault: false,
        },
        {
          name: 'DevOps/SRE',
          description: 'DevOps 및 사이트 신뢰성 엔지니어',
          category: 'developer',
          prompt: 'DevOps/SRE 이력서로 변환해주세요. 인프라 자동화, CI/CD, 모니터링 경험을 강조하세요.',
          isDefault: false,
        },
        {
          name: 'UX 리서처',
          description: 'UX 리서처 및 사용성 전문가',
          category: 'designer',
          prompt: 'UX 리서치 전문가 이력서로 변환해주세요. 사용자 리서치, A/B 테스트, 인사이트 도출 경험을 강조하세요.',
          isDefault: false,
        },
        {
          name: '스타트업 창업자',
          description: '스타트업 경험 강조',
          category: 'general',
          prompt: '스타트업 창업/공동창업 경험을 강조하는 이력서로 변환해주세요. 사업 성과, 팀 빌딩, 자금 조달 경험을 포함하세요.',
          isDefault: false,
        },
      ],
    });
    console.log('✓ 기본 템플릿 10개 생성 완료');
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

  // Seed sample users for resume ownership
  const sampleUserEmails = [
    { email: 'minsu.kim@example.com', name: '김민수', provider: 'local', providerId: 'minsu.kim@example.com' },
    { email: 'seoyeon@example.com', name: '이서연', provider: 'local', providerId: 'seoyeon@example.com' },
    { email: 'jihyun.park@example.com', name: '박지현', provider: 'local', providerId: 'jihyun.park@example.com' },
    { email: 'youngho@example.com', name: '최영호', provider: 'local', providerId: 'youngho@example.com' },
    { email: 'sumin.jung@example.com', name: '정수민', provider: 'local', providerId: 'sumin.jung@example.com' },
  ];
  const sampleUsers: { id: string }[] = [];
  for (const u of sampleUserEmails) {
    let user = await prisma.user.findFirst({ where: { email: u.email } });
    if (!user) user = await prisma.user.create({ data: u });
    sampleUsers.push({ id: user.id });
  }
  console.log(`  ✓ 샘플 사용자 ${sampleUsers.length}명 확인/생성`);

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
      {
        title: '디자이너 포트폴리오',
        slug: 'designer-portfolio',
        visibility: 'public',
        personalInfo: {
          create: {
            name: '박지현',
            email: 'jihyun.park@example.com',
            phone: '010-5555-7777',
            address: '서울시 마포구',
            website: 'https://jihyun.design',
            github: '',
            summary: '<p>8년차 UI/UX 디자이너입니다. 사용자 리서치부터 프로토타이핑, 디자인 시스템까지 풀사이클 디자인 경험을 보유하고 있습니다.</p>',
            photo: '',
            birthYear: '1992',
            links: '[]',
            military: '',
          },
        },
        experiences: {
          create: [
            { company: '토스', position: 'Product Designer', department: '디자인팀', startDate: '2021-03', endDate: '', current: true, description: '<p>토스 앱 핵심 화면 UI/UX 설계</p>', achievements: '<ul><li>디자인 시스템 구축 (100+ 컴포넌트)</li><li>사용자 전환율 25% 향상</li></ul>', techStack: 'Figma, Framer, Principle', sortOrder: 0 },
            { company: '네이버', position: 'UX Designer', department: '', startDate: '2018-01', endDate: '2021-02', current: false, description: '<p>네이버 쇼핑 UX 개선</p>', achievements: '', techStack: 'Sketch, InVision, Zeplin', sortOrder: 1 },
          ],
        },
        educations: {
          create: [
            { school: '홍익대학교', degree: '학사', field: '시각디자인', gpa: '', startDate: '2010-03', endDate: '2014-02', description: '', sortOrder: 0 },
          ],
        },
        skills: {
          create: [
            { category: 'Design', items: 'Figma, Sketch, Adobe XD, Photoshop, Illustrator', sortOrder: 0 },
            { category: 'Prototyping', items: 'Framer, Principle, ProtoPie', sortOrder: 1 },
            { category: 'Research', items: 'User Interview, Usability Testing, A/B Testing', sortOrder: 2 },
          ],
        },
        projects: { create: [] },
        certifications: { create: [] },
        languages: {
          create: [
            { name: '영어', testName: 'OPIC', score: 'IH', testDate: '2023-03', sortOrder: 0 },
          ],
        },
        awards: {
          create: [
            { name: 'iF Design Award', issuer: 'iF International Forum Design', awardDate: '2023-04', description: '토스 앱 리디자인', sortOrder: 0 },
          ],
        },
        activities: { create: [] },
      },
      {
        title: '데이터 사이언티스트 이력서',
        slug: 'data-scientist',
        visibility: 'public',
        personalInfo: {
          create: {
            name: '최영호',
            email: 'youngho@example.com',
            phone: '010-3333-4444',
            address: '서울시 역삼동',
            website: '',
            github: 'https://github.com/youngho-choi',
            summary: '<p>ML/DL 기반 데이터 분석 및 모델링 전문가. 추천 시스템과 NLP 분야에서 프로덕션 경험을 보유하고 있습니다.</p>',
            photo: '',
            birthYear: '1994',
            links: '[]',
            military: '육군 병장 만기전역',
          },
        },
        experiences: {
          create: [
            { company: '쿠팡', position: 'ML Engineer', department: '추천팀', startDate: '2022-01', endDate: '', current: true, description: '<p>상품 추천 알고리즘 개발 및 운영</p>', achievements: '<ul><li>추천 CTR 18% 향상</li><li>실시간 추론 파이프라인 구축</li></ul>', techStack: 'Python, TensorFlow, Spark, Airflow', sortOrder: 0 },
          ],
        },
        educations: {
          create: [
            { school: '서울대학교', degree: '석사', field: '데이터사이언스', gpa: '4.2/4.3', startDate: '2018-03', endDate: '2020-02', description: '추천 시스템 연구', sortOrder: 0 },
            { school: '연세대학교', degree: '학사', field: '통계학', gpa: '3.9/4.3', startDate: '2014-03', endDate: '2018-02', description: '', sortOrder: 1 },
          ],
        },
        skills: {
          create: [
            { category: 'ML/DL', items: 'TensorFlow, PyTorch, scikit-learn, XGBoost', sortOrder: 0 },
            { category: 'Data', items: 'Python, SQL, Spark, Pandas, NumPy', sortOrder: 1 },
            { category: 'Infra', items: 'AWS SageMaker, Kubernetes, MLflow, Airflow', sortOrder: 2 },
          ],
        },
        projects: { create: [] },
        certifications: { create: [] },
        languages: { create: [] },
        awards: { create: [] },
        activities: { create: [] },
      },
      {
        title: 'PM/기획자 이력서',
        slug: 'product-manager',
        visibility: 'public',
        personalInfo: {
          create: {
            name: '정수민',
            email: 'sumin.jung@example.com',
            phone: '010-8888-9999',
            address: '서울시 강남구',
            website: 'https://sumin.notion.site',
            github: '',
            summary: '<p>B2B SaaS 제품 기획 5년차. 데이터 기반 의사결정과 애자일 방법론에 능숙합니다. 사용자 문제를 정의하고 해결하는 것을 좋아합니다.</p>',
            photo: '',
            birthYear: '1996',
            links: '[]',
            military: '',
          },
        },
        experiences: {
          create: [
            { company: '당근마켓', position: 'Product Manager', department: '광고사업팀', startDate: '2022-06', endDate: '', current: true, description: '<p>당근 비즈니스 광고 상품 기획</p>', achievements: '<ul><li>광고 매출 2배 성장 기여</li><li>셀프서브 광고 시스템 기획 및 런칭</li></ul>', techStack: 'Jira, Confluence, Amplitude, SQL', sortOrder: 0 },
            { company: '리디', position: 'Product Owner', department: '', startDate: '2020-01', endDate: '2022-05', current: false, description: '<p>전자책 구독 서비스 기획</p>', achievements: '', techStack: 'Figma, Google Analytics, Mixpanel', sortOrder: 1 },
          ],
        },
        educations: {
          create: [
            { school: '성균관대학교', degree: '학사', field: '경영학', gpa: '3.7/4.5', startDate: '2014-03', endDate: '2018-02', description: '', sortOrder: 0 },
          ],
        },
        skills: {
          create: [
            { category: '기획', items: 'PRD 작성, 와이어프레임, 사용자 스토리, A/B 테스트', sortOrder: 0 },
            { category: '도구', items: 'Jira, Confluence, Figma, Amplitude, SQL', sortOrder: 1 },
            { category: '방법론', items: 'Agile/Scrum, Design Thinking, OKR', sortOrder: 2 },
          ],
        },
        projects: { create: [] },
        certifications: {
          create: [
            { name: 'CSPO (Certified Scrum Product Owner)', issuer: 'Scrum Alliance', issueDate: '2021-08', expiryDate: '', credentialId: '', description: '', sortOrder: 0 },
          ],
        },
        languages: {
          create: [
            { name: '영어', testName: 'TOEIC Speaking', score: 'Lv.7', testDate: '2022-05', sortOrder: 0 },
          ],
        },
        awards: { create: [] },
        activities: { create: [] },
      },
    ];

    for (let i = 0; i < sampleResumes.length; i++) {
      const owner = sampleUsers[i % sampleUsers.length];
      await prisma.resume.create({ data: { ...sampleResumes[i], userId: owner.id } });
    }
    console.log(`  ✓ 샘플 이력서 ${sampleResumes.length}개 생성 (${sampleUsers.length}명에게 분산)`);
  }

  // Seed sample comments on public resumes
  const commentCount = await prisma.comment.count();
  if (commentCount === 0) {
    const publicResumes = await prisma.resume.findMany({
      where: { visibility: 'public' },
      take: 3,
      select: { id: true },
    });

    const sampleComments = [
      { authorName: '취준생A', content: '이력서 구성이 정말 깔끔하네요! 경력 섹션에서 성과를 수치로 표현한 부분이 인상적입니다.' },
      { authorName: '현직 HR', content: 'ATS 호환성이 좋아 보입니다. 기술 스택을 카테고리별로 분류한 것이 가독성을 높여주네요.' },
      { authorName: '시니어 개발자', content: '프로젝트 설명에 본인의 역할과 기여도를 더 구체적으로 적으면 좋을 것 같습니다. 예를 들어 "팀 내 프론트엔드 리드로서..." 같은 표현이요.' },
      { authorName: '디자이너', content: '전체적인 레이아웃이 깔끔합니다. 섹션 간 여백이 적절하고 읽기 편해요.' },
      { authorName: '커리어 코치', content: '자기소개를 좀 더 보강하면 좋겠습니다. 핵심 역량 3가지와 차별화 포인트를 명확히 해보세요.' },
      { authorName: '같은 직군', content: '저도 비슷한 경력인데 참고가 많이 됩니다. 기술 스택 정리 방식을 벤치마킹하겠습니다!' },
    ];

    for (const resume of publicResumes) {
      const commentsToAdd = sampleComments.slice(0, Math.min(3 + publicResumes.indexOf(resume), sampleComments.length));
      for (const comment of commentsToAdd) {
        await prisma.comment.create({
          data: { resumeId: resume.id, ...comment },
        });
      }
    }
    console.log(`  ✓ 샘플 댓글 ${publicResumes.length * 3}개+ 생성`);
  }

  // Seed sample application comments on public applications
  const appCommentCount = await prisma.applicationComment.count();
  if (appCommentCount === 0) {
    const publicApps = await prisma.jobApplication.findMany({
      where: { visibility: 'public' },
      take: 3,
      select: { id: true, company: true },
    });

    const appComments = [
      { authorName: '선배 개발자', content: '이 회사 면접에서는 시스템 설계 질문이 많이 나와요. 준비하시면 도움이 될 겁니다!' },
      { authorName: '현직자', content: '좋은 회사입니다. 팀 문화가 좋고 성장할 수 있는 환경이에요.' },
      { authorName: '취준 동기', content: '저도 여기 지원했어요! 서류 통과하셨으면 좋겠습니다.' },
      { authorName: '커리어 코치', content: '이 포지션이라면 포트폴리오에 관련 프로젝트를 강조하세요.' },
    ];

    for (const app of publicApps) {
      for (const comment of appComments.slice(0, 2)) {
        await prisma.applicationComment.create({
          data: { applicationId: app.id, ...comment },
        });
      }
    }
    if (publicApps.length > 0) {
      console.log(`  ✓ 샘플 지원 댓글 ${publicApps.length * 2}개 생성`);
    }
  }

  // Seed sample notifications
  const notifCount = await prisma.notification.count();
  if (notifCount === 0) {
    const users = await prisma.user.findMany({ take: 2, select: { id: true } });
    if (users.length > 0) {
      const sampleNotifs = [
        { type: 'comment', message: '취준생A님이 이력서에 의견을 남겼습니다: "이력서 구성이 깔끔하네요!"', link: '/explore' },
        { type: 'comment', message: '현직 HR님이 이력서에 조언을 남겼습니다: "ATS 호환성이 좋아 보입니다"', link: '/explore' },
        { type: 'bookmark', message: '누군가 당신의 이력서를 북마크했습니다', link: '/explore' },
        { type: 'application_comment', message: '선배 개발자님이 지원 내역에 조언을 남겼습니다', link: '/applications' },
      ];
      for (const notif of sampleNotifs) {
        await prisma.notification.create({
          data: { userId: users[0].id, ...notif },
        });
      }
      console.log(`  ✓ 샘플 알림 ${sampleNotifs.length}개 생성`);
    }
  }

  // Seed sample bookmarks
  const bookmarkCount = await prisma.bookmark.count();
  if (bookmarkCount === 0) {
    const users = await prisma.user.findMany({ take: 1, select: { id: true } });
    const publicResumes = await prisma.resume.findMany({
      where: { visibility: 'public' },
      take: 3,
      select: { id: true },
    });
    if (users.length > 0 && publicResumes.length > 0) {
      for (const resume of publicResumes) {
        try {
          await prisma.bookmark.create({
            data: { userId: users[0].id, resumeId: resume.id },
          });
        } catch {} // unique constraint
      }
      console.log(`  ✓ 샘플 북마크 ${publicResumes.length}개 생성`);
    }
  }

  // Seed sample job posts
  const jobCount = await prisma.jobPost.count();
  if (jobCount === 0) {
    // Find or create a recruiter user
    let recruiter = await prisma.user.findFirst({ where: { userType: 'recruiter' } });
    if (!recruiter) {
      recruiter = await prisma.user.create({
        data: { email: 'recruiter@example.com', name: '김채용', provider: 'local', providerId: 'recruiter@example.com', userType: 'recruiter', companyName: '이력서공방 HR' },
      });
    }

    const sampleJobs = [
      { company: '네이버', position: '프론트엔드 개발자', location: '성남시 분당구', salary: '5,000~8,000만원', type: 'fulltime', skills: 'React, TypeScript, Next.js, GraphQL', description: '네이버 메인 서비스의 프론트엔드를 개발합니다.\n\n주요 업무:\n- 대규모 트래픽 웹 서비스 개발\n- 디자인 시스템 구축 및 운영\n- 성능 최적화 및 접근성 개선', requirements: '필수:\n- React/TypeScript 3년 이상\n- 대규모 서비스 경험\n\n우대:\n- Next.js, GraphQL 경험\n- 오픈소스 기여', benefits: '- 유연근무제\n- 교육비 지원\n- 건강검진\n- 스톡옵션' },
      { company: '카카오', position: 'React 개발자', location: '성남시 판교', salary: '4,500~7,000만원', type: 'fulltime', skills: 'React, JavaScript, CSS, Redux', description: '카카오톡 웹 클라이언트를 개발합니다.', requirements: 'React 2년 이상', benefits: '자유로운 근무 환경' },
      { company: '토스', position: '웹 프론트엔드', location: '서울시 강남구', salary: '6,000~9,000만원', type: 'fulltime', skills: 'React, TypeScript, Recoil, Emotion', description: '금융 서비스의 웹 프론트엔드를 개발합니다.\n결제, 송금, 투자 등 핵심 서비스 담당.', requirements: 'TypeScript 필수, 금융 서비스 경험 우대', benefits: '스톡옵션, 교육비, 자기계발비' },
      { company: '쿠팡', position: 'Software Engineer', location: '서울시 송파구', salary: '5,500~10,000만원', type: 'fulltime', skills: 'Java, Spring, React, AWS', description: '이커머스 플랫폼 개발', requirements: 'CS 기초, 3년 이상 경력', benefits: '로켓배송 할인' },
      { company: '당근마켓', position: 'Frontend Developer (인턴)', location: '서울시 서초구', salary: '월 250만원', type: 'intern', skills: 'React, TypeScript', description: '당근마켓 웹 서비스 개발 인턴\n3개월, 정규직 전환 가능', requirements: 'React 기초, CS 전공', benefits: '멘토링, 장비 지원' },
      { company: '배달의민족', position: 'UI Developer', location: '서울시 송파구', salary: '5,000~7,500만원', type: 'fulltime', skills: 'React, Vue.js, TypeScript, Storybook', description: '배민 디자인 시스템 구축', requirements: 'UI 컴포넌트 개발 경험', benefits: '배민 쿠폰, 유연근무' },
    ];

    for (const job of sampleJobs) {
      await prisma.jobPost.create({ data: { ...job, userId: recruiter.id } });
    }
    console.log(`  ✓ 샘플 채용 공고 ${sampleJobs.length}개 생성`);
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
