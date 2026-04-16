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

  // ── External Job Links ─────────────────────────────────────────────
  const extLinkCount = await prisma.externalJobLink.count();
  if (extLinkCount === 0) {
    const externalLinks = [
      // ═══════════════════════════════════════════════════════
      //  공기업 / 공공기관
      // ═══════════════════════════════════════════════════════
      { name: '나라일터 (공무원 채용 공식)', url: 'https://www.gojobs.go.kr/index.do', logoEmoji: '🇰🇷', badgeText: '공무원 공식', description: '대한민국 공무원 공개채용 공식 포털', gradientFrom: '#1d4ed8', gradientTo: '#1e40af', category: 'public', companySize: 'government', jobTypes: 'fulltime', careerLevel: 'all', location: 'nationwide', jobCategory: 'all', order: 1 },
      { name: '알리오 (공공기관 채용)', url: 'https://www.alio.go.kr/recruit/recruitList.do', logoEmoji: '📋', badgeText: '공공기관 공식', description: '공공기관 경영정보시스템 채용공고', gradientFrom: '#7c3aed', gradientTo: '#6d28d9', category: 'public', companySize: 'public', jobTypes: 'fulltime,contract', careerLevel: 'all', location: 'nationwide', jobCategory: 'all', order: 2 },
      { name: '사람인 공기업 채용', url: 'https://www.saramin.co.kr/zf_user/jobs/list/job-category?cat_kewd=182', logoEmoji: '🏛️', badgeText: '공기업 모음', description: '공기업·공공기관 전문 채용정보 모음', gradientFrom: '#0284c7', gradientTo: '#0369a1', category: 'public', companySize: 'public', jobTypes: 'fulltime,contract', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 3 },
      { name: '잡코리아 공기업', url: 'https://www.jobkorea.co.kr/Search/?stext=%EA%B3%B5%EA%B8%B0%EC%97%85&tabType=recruit', logoEmoji: '🔷', badgeText: '공기업', description: '국내 최대 공기업 채용공고 검색', gradientFrom: '#0891b2', gradientTo: '#0e7490', category: 'public', companySize: 'public', jobTypes: 'fulltime', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 4 },
      { name: '한국전력공사(KEPCO) 채용', url: 'https://kepco.recruiter.co.kr/appsite/company/index', logoEmoji: '⚡', badgeText: '공기업 대표', description: '한전 신입·경력 채용공고 지원', gradientFrom: '#b45309', gradientTo: '#92400e', category: 'public', companySize: 'public', jobTypes: 'fulltime', careerLevel: 'all', location: 'nationwide', jobCategory: 'all', order: 5 },
      { name: 'LH 한국토지주택공사', url: 'https://apply.lh.or.kr/', logoEmoji: '🏠', badgeText: '공기업', description: 'LH 신입·경력 채용 지원', gradientFrom: '#0f766e', gradientTo: '#115e59', category: 'public', companySize: 'public', jobTypes: 'fulltime', careerLevel: 'all', location: 'nationwide', jobCategory: 'all', order: 6 },
      { name: '한국철도공사(코레일) 채용', url: 'https://korail.recruiter.co.kr/appsite/company/index', logoEmoji: '🚂', badgeText: '공기업', description: '코레일 신입·경력 채용공고', gradientFrom: '#be123c', gradientTo: '#9f1239', category: 'public', companySize: 'public', jobTypes: 'fulltime', careerLevel: 'all', location: 'nationwide', jobCategory: 'all', order: 7 },
      { name: '한국도로공사 채용', url: 'https://www.ex.co.kr/site/excopay/sub.do?menukey=2671', logoEmoji: '🛣️', badgeText: '공기업', description: '한국도로공사 채용정보', gradientFrom: '#166534', gradientTo: '#15803d', category: 'public', companySize: 'public', jobTypes: 'fulltime', careerLevel: 'all', location: 'nationwide', jobCategory: 'all', order: 8 },
      { name: '한국수자원공사(K-water)', url: 'https://www.kwater.or.kr/eng/info/kwater/subPage.do?s_mid=1375', logoEmoji: '💧', badgeText: '공기업', description: '수자원공사 채용정보', gradientFrom: '#0369a1', gradientTo: '#0284c7', category: 'public', companySize: 'public', jobTypes: 'fulltime', careerLevel: 'all', location: 'nationwide', jobCategory: 'all', order: 9 },
      { name: '한국가스공사(KOGAS)', url: 'https://www.kogas.or.kr/portal/contents.do?key=1500', logoEmoji: '🔥', badgeText: '공기업', description: '한국가스공사 채용공고', gradientFrom: '#ea580c', gradientTo: '#c2410c', category: 'public', companySize: 'public', jobTypes: 'fulltime', careerLevel: 'all', location: 'nationwide', jobCategory: 'all', order: 10 },
      { name: '국민건강보험공단', url: 'https://www.nhis.or.kr/nhis/recruit/retrieveRecruitNoticeList.do', logoEmoji: '🏥', badgeText: '공공기관', description: '건강보험공단 채용공고', gradientFrom: '#0891b2', gradientTo: '#155e75', category: 'public', companySize: 'public', jobTypes: 'fulltime,contract', careerLevel: 'all', location: 'nationwide', jobCategory: 'all', order: 11 },
      { name: '근로복지공단 채용', url: 'https://www.comwel.or.kr/comwel/brea/ann/ann02/index.jsp', logoEmoji: '🤝', badgeText: '공공기관', description: '근로복지공단 채용공고', gradientFrom: '#4f46e5', gradientTo: '#4338ca', category: 'public', companySize: 'public', jobTypes: 'fulltime,contract', careerLevel: 'all', location: 'nationwide', jobCategory: 'all', order: 12 },
      { name: '국방부 군무원 채용', url: 'https://recruit.mnd.go.kr/', logoEmoji: '🎖️', badgeText: '군무원', description: '군무원 공개경쟁·경력경쟁 채용공고', gradientFrom: '#374151', gradientTo: '#1f2937', category: 'public', companySize: 'government', jobTypes: 'fulltime', careerLevel: 'all', location: 'nationwide', jobCategory: 'all', order: 13 },
      { name: '교육청 교원 채용', url: 'https://www.neis.go.kr/', logoEmoji: '📚', badgeText: '교원 임용', description: '전국 교육청 교원 임용시험 정보', gradientFrom: '#d97706', gradientTo: '#b45309', category: 'public', companySize: 'government', jobTypes: 'fulltime', careerLevel: 'all', location: 'nationwide', jobCategory: 'education', order: 14 },

      // ═══════════════════════════════════════════════════════
      //  대기업 / 재벌 그룹
      // ═══════════════════════════════════════════════════════
      { name: '삼성 채용 (삼성커리어스)', url: 'https://www.samsung.com/sec/aboutsamsung/careers/', logoEmoji: '💎', badgeText: '대기업 1위', description: '삼성전자·삼성 계열사 공채·수시채용', gradientFrom: '#1e40af', gradientTo: '#1d4ed8', category: 'conglomerate', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 20 },
      { name: 'LG 채용', url: 'https://careers.lg.com/main', logoEmoji: '🔴', badgeText: '대기업', description: 'LG전자·LG화학·LG유플러스 채용', gradientFrom: '#b91c1c', gradientTo: '#991b1b', category: 'conglomerate', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 21 },
      { name: 'SK 채용', url: 'https://careers.sk.com/', logoEmoji: '🟠', badgeText: '대기업', description: 'SK하이닉스·SK텔레콤·SK이노베이션 채용', gradientFrom: '#c2410c', gradientTo: '#9a3412', category: 'conglomerate', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 22 },
      { name: '현대자동차그룹 채용', url: 'https://recruit.hyundai.com/hmc/kor/recruit/Main.do', logoEmoji: '🚗', badgeText: '대기업', description: '현대차·기아·현대모비스 채용', gradientFrom: '#1e3a8a', gradientTo: '#1e40af', category: 'conglomerate', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 23 },
      { name: '롯데 채용', url: 'https://www.lotterecruitment.com/', logoEmoji: '🏢', badgeText: '대기업', description: '롯데그룹 계열사 통합 채용포털', gradientFrom: '#be123c', gradientTo: '#9f1239', category: 'conglomerate', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 24 },
      { name: '포스코 채용', url: 'https://career.posco.com/', logoEmoji: '⚙️', badgeText: '대기업', description: '포스코·포스코인터내셔널 채용', gradientFrom: '#374151', gradientTo: '#1f2937', category: 'conglomerate', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'all', jobCategory: 'manufacturing', order: 25 },
      { name: 'GS그룹 채용', url: 'https://gsrecruit.gsgroup.co.kr/', logoEmoji: '⛽', badgeText: '대기업', description: 'GS칼텍스·GS리테일·GS건설 채용', gradientFrom: '#059669', gradientTo: '#047857', category: 'conglomerate', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 26 },
      { name: '한화그룹 채용', url: 'https://www.hanwhacareers.com/', logoEmoji: '🔶', badgeText: '대기업', description: '한화에어로스페이스·한화생명 채용', gradientFrom: '#ea580c', gradientTo: '#c2410c', category: 'conglomerate', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 27 },
      { name: 'HD현대 채용', url: 'https://recruit.hd-hyundai.com/', logoEmoji: '⚓', badgeText: '대기업', description: 'HD현대중공업·HD현대오일뱅크 채용', gradientFrom: '#0369a1', gradientTo: '#0284c7', category: 'conglomerate', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'all', jobCategory: 'manufacturing', order: 28 },
      { name: '두산그룹 채용', url: 'https://careers.doosan.com/', logoEmoji: '🔵', badgeText: '대기업', description: '두산에너빌리티·두산밥캣 채용', gradientFrom: '#1d4ed8', gradientTo: '#1e40af', category: 'conglomerate', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 29 },
      { name: 'CJ그룹 채용', url: 'https://cjrecruit.career.co.kr/recruit/index.asp', logoEmoji: '🎬', badgeText: '대기업', description: 'CJ ENM·CJ대한통운·CJ제일제당 채용', gradientFrom: '#7c3aed', gradientTo: '#6d28d9', category: 'conglomerate', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 30 },
      { name: '신세계그룹 채용', url: 'https://www.ssgrecruit.com/', logoEmoji: '🛍️', badgeText: '대기업', description: '이마트·SSG닷컴·신세계 채용', gradientFrom: '#0f766e', gradientTo: '#115e59', category: 'conglomerate', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 31 },
      { name: 'KT그룹 채용', url: 'https://recruit.kt.com/', logoEmoji: '📡', badgeText: '대기업·통신', description: 'KT·KT클라우드 채용', gradientFrom: '#dc2626', gradientTo: '#b91c1c', category: 'conglomerate', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'all', jobCategory: 'it', order: 32 },

      // ═══════════════════════════════════════════════════════
      //  IT / 빅테크 / 스타트업 플랫폼
      // ═══════════════════════════════════════════════════════
      { name: 'Wanted (IT 개발자)', url: 'https://www.wanted.co.kr/jobs?job_sort=job.latest_order&years=-1&locations=all&category=518', logoEmoji: '🌐', badgeText: 'IT 인기 1위', description: '스타트업·IT 개발자 채용 최다 플랫폼', gradientFrom: '#3b82f6', gradientTo: '#2563eb', category: 'it', companySize: 'startup', jobTypes: 'fulltime,contract', careerLevel: 'all', location: 'all', jobCategory: 'it', order: 40 },
      { name: '점핏 (개발자 전문)', url: 'https://www.jumpit.co.kr/positions', logoEmoji: '🚀', badgeText: 'IT 전문', description: '개발자·IT 직군 전문 채용 플랫폼', gradientFrom: '#7c3aed', gradientTo: '#6d28d9', category: 'it', companySize: 'all', jobTypes: 'fulltime,contract', careerLevel: 'all', location: 'all', jobCategory: 'it', order: 41 },
      { name: '네이버 채용', url: 'https://recruit.navercorp.com/rcrt/list.do', logoEmoji: '🟢', badgeText: '빅테크', description: '네이버·LINE 개발자·기획·디자인 채용', gradientFrom: '#16a34a', gradientTo: '#15803d', category: 'it', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'seoul', jobCategory: 'it', order: 42 },
      { name: '카카오 채용', url: 'https://careers.kakao.com/index', logoEmoji: '🟡', badgeText: '빅테크', description: '카카오·카카오뱅크·카카오페이 채용', gradientFrom: '#ca8a04', gradientTo: '#b45309', category: 'it', companySize: 'conglomerate', jobTypes: 'fulltime,intern', careerLevel: 'all', location: 'seoul', jobCategory: 'it', order: 43 },
      { name: '쿠팡 채용', url: 'https://www.coupang.jobs/', logoEmoji: '📦', badgeText: '대형 스타트업', description: '쿠팡 테크·물류·경영 채용', gradientFrom: '#dc2626', gradientTo: '#b91c1c', category: 'it', companySize: 'startup', jobTypes: 'fulltime', careerLevel: 'mid', location: 'seoul', jobCategory: 'it', order: 44 },
      { name: '배달의민족(우아한형제들)', url: 'https://career.woowahan.com/', logoEmoji: '🍕', badgeText: '유니콘', description: '배민 테크·기획·마케팅 채용', gradientFrom: '#2563eb', gradientTo: '#1d4ed8', category: 'it', companySize: 'startup', jobTypes: 'fulltime', careerLevel: 'all', location: 'seoul', jobCategory: 'it', order: 45 },
      { name: '토스(Viva Republica)', url: 'https://toss.im/career', logoEmoji: '💙', badgeText: '핀테크 유니콘', description: '토스·토스뱅크·토스증권 채용', gradientFrom: '#3b82f6', gradientTo: '#1d4ed8', category: 'it', companySize: 'startup', jobTypes: 'fulltime', careerLevel: 'all', location: 'seoul', jobCategory: 'it', order: 46 },
      { name: '당근마켓 채용', url: 'https://about.daangn.com/jobs/', logoEmoji: '🥕', badgeText: '유니콘', description: '당근마켓 개발·디자인·운영 채용', gradientFrom: '#ea580c', gradientTo: '#c2410c', category: 'it', companySize: 'startup', jobTypes: 'fulltime', careerLevel: 'all', location: 'seoul', jobCategory: 'it', order: 47 },
      { name: '로켓펀치 (스타트업)', url: 'https://www.rocketpunch.com/jobs', logoEmoji: '🔴', badgeText: '스타트업', description: '초기 스타트업 채용 전문 플랫폼', gradientFrom: '#dc2626', gradientTo: '#b91c1c', category: 'it', companySize: 'small', jobTypes: 'fulltime,contract', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 48 },
      { name: 'Programmers 채용', url: 'https://career.programmers.co.kr/job_positions', logoEmoji: '💻', badgeText: 'IT 개발자', description: '프로그래머스 코딩테스트 기반 개발자 채용', gradientFrom: '#4f46e5', gradientTo: '#4338ca', category: 'it', companySize: 'all', jobTypes: 'fulltime,contract', careerLevel: 'all', location: 'all', jobCategory: 'it', order: 49 },

      // ═══════════════════════════════════════════════════════
      //  종합 채용 포털
      // ═══════════════════════════════════════════════════════
      { name: '잡코리아 (전체)', url: 'https://www.jobkorea.co.kr/', logoEmoji: '🔷', badgeText: '국내 최대', description: '전 직종·전 기업규모 국내 최대 채용포털', gradientFrom: '#0284c7', gradientTo: '#0369a1', category: 'general', companySize: 'all', jobTypes: 'all', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 50 },
      { name: '사람인 (전체)', url: 'https://www.saramin.co.kr/', logoEmoji: '🟠', badgeText: '대기업·중소기업', description: '이력서 자동연동 국내 2위 채용포털', gradientFrom: '#ea580c', gradientTo: '#c2410c', category: 'general', companySize: 'all', jobTypes: 'all', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 51 },
      { name: '인크루트', url: 'https://job.incruit.com/', logoEmoji: '🟢', badgeText: '경력 중심', description: '경력직 채용 특화 포털', gradientFrom: '#059669', gradientTo: '#047857', category: 'general', companySize: 'all', jobTypes: 'all', careerLevel: 'mid', location: 'all', jobCategory: 'all', order: 52 },
      { name: '잡플래닛 채용', url: 'https://www.jobplanet.co.kr/job-postings', logoEmoji: '🌍', badgeText: '기업리뷰+채용', description: '기업 리뷰 기반 채용공고 플랫폼', gradientFrom: '#0891b2', gradientTo: '#0e7490', category: 'general', companySize: 'all', jobTypes: 'all', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 53 },
      { name: '커리어넷', url: 'https://www.career.go.kr/', logoEmoji: '📖', badgeText: '정부 운영', description: '한국직업능력연구원 운영 취업정보', gradientFrom: '#1d4ed8', gradientTo: '#1e40af', category: 'general', companySize: 'all', jobTypes: 'all', careerLevel: 'junior', location: 'all', jobCategory: 'all', order: 54 },
      { name: '고용24 (워크넷)', url: 'https://www.work24.go.kr/cm/main.do', logoEmoji: '🏛', badgeText: '고용부 공식', description: '고용노동부 운영 공식 구인구직 포털', gradientFrom: '#166534', gradientTo: '#15803d', category: 'general', companySize: 'all', jobTypes: 'all', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 55 },

      // ═══════════════════════════════════════════════════════
      //  글로벌 / 외국계
      // ═══════════════════════════════════════════════════════
      { name: 'LinkedIn 한국 채용', url: 'https://www.linkedin.com/jobs/search/?location=Korea%2C+South', logoEmoji: '💼', badgeText: '글로벌 1위', description: '외국계·글로벌 기업 채용 최다', gradientFrom: '#0077b5', gradientTo: '#005885', category: 'global', companySize: 'all', jobTypes: 'all', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 60 },
      { name: 'Indeed 한국', url: 'https://kr.indeed.com/', logoEmoji: '🌏', badgeText: '글로벌', description: '세계 최대 구인구직 사이트 한국판', gradientFrom: '#2563eb', gradientTo: '#1d4ed8', category: 'global', companySize: 'all', jobTypes: 'all', careerLevel: 'all', location: 'all', jobCategory: 'all', order: 61 },
      { name: 'Glassdoor 한국', url: 'https://www.glassdoor.com/Job/korea-jobs-SRCH_IL.0,5_IN125.htm', logoEmoji: '🔮', badgeText: '리뷰+채용', description: '기업 리뷰·연봉 정보 + 글로벌 채용', gradientFrom: '#0f766e', gradientTo: '#115e59', category: 'global', companySize: 'all', jobTypes: 'all', careerLevel: 'mid', location: 'all', jobCategory: 'all', order: 62 },

      // ═══════════════════════════════════════════════════════
      //  신입 / 인턴 / 아르바이트 특화
      // ═══════════════════════════════════════════════════════
      { name: '잡코리아 신입 채용', url: 'https://www.jobkorea.co.kr/Search/?stext=신입&tabType=recruit', logoEmoji: '🌱', badgeText: '신입 전문', description: '신입 구직자 특화 채용공고 모음', gradientFrom: '#059669', gradientTo: '#047857', category: 'junior', companySize: 'all', jobTypes: 'fulltime,intern', careerLevel: 'junior', location: 'all', jobCategory: 'all', order: 70 },
      { name: '사람인 인턴 채용', url: 'https://www.saramin.co.kr/zf_user/jobs/list/job-category?cat_kewd=2231', logoEmoji: '📘', badgeText: '인턴 전문', description: '대기업·공기업 인턴 채용정보', gradientFrom: '#2563eb', gradientTo: '#1d4ed8', category: 'junior', companySize: 'all', jobTypes: 'intern', careerLevel: 'junior', location: 'all', jobCategory: 'all', order: 71 },
      { name: '알바천국', url: 'https://www.alba.co.kr/', logoEmoji: '💪', badgeText: '아르바이트', description: '단기·시간제 아르바이트 채용 1위', gradientFrom: '#f97316', gradientTo: '#ea580c', category: 'junior', companySize: 'small', jobTypes: 'parttime', careerLevel: 'junior', location: 'all', jobCategory: 'service', order: 72 },
      { name: '알바몬', url: 'https://www.albamon.com/', logoEmoji: '🍀', badgeText: '아르바이트', description: '알바 구직 전문 플랫폼', gradientFrom: '#16a34a', gradientTo: '#15803d', category: 'junior', companySize: 'small', jobTypes: 'parttime', careerLevel: 'junior', location: 'all', jobCategory: 'service', order: 73 },

      // ═══════════════════════════════════════════════════════
      //  직종별 전문 플랫폼
      // ═══════════════════════════════════════════════════════
      { name: '의료인 채용 (메디잡)', url: 'https://www.medijob.co.kr/', logoEmoji: '🏥', badgeText: '의료 전문', description: '의사·간호사·의료기사 채용 전문', gradientFrom: '#0891b2', gradientTo: '#0e7490', category: 'specialized', companySize: 'all', jobTypes: 'fulltime,contract', careerLevel: 'all', location: 'all', jobCategory: 'medical', order: 80 },
      { name: '교육직 채용 (에듀잡)', url: 'https://www.edujob.co.kr/', logoEmoji: '📚', badgeText: '교육 전문', description: '교사·강사·학원 채용 전문 플랫폼', gradientFrom: '#d97706', gradientTo: '#b45309', category: 'specialized', companySize: 'all', jobTypes: 'fulltime,parttime,contract', careerLevel: 'all', location: 'all', jobCategory: 'education', order: 81 },
      { name: '법무직 채용 (로앤잡)', url: 'https://www.lawnb.com/Info/JobList', logoEmoji: '⚖️', badgeText: '법조계', description: '변호사·법무사·법원 채용공고', gradientFrom: '#374151', gradientTo: '#1f2937', category: 'specialized', companySize: 'all', jobTypes: 'fulltime,contract', careerLevel: 'all', location: 'all', jobCategory: 'legal', order: 82 },
      { name: '건설/건축 채용 (건설워크넷)', url: 'https://www.work.go.kr/jobseek/occupationJobInfo/selectOccupationJobInfoList.do?occupationId=3', logoEmoji: '🏗️', badgeText: '건설 전문', description: '건설·건축·토목 채용공고', gradientFrom: '#92400e', gradientTo: '#b45309', category: 'specialized', companySize: 'all', jobTypes: 'fulltime,contract', careerLevel: 'all', location: 'all', jobCategory: 'manufacturing', order: 83 },
      { name: '금융권 채용 (은행·증권)', url: 'https://www.jobkorea.co.kr/Search/?stext=%EA%B8%88%EC%9C%B5&tabType=recruit', logoEmoji: '💰', badgeText: '금융 전문', description: '은행·증권·보험 금융권 채용공고', gradientFrom: '#1d4ed8', gradientTo: '#1e40af', category: 'specialized', companySize: 'all', jobTypes: 'fulltime', careerLevel: 'all', location: 'all', jobCategory: 'finance', order: 84 },
      { name: '마케팅·광고 채용 (Wanted)', url: 'https://www.wanted.co.kr/jobs?job_sort=job.latest_order&years=-1&locations=all&category=507', logoEmoji: '📢', badgeText: '마케팅', description: '마케팅·광고·PR 전문 채용', gradientFrom: '#7c3aed', gradientTo: '#6d28d9', category: 'specialized', companySize: 'all', jobTypes: 'fulltime,contract', careerLevel: 'all', location: 'all', jobCategory: 'marketing', order: 85 },
      { name: '디자인 채용 (디자인잡)', url: 'https://www.designerjob.co.kr/', logoEmoji: '🎨', badgeText: '디자인 전문', description: '그래픽·UI/UX·산업디자이너 채용', gradientFrom: '#ec4899', gradientTo: '#db2777', category: 'specialized', companySize: 'all', jobTypes: 'fulltime,contract,freelance', careerLevel: 'all', location: 'all', jobCategory: 'design', order: 86 },
      { name: '연구직 채용 (한국연구재단)', url: 'https://www.nrf.re.kr/biz/info/announce/list?menu_no=378', logoEmoji: '🔬', badgeText: '연구직', description: '대학·연구소 연구원 채용공고', gradientFrom: '#0f766e', gradientTo: '#115e59', category: 'specialized', companySize: 'all', jobTypes: 'fulltime,contract', careerLevel: 'mid', location: 'all', jobCategory: 'research', order: 87 },

      // ═══════════════════════════════════════════════════════
      //  지역별 특화
      // ═══════════════════════════════════════════════════════
      { name: '부산 채용 (부산일자리정보망)', url: 'https://www.busanjob.net/', logoEmoji: '🌊', badgeText: '부산 전문', description: '부산 지역 일자리 전문 플랫폼', gradientFrom: '#0369a1', gradientTo: '#0284c7', category: 'regional', companySize: 'all', jobTypes: 'all', careerLevel: 'all', location: 'busan', jobCategory: 'all', order: 90 },
      { name: '경기도 채용 (잡코리아 경기)', url: 'https://www.jobkorea.co.kr/Search/?stext=&location=경기&tabType=recruit', logoEmoji: '🌿', badgeText: '경기 지역', description: '경기도 지역 채용공고 모음', gradientFrom: '#15803d', gradientTo: '#166534', category: 'regional', companySize: 'all', jobTypes: 'all', careerLevel: 'all', location: 'gyeonggi', jobCategory: 'all', order: 91 },
      { name: '대구·경북 채용', url: 'https://www.daegujobedu.kr/', logoEmoji: '🍎', badgeText: '대구·경북', description: '대구·경상북도 지역 채용정보', gradientFrom: '#dc2626', gradientTo: '#b91c1c', category: 'regional', companySize: 'all', jobTypes: 'all', careerLevel: 'all', location: 'daegu', jobCategory: 'all', order: 92 },

      // ═══════════════════════════════════════════════════════
      //  재택 / 프리랜서 특화
      // ═══════════════════════════════════════════════════════
      { name: '재택근무 채용 (Wanted)', url: 'https://www.wanted.co.kr/jobs?job_sort=job.latest_order&years=-1&locations=remote&category=518', logoEmoji: '🏠', badgeText: '리모트 전문', description: '완전 재택·하이브리드 개발자 채용', gradientFrom: '#3b82f6', gradientTo: '#2563eb', category: 'remote', companySize: 'all', jobTypes: 'fulltime,contract', careerLevel: 'all', location: 'remote', jobCategory: 'it', order: 95 },
      { name: '크몽 (프리랜서)', url: 'https://kmong.com/', logoEmoji: '✨', badgeText: '프리랜서', description: '개발·디자인·마케팅 프리랜서 플랫폼', gradientFrom: '#7c3aed', gradientTo: '#6d28d9', category: 'remote', companySize: 'small', jobTypes: 'freelance', careerLevel: 'all', location: 'remote', jobCategory: 'all', order: 96 },
      { name: '위시켓 (IT 프리랜서)', url: 'https://www.wishket.com/', logoEmoji: '🎯', badgeText: 'IT 프리랜서', description: 'IT 개발·디자인 프리랜서·프로젝트 매칭', gradientFrom: '#0891b2', gradientTo: '#0e7490', category: 'remote', companySize: 'small', jobTypes: 'freelance,contract', careerLevel: 'all', location: 'remote', jobCategory: 'it', order: 97 },
    ];

    for (const link of externalLinks) {
      await prisma.externalJobLink.create({ data: link });
    }
    console.log(`  ✓ 외부 채용 링크 ${externalLinks.length}개 생성`);
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
