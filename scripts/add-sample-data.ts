/**
 * 운영 DB에 샘플 데이터 추가 스크립트
 * 실행: npx ts-node scripts/add-sample-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 샘플 데이터 추가 시작...\n');

  // 1. 샘플 사용자 생성 (없으면)
  const sampleUsers = [
    { email: 'dev.jiyoung@example.com', name: '박지영', provider: 'local', providerId: 'dev.jiyoung@example.com', userType: 'personal' as const },
    { email: 'designer.siwoo@example.com', name: '이시우', provider: 'local', providerId: 'designer.siwoo@example.com', userType: 'personal' as const },
    { email: 'pm.hyemin@example.com', name: '최혜민', provider: 'local', providerId: 'pm.hyemin@example.com', userType: 'personal' as const },
    { email: 'data.junghoon@example.com', name: '정준훈', provider: 'local', providerId: 'data.junghoon@example.com', userType: 'personal' as const },
    { email: 'hr.yuna@example.com', name: '한유나', provider: 'local', providerId: 'hr.yuna@example.com', userType: 'recruiter' as const, companyName: '테크스타트업' },
    { email: 'recruiter.minjae@example.com', name: '김민재', provider: 'local', providerId: 'recruiter.minjae@example.com', userType: 'recruiter' as const, companyName: '글로벌소프트' },
  ];

  const users: { id: string; name: string; userType: string }[] = [];
  for (const u of sampleUsers) {
    let user = await prisma.user.findFirst({ where: { email: u.email } });
    if (!user) user = await prisma.user.create({ data: u });
    users.push({ id: user.id, name: user.name || u.name, userType: user.userType || u.userType });
  }
  console.log(`✅ 사용자 ${users.length}명 확인/생성`);

  // 2. 다양한 이력서 (각 사용자별로)
  const resumeData = [
    {
      title: 'React 프론트엔드 개발자',
      slug: 'react-frontend',
      visibility: 'public',
      viewCount: 142,
      personalInfo: { create: { name: '박지영', email: 'dev.jiyoung@example.com', phone: '010-2345-6789', address: '서울시 마포구', website: 'https://jiyoung.dev', github: 'https://github.com/jiyoung-park', summary: '<p>4년차 프론트엔드 개발자. React, TypeScript 기반 SaaS 플랫폼 개발 경험. 사용자 중심 UI/UX와 웹 성능 최적화에 관심이 많습니다.</p>', photo: '', birthYear: '1996', links: '[]', military: '' } },
      experiences: { create: [
        { company: '토스', position: '프론트엔드 개발자', department: '결제팀', startDate: '2023-01', endDate: '', current: true, description: '<p>토스 결제 서비스 프론트엔드 개발</p>', achievements: '<ul><li>결제 성공률 99.7% 달성</li><li>모바일 결제 UI 리뉴얼</li></ul>', techStack: 'React, TypeScript, Recoil, Emotion', sortOrder: 0 },
        { company: '우아한형제들', position: '웹 개발자', department: '주문팀', startDate: '2021-03', endDate: '2022-12', current: false, description: '<p>배달의민족 주문 시스템 프론트엔드</p>', achievements: '<ul><li>주문 플로우 리팩토링 (로딩 40% 개선)</li></ul>', techStack: 'React, Redux, Sass', sortOrder: 1 },
      ] },
      educations: { create: [{ school: '한양대학교', degree: '학사', field: '소프트웨어학과', gpa: '3.9/4.5', startDate: '2015-03', endDate: '2021-02', description: '', sortOrder: 0 }] },
      skills: { create: [
        { category: 'Frontend', items: 'React, TypeScript, Next.js, Vue.js, Tailwind CSS, Emotion', sortOrder: 0 },
        { category: 'Tools', items: 'Git, Figma, Jira, Sentry, Datadog', sortOrder: 1 },
      ] },
      projects: { create: [{ name: '결제 SDK 리뉴얼', company: '토스', role: '프론트엔드 리드', startDate: '2023-06', endDate: '2024-01', description: '<p>결제 SDK v3 리뉴얼. 번들 사이즈 40% 절감, 초기 로딩 속도 2배 향상.</p>', techStack: 'React, TypeScript, Rollup', link: '', sortOrder: 0 }] },
      certifications: { create: [{ name: 'AWS Certified Developer', issuer: 'Amazon', issueDate: '2023-05', expiryDate: '', credentialId: '', description: '', sortOrder: 0 }] },
      languages: { create: [{ name: '영어', testName: 'OPIC', score: 'IH', testDate: '2022-09', sortOrder: 0 }] },
      awards: { create: [] },
      activities: { create: [] },
    },
    {
      title: 'UX/UI 디자이너 포트폴리오',
      slug: 'ux-designer',
      visibility: 'public',
      viewCount: 89,
      personalInfo: { create: { name: '이시우', email: 'designer.siwoo@example.com', phone: '010-3456-7890', address: '서울시 성동구', website: 'https://siwoo.design', github: '', summary: '<p>5년차 UX/UI 디자이너. 사용자 리서치부터 프로토타이핑까지 전 과정을 경험했습니다. 데이터 기반 디자인 의사결정을 중시합니다.</p>', photo: '', birthYear: '1994', links: '[]', military: '' } },
      experiences: { create: [
        { company: '카카오', position: 'UX 디자이너', department: '카카오톡팀', startDate: '2022-07', endDate: '', current: true, description: '<p>카카오톡 채팅방 UX 개선</p>', achievements: '<ul><li>채팅방 사용성 점수 4.2→4.7 향상</li><li>접근성 AA 기준 달성</li></ul>', techStack: 'Figma, Principle, Zeplin', sortOrder: 0 },
        { company: '라인', position: 'UI 디자이너', department: '커머스팀', startDate: '2020-01', endDate: '2022-06', current: false, description: '<p>라인 쇼핑 UI 디자인</p>', achievements: '<ul><li>구매 전환율 15% 향상</li></ul>', techStack: 'Sketch, InVision, After Effects', sortOrder: 1 },
      ] },
      educations: { create: [{ school: '홍익대학교', degree: '학사', field: '시각디자인학과', gpa: '3.7/4.5', startDate: '2013-03', endDate: '2019-02', description: '', sortOrder: 0 }] },
      skills: { create: [
        { category: 'Design', items: 'Figma, Sketch, Adobe XD, Illustrator, Photoshop', sortOrder: 0 },
        { category: 'Prototyping', items: 'Principle, ProtoPie, Framer', sortOrder: 1 },
        { category: 'Research', items: 'UserTesting, Hotjar, Google Analytics, A/B Testing', sortOrder: 2 },
      ] },
      projects: { create: [] },
      certifications: { create: [] },
      languages: { create: [{ name: '영어', testName: 'TOEIC', score: '885', testDate: '2021-03', sortOrder: 0 }, { name: '일본어', testName: 'JLPT', score: 'N2', testDate: '2020-12', sortOrder: 1 }] },
      awards: { create: [{ name: 'Red Dot Design Award', issuer: 'Red Dot', awardDate: '2023-04', description: 'UI/UX 부문 수상', sortOrder: 0 }] },
      activities: { create: [] },
    },
    {
      title: '데이터 엔지니어 이력서',
      slug: 'data-engineer',
      visibility: 'public',
      viewCount: 67,
      personalInfo: { create: { name: '정준훈', email: 'data.junghoon@example.com', phone: '010-5678-1234', address: '판교', website: '', github: 'https://github.com/junghoon-data', summary: '<p>3년차 데이터 엔지니어. 대용량 데이터 파이프라인 구축 및 실시간 데이터 처리 경험.</p>', photo: '', birthYear: '1997', links: '[]', military: '육군 병장 만기전역' } },
      experiences: { create: [
        { company: '쿠팡', position: '데이터 엔지니어', department: '데이터플랫폼팀', startDate: '2022-09', endDate: '', current: true, description: '<p>쿠팡 실시간 추천 데이터 파이프라인 구축</p>', achievements: '<ul><li>일 처리량 10TB→50TB 확장</li><li>데이터 지연 5분→30초 단축</li></ul>', techStack: 'Python, Spark, Kafka, Airflow, AWS', sortOrder: 0 },
      ] },
      educations: { create: [{ school: 'KAIST', degree: '석사', field: '데이터사이언스', gpa: '4.0/4.3', startDate: '2020-03', endDate: '2022-08', description: '', sortOrder: 0 }] },
      skills: { create: [
        { category: 'Data', items: 'Python, SQL, Spark, Kafka, Airflow, dbt', sortOrder: 0 },
        { category: 'Cloud', items: 'AWS (S3, Glue, Redshift, EMR), GCP (BigQuery)', sortOrder: 1 },
        { category: 'ML', items: 'TensorFlow, PyTorch, scikit-learn', sortOrder: 2 },
      ] },
      projects: { create: [{ name: '실시간 추천 파이프라인', company: '쿠팡', role: '데이터 엔지니어', startDate: '2023-01', endDate: '2023-08', description: '<p>Kafka + Spark Streaming 기반 실시간 상품 추천 데이터 파이프라인.</p>', techStack: 'Kafka, Spark, Redis, Python', link: '', sortOrder: 0 }] },
      certifications: { create: [{ name: 'AWS Data Analytics Specialty', issuer: 'Amazon', issueDate: '2023-11', expiryDate: '', credentialId: '', description: '', sortOrder: 0 }] },
      languages: { create: [{ name: '영어', testName: 'TOEFL', score: '105', testDate: '2020-01', sortOrder: 0 }] },
      awards: { create: [] },
      activities: { create: [] },
    },
    {
      title: 'PM/기획자 이력서',
      slug: 'product-manager',
      visibility: 'public',
      viewCount: 53,
      personalInfo: { create: { name: '최혜민', email: 'pm.hyemin@example.com', phone: '010-4567-8901', address: '서울시 강남구', website: 'https://hyemin.pm', github: '', summary: '<p>6년차 프로덕트 매니저. B2B SaaS 제품 기획부터 출시까지 리드한 경험이 있습니다. 데이터 기반 의사결정과 애자일 방법론을 실천합니다.</p>', photo: '', birthYear: '1993', links: '[]', military: '' } },
      experiences: { create: [
        { company: '당근마켓', position: 'Product Manager', department: '중고거래팀', startDate: '2023-03', endDate: '', current: true, description: '<p>중고거래 핵심 기능 기획 및 개선</p>', achievements: '<ul><li>거래 완료율 23% 향상</li><li>신규 카테고리 5개 론칭</li></ul>', techStack: 'Jira, Confluence, Amplitude, SQL', sortOrder: 0 },
        { company: '리디', position: '서비스 기획자', department: '구독팀', startDate: '2020-06', endDate: '2023-02', current: false, description: '<p>리디셀렉트 구독 서비스 기획</p>', achievements: '<ul><li>월 구독자 30만→50만 성장 기여</li></ul>', techStack: 'Figma, Notion, GA, Mixpanel', sortOrder: 1 },
      ] },
      educations: { create: [{ school: '연세대학교', degree: '학사', field: '경영학과', gpa: '3.6/4.3', startDate: '2012-03', endDate: '2018-02', description: '', sortOrder: 0 }] },
      skills: { create: [
        { category: 'Product', items: 'Product Strategy, User Research, A/B Testing, OKR', sortOrder: 0 },
        { category: 'Tools', items: 'Jira, Confluence, Amplitude, Mixpanel, SQL, Figma', sortOrder: 1 },
      ] },
      projects: { create: [] },
      certifications: { create: [{ name: 'Google Analytics 4', issuer: 'Google', issueDate: '2023-08', expiryDate: '', credentialId: '', description: '', sortOrder: 0 }] },
      languages: { create: [{ name: '영어', testName: 'TOEIC Speaking', score: 'Level 7', testDate: '2022-11', sortOrder: 0 }] },
      awards: { create: [] },
      activities: { create: [{ name: '프로덕트 밋업 운영', organization: 'ProductTank Seoul', role: '운영진', startDate: '2022-01', endDate: '', description: '월 1회 프로덕트 밋업 기획 및 운영', sortOrder: 0 }] },
    },
  ];

  let createdCount = 0;
  for (let i = 0; i < resumeData.length; i++) {
    const owner = users[i % users.length];
    const existing = await prisma.resume.findFirst({ where: { slug: resumeData[i].slug } });
    if (existing) {
      console.log(`  ⏭ "${resumeData[i].title}" 이미 존재 (skip)`);
      continue;
    }
    await prisma.resume.create({ data: { ...resumeData[i], userId: owner.id } });
    createdCount++;
    console.log(`  ✅ "${resumeData[i].title}" → ${owner.name}`);
  }
  console.log(`\n✅ 이력서 ${createdCount}개 생성\n`);

  // 3. 추가 채용 공고
  const recruiter = users.find(u => u.userType === 'recruiter');
  if (recruiter) {
    const existingJobs = await prisma.jobPost.count();
    if (existingJobs < 10) {
      const newJobs = [
        { company: '라인', position: 'iOS 개발자', location: '성남시 분당구', salary: '5,500~9,000만원', type: 'fulltime', skills: 'Swift, SwiftUI, UIKit, RxSwift, Combine', description: 'LINE 메신저 iOS 앱 개발', requirements: 'Swift 3년 이상', benefits: '재택근무, 교육비' },
        { company: '크래프톤', position: '게임 서버 개발자', location: '서울시 강남구', salary: '6,000~12,000만원', type: 'fulltime', skills: 'C++, Go, gRPC, Redis, MySQL', description: '배틀그라운드 게임 서버 개발', requirements: 'C++ 또는 Go 5년 이상', benefits: '스톡옵션, 게임 지원' },
        { company: '비바리퍼블리카', position: '백엔드 개발자', location: '서울시 강남구', salary: '5,000~10,000만원', type: 'fulltime', skills: 'Kotlin, Spring, JPA, Kafka, PostgreSQL', description: '토스 금융 서비스 백엔드 개발', requirements: 'Kotlin/Java 3년 이상', benefits: '성과급, 유연근무' },
        { company: '야놀자', position: 'ML 엔지니어', location: '서울시 강남구', salary: '5,500~9,000만원', type: 'fulltime', skills: 'Python, PyTorch, TensorFlow, MLOps, Kubernetes', description: 'AI 추천 시스템 개발', requirements: 'ML 2년 이상', benefits: '자기계발비, 건강검진' },
        { company: '무신사', position: '프론트엔드 개발자 (인턴)', location: '서울시 성동구', salary: '월 280만원', type: 'intern', skills: 'React, TypeScript, Next.js', description: '무신사 스토어 프론트엔드 인턴', requirements: 'React 기초', benefits: '정규직 전환, 사원할인' },
      ];
      for (const job of newJobs) {
        const exists = await prisma.jobPost.findFirst({ where: { company: job.company, position: job.position } });
        if (!exists) {
          await prisma.jobPost.create({ data: { ...job, userId: recruiter.id } });
          console.log(`  ✅ 채용공고: ${job.company} - ${job.position}`);
        }
      }
    }
  }

  // 4. 샘플 댓글
  const publicResumes = await prisma.resume.findMany({ where: { visibility: 'public' }, take: 5, select: { id: true } });
  for (const resume of publicResumes) {
    const commentCount = await prisma.comment.count({ where: { resumeId: resume.id } });
    if (commentCount === 0) {
      const commenter = users[Math.floor(Math.random() * users.length)];
      const comments = [
        '이력서 구성이 깔끔하네요! 프로젝트 성과가 잘 정리되어 있습니다.',
        '기술 스택이 다양해서 좋습니다. 경력 기술 부분이 인상적이에요.',
        'ATS에 잘 맞는 이력서 같습니다. 참고하겠습니다!',
      ];
      const comment = comments[Math.floor(Math.random() * comments.length)];
      try {
        await prisma.comment.create({
          data: {
            content: comment,
            authorName: commenter.name,
            resume: { connect: { id: resume.id } },
            user: { connect: { id: commenter.id } },
          },
        });
      } catch {}
    }
  }
  console.log(`\n✅ 샘플 댓글 추가 완료`);

  // 5. 팔로우 관계
  for (let i = 0; i < users.length - 1; i++) {
    try {
      await prisma.follow.create({
        data: { followerId: users[i].id, followingId: users[i + 1].id },
      });
    } catch {} // 이미 존재하면 무시
  }
  console.log(`✅ 팔로우 관계 추가 완료`);

  console.log('\n🎉 샘플 데이터 추가 완료!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
