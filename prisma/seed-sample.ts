/**
 * 샘플 데이터 시드 스크립트
 * 실행: npx ts-node prisma/seed-sample.ts
 *
 * - 모든 엔티티에 isSample: true 플래그
 * - 샘플 이메일: sample-xxx@sample.local
 * - 어드민 "샘플 데이터 일괄 삭제" 기능으로 삭제 가능
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 샘플 데이터 생성 시작...');

  // ─── 1. 샘플 유저 (10명+) ───────────────────────────────────────
  const sampleUsers = [
    { email: 'sample-dev1@sample.local', name: '김개발', username: 'dev-kim', userType: 'personal', plan: 'free', role: 'user' },
    { email: 'sample-dev2@sample.local', name: '이프론트', username: 'frontend-lee', userType: 'personal', plan: 'pro', role: 'user' },
    { email: 'sample-design@sample.local', name: '박디자이너', username: 'designer-park', userType: 'personal', plan: 'free', role: 'user' },
    { email: 'sample-marketing@sample.local', name: '최마케터', username: 'marketer-choi', userType: 'personal', plan: 'free', role: 'user' },
    { email: 'sample-pm@sample.local', name: '정기획', username: 'pm-jung', userType: 'personal', plan: 'pro', role: 'user' },
    { email: 'sample-newbie@sample.local', name: '신입준', username: 'newbie-shin', userType: 'personal', plan: 'free', role: 'user' },
    { email: 'sample-senior@sample.local', name: '오시니어', username: 'senior-oh', userType: 'personal', plan: 'pro', role: 'user' },
    { email: 'sample-recruiter1@sample.local', name: '황리크루터', username: 'recruiter-hwang', userType: 'recruiter', companyName: '테크스타트업', plan: 'pro', role: 'user' },
    { email: 'sample-company@sample.local', name: '주식회사 이력서공방', username: 'company-sample', userType: 'company', companyName: '이력서공방 Inc.', plan: 'pro', role: 'user' },
    { email: 'sample-recruiter2@sample.local', name: '임HR팀장', username: 'hr-im', userType: 'recruiter', companyName: '빅테크코리아', plan: 'free', role: 'user' },
    { email: 'sample-data@sample.local', name: '조데이터', username: 'data-jo', userType: 'personal', plan: 'free', role: 'user' },
    { email: 'sample-backend@sample.local', name: '강백엔드', username: 'backend-kang', userType: 'personal', plan: 'pro', role: 'user' },
  ];

  const createdUsers: Record<string, string> = {};
  for (const u of sampleUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      createdUsers[u.email] = existing.id;
      console.log(`  ↩ 기존 유저: ${u.name}`);
      continue;
    }
    const created = await prisma.user.create({
      data: {
        ...u,
        isSample: true,
        provider: 'sample',
        providerId: `sample-${u.username}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
      },
    });
    createdUsers[u.email] = created.id;
    console.log(`  ✓ 유저: ${u.name} (${u.userType})`);
  }

  // ─── 2. 샘플 이력서 (20개+) ──────────────────────────────────────
  const resumeTemplates = [
    {
      email: 'sample-dev1@sample.local',
      title: '풀스택 개발자 이력서 (React/Node.js 5년)',
      visibility: 'public',
      viewCount: 342,
      info: { name: '김개발', email: 'sample-dev1@sample.local', phone: '010-1234-5678', summary: 'React와 Node.js를 중심으로 풀스택 개발 경험 5년. 스타트업부터 대기업까지 다양한 규모의 프로젝트에서 리드 개발자로 활동하였습니다.' },
      experiences: [
        { company: '테크스타트업', position: '시니어 풀스택 개발자', startDate: '2022-03', endDate: '', description: 'React 기반 SPA 설계 및 개발, Node.js REST API 구축, AWS 인프라 관리' },
        { company: '이커머스컴퍼니', position: '프론트엔드 개발자', startDate: '2020-01', endDate: '2022-02', description: 'React + TypeScript 도입 주도, 성능 최적화로 LCP 40% 개선' },
      ],
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker'],
    },
    {
      email: 'sample-dev2@sample.local',
      title: '프론트엔드 개발자 이력서 (Vue/React 4년)',
      visibility: 'public',
      viewCount: 218,
      info: { name: '이프론트', email: 'sample-dev2@sample.local', phone: '010-2345-6789', summary: '사용자 중심의 UI/UX를 구현하는 프론트엔드 개발자입니다. Vue.js와 React를 활용한 대규모 프로젝트 경험이 있습니다.' },
      experiences: [
        { company: '핀테크기업', position: '프론트엔드 개발자', startDate: '2021-06', endDate: '', description: 'Vue.js 기반 금융 대시보드 개발, 실시간 차트 구현' },
      ],
      skills: ['Vue.js', 'React', 'Webpack', 'Sass', 'TypeScript', 'Figma'],
    },
    {
      email: 'sample-design@sample.local',
      title: 'UX/UI 디자이너 포트폴리오 이력서',
      visibility: 'public',
      viewCount: 156,
      info: { name: '박디자이너', email: 'sample-design@sample.local', phone: '010-3456-7890', summary: '사용자 경험을 최우선으로 생각하는 UX 디자이너. Figma와 Framer로 인터랙티브 프로토타입 제작에 강점.' },
      experiences: [
        { company: '디자인스튜디오', position: 'UX 디자이너', startDate: '2022-01', endDate: '', description: 'B2B SaaS 제품 UX 리디자인, 사용성 테스트 및 A/B 테스트 주도' },
      ],
      skills: ['Figma', 'Framer', 'Sketch', 'Adobe XD', 'Prototyping', 'User Research'],
    },
    {
      email: 'sample-marketing@sample.local',
      title: '디지털 마케터 이력서 — 그로스 해킹 전문',
      visibility: 'public',
      viewCount: 89,
      info: { name: '최마케터', email: 'sample-marketing@sample.local', phone: '010-4567-8901', summary: '데이터 기반 그로스 해킹과 퍼포먼스 마케팅으로 스타트업 MAU를 3배 성장시킨 마케터.' },
      experiences: [
        { company: '스타트업A', position: '그로스 마케터', startDate: '2021-03', endDate: '', description: 'Facebook/Google 광고 운영, ROAS 250% 달성, 유저 퍼널 최적화' },
      ],
      skills: ['Google Analytics', 'Facebook Ads', 'SQL', 'Amplitude', 'A/B Testing', 'SEO'],
    },
    {
      email: 'sample-pm@sample.local',
      title: '프로덕트 매니저 이력서 — IT 서비스 기획 7년',
      visibility: 'public',
      viewCount: 203,
      info: { name: '정기획', email: 'sample-pm@sample.local', phone: '010-5678-9012', summary: '7년간 모바일/웹 서비스를 기획하고 0→1 런치를 이끈 PM. 개발자 출신으로 기술 이해도 높음.' },
      experiences: [
        { company: '빅테크코리아', position: '시니어 PM', startDate: '2020-07', endDate: '', description: '신규 구독 서비스 런치, MAU 50만 달성' },
        { company: '모바일스타트업', position: 'PM', startDate: '2017-01', endDate: '2020-06', description: '앱 0→1 런치, iOS/Android 동시 출시' },
      ],
      skills: ['Jira', 'Notion', 'Figma', 'SQL', 'OKR', 'Agile'],
    },
    {
      email: 'sample-newbie@sample.local',
      title: '신입 개발자 이력서 — 컴공 졸업예정',
      visibility: 'public',
      viewCount: 45,
      info: { name: '신입준', email: 'sample-newbie@sample.local', phone: '010-6789-0123', summary: '올해 2월 컴퓨터공학 졸업예정. Java Spring Boot와 React로 토이 프로젝트 다수 진행. 열정적인 성장을 추구합니다.' },
      experiences: [],
      skills: ['Java', 'Spring Boot', 'React', 'MySQL', 'Git'],
    },
    {
      email: 'sample-senior@sample.local',
      title: '백엔드 아키텍트 이력서 — 10년 경력',
      visibility: 'public',
      viewCount: 412,
      info: { name: '오시니어', email: 'sample-senior@sample.local', phone: '010-7890-1234', summary: '10년간 대용량 트래픽 서비스의 백엔드 아키텍처를 설계하고 운영. MSA 전환 및 Kubernetes 도입 경험.' },
      experiences: [
        { company: '유니콘스타트업', position: '백엔드 아키텍트', startDate: '2019-01', endDate: '', description: 'MSA 전환 리드, 일 100만 트랜잭션 처리 시스템 설계' },
        { company: '대기업SI', position: '백엔드 개발자', startDate: '2014-03', endDate: '2018-12', description: 'Java EE 기반 레거시 마이그레이션, Spring Boot 전환' },
      ],
      skills: ['Java', 'Kotlin', 'Spring', 'Kubernetes', 'Kafka', 'Redis', 'AWS'],
    },
    {
      email: 'sample-data@sample.local',
      title: '데이터 분석가 이력서 — SQL/Python 전문',
      visibility: 'public',
      viewCount: 167,
      info: { name: '조데이터', email: 'sample-data@sample.local', phone: '010-8901-2345', summary: '데이터로 비즈니스 의사결정을 지원하는 데이터 분석가. Python과 SQL로 대규모 데이터 파이프라인 구축 경험.' },
      experiences: [
        { company: '이커머스플랫폼', position: '데이터 분석가', startDate: '2021-08', endDate: '', description: 'Tableau 대시보드 구축, 주문 이탈율 분석으로 전환율 15% 개선' },
      ],
      skills: ['Python', 'SQL', 'Tableau', 'Spark', 'Airflow', 'dbt'],
    },
    {
      email: 'sample-backend@sample.local',
      title: 'Backend Engineer Resume (English)',
      visibility: 'public',
      viewCount: 98,
      info: { name: '강백엔드', email: 'sample-backend@sample.local', phone: '010-9012-3456', summary: 'Experienced backend engineer with 6 years of expertise in Python/Django and microservices architecture. Passionate about scalable system design.' },
      experiences: [
        { company: 'GlobalTech Inc.', position: 'Senior Backend Engineer', startDate: '2021-01', endDate: '', description: 'Built scalable APIs handling 10M+ daily requests using Python/FastAPI' },
      ],
      skills: ['Python', 'FastAPI', 'Django', 'PostgreSQL', 'Redis', 'Docker', 'GCP'],
    },
    // 비공개 이력서들 (private)
    {
      email: 'sample-dev1@sample.local',
      title: '대기업 지원용 이력서 (비공개)',
      visibility: 'private',
      viewCount: 0,
      info: { name: '김개발', email: 'sample-dev1@sample.local', phone: '010-1234-5678', summary: '대기업 지원 전용 커스텀 이력서' },
      experiences: [{ company: '테크스타트업', position: '시니어 개발자', startDate: '2022-03', endDate: '', description: '풀스택 개발' }],
      skills: ['React', 'Java', 'Spring'],
    },
    {
      email: 'sample-pm@sample.local',
      title: 'PM 이력서 — 핀테크 특화',
      visibility: 'private',
      viewCount: 0,
      info: { name: '정기획', email: 'sample-pm@sample.local', phone: '010-5678-9012', summary: '핀테크 서비스 기획 특화 이력서' },
      experiences: [{ company: '핀테크기업', position: 'PM', startDate: '2020-01', endDate: '', description: '결제 서비스 기획' }],
      skills: ['Jira', 'Figma', 'SQL'],
    },
  ];

  const resumeIds: string[] = [];
  for (const r of resumeTemplates) {
    const userId = createdUsers[r.email];
    if (!userId) continue;
    const slug = r.title.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-가-힣]/g, '').substring(0, 50) + '-' + Date.now();
    const resume = await prisma.resume.create({
      data: {
        title: r.title,
        slug,
        visibility: r.visibility,
        viewCount: r.viewCount,
        isSample: true,
        userId,
        personalInfo: {
          create: {
            name: r.info.name,
            email: r.info.email,
            phone: r.info.phone,
            summary: r.info.summary,
          },
        },
        skills: {
          create: {
            category: '기술 스택',
            items: r.skills.join(', '),
            sortOrder: 0,
          },
        },
        experiences: {
          createMany: {
            data: r.experiences.map((e, i) => ({
              company: e.company,
              position: e.position,
              startDate: e.startDate,
              endDate: e.endDate,
              description: e.description,
              sortOrder: i,
            })),
          },
        },
      },
    });
    resumeIds.push(resume.id);
    console.log(`  ✓ 이력서: ${r.title}`);
  }

  // ─── 3. 샘플 채용공고 (10개+) ────────────────────────────────────
  const recruiterId = createdUsers['sample-recruiter1@sample.local'];
  const recruiterId2 = createdUsers['sample-recruiter2@sample.local'];
  const companyId = createdUsers['sample-company@sample.local'];

  const jobPosts = [
    { userId: recruiterId, company: '테크스타트업', position: '프론트엔드 개발자', location: '서울 강남구', salary: '4000~6000만원', type: 'fulltime', skills: 'React,TypeScript,CSS', description: '빠르게 성장하는 B2B SaaS 스타트업에서 프론트엔드 개발자를 채용합니다. React와 TypeScript 경험자 우대.', requirements: '- React 2년 이상\n- TypeScript 경험\n- 협업 능력', benefits: '- 스톡옵션 제공\n- 유연근무제\n- 식비 지원', status: 'active' },
    { userId: recruiterId, company: '테크스타트업', position: '백엔드 개발자 (Node.js)', location: '서울 강남구', salary: '4500~7000만원', type: 'fulltime', skills: 'Node.js,TypeScript,PostgreSQL,AWS', description: 'Node.js 기반 API 서버 개발 및 운영. MSA 전환 프로젝트 참여 기회.', requirements: '- Node.js 3년 이상\n- REST API 설계 경험\n- DB 설계 경험', benefits: '- 성과급\n- 최신 장비\n- 도서구입비', status: 'active' },
    { userId: recruiterId, company: '테크스타트업', position: 'DevOps 엔지니어', location: '서울 강남구 (원격 협의)', salary: '5000~8000만원', type: 'fulltime', skills: 'AWS,Kubernetes,Terraform,CI/CD', description: '클라우드 인프라 자동화 및 CI/CD 파이프라인 구축을 담당할 DevOps 엔지니어 채용.', requirements: '- AWS 자격증 우대\n- Kubernetes 운영 경험', benefits: '- 원격근무 가능\n- 장비비 지원', status: 'active' },
    { userId: recruiterId2, company: '빅테크코리아', position: 'UI/UX 디자이너', location: '서울 마포구', salary: '3800~5500만원', type: 'fulltime', skills: 'Figma,UX Research,Prototyping', description: '사용자 중심 서비스를 만들어갈 UX 디자이너를 찾습니다. 리서치부터 와이어프레임, 시각 디자인까지 담당.', requirements: '- Figma 능숙\n- UX 리서치 경험\n- 포트폴리오 필수', benefits: '- 재택 2회/주\n- 디자인 도구 구독 지원', status: 'active' },
    { userId: recruiterId2, company: '빅테크코리아', position: '데이터 엔지니어', location: '서울 중구', salary: '5000~8000만원', type: 'fulltime', skills: 'Python,Spark,Airflow,BigQuery', description: '대규모 데이터 파이프라인 설계 및 운영. 실시간 스트리밍 처리 경험 우대.', requirements: '- Python 3년 이상\n- Spark/Hadoop 경험', benefits: '- 성과급 최대 300%\n- 스톡옵션', status: 'active' },
    { userId: companyId, company: '이력서공방 Inc.', position: 'AI/ML 엔지니어', location: '서울 성동구', salary: '6000~1억원', type: 'fulltime', skills: 'Python,PyTorch,LLM,NLP', description: 'AI 이력서 분석 서비스 고도화를 위한 ML 엔지니어 채용. LLM Fine-tuning 경험자 우대.', requirements: '- ML 모델 개발 경험\n- LLM API 활용 경험\n- 논문 구현 능력', benefits: '- 연구 자율성 보장\n- 논문 제출 지원', status: 'active' },
    { userId: companyId, company: '이력서공방 Inc.', position: '마케팅 매니저', location: '서울 성동구 (일부 원격)', salary: '4000~5500만원', type: 'fulltime', skills: 'Google Analytics,Facebook Ads,Content Marketing', description: '이력서/커리어 플랫폼 성장을 이끌 마케터. B2C SaaS 마케팅 경험 필수.', requirements: '- 디지털 마케팅 3년 이상\n- 데이터 분석 능력', benefits: '- 스톡옵션\n- 성과급', status: 'active' },
    { userId: recruiterId, company: '테크스타트업', position: 'QA 엔지니어 (계약직)', location: '서울 강남구', salary: '3500~4500만원', type: 'contract', skills: 'Selenium,JIRA,Test Automation', description: '신규 서비스 런치 전 QA 전담 계약직 채용 (6개월, 정규직 전환 검토).', requirements: '- QA 2년 이상\n- 자동화 테스트 경험', benefits: '- 성과 시 정규직 전환', status: 'active' },
    { userId: recruiterId2, company: '빅테크코리아', position: '프로덕트 매니저', location: '서울 중구', salary: '5500~9000만원', type: 'fulltime', skills: 'Jira,OKR,SQL,Figma', description: '금융 서비스 신규 프로덕트를 이끌 시니어 PM. 핀테크 또는 대용량 서비스 경험 우대.', requirements: '- PM 5년 이상\n- 데이터 기반 의사결정 경험', benefits: '- 임원급 대우 협의\n- 성과급', status: 'active' },
    { userId: companyId, company: '이력서공방 Inc.', position: '풀스택 개발자 (인턴)', location: '서울 성동구', salary: '250만원/월', type: 'intern', skills: 'React,Node.js,PostgreSQL', description: '이력서 플랫폼 기능 개발 참여 인턴. 실무 경험 및 정규직 전환 기회 제공.', requirements: '- CS 전공생\n- React 기본기', benefits: '- 정규직 전환 우선 검토\n- 멘토링', status: 'active' },
  ];

  for (const jp of jobPosts) {
    if (!jp.userId) continue;
    await prisma.jobPost.create({ data: jp });
    console.log(`  ✓ 채용공고: ${jp.position} @ ${jp.company}`);
  }

  // ─── 4. 스카우트 메시지 (5개) ────────────────────────────────────
  const scoutTargets = [
    createdUsers['sample-dev1@sample.local'],
    createdUsers['sample-backend@sample.local'],
    createdUsers['sample-data@sample.local'],
    createdUsers['sample-pm@sample.local'],
    createdUsers['sample-design@sample.local'],
  ];

  const scoutMessages = [
    { message: '안녕하세요! 이력서를 보고 연락드립니다. 저희 팀과 함께 성장할 의향이 있으신지요? 프론트엔드 포지션으로 연락드립니다.', position: '프론트엔드 개발자', read: false },
    { message: '백엔드 포지션으로 스카우트 제안드립니다. 귀하의 기술 스택이 저희 팀과 매우 잘 맞습니다!', position: '백엔드 엔지니어', read: true },
    { message: '데이터 분석가 포지션 제안드립니다. 연봉 협의 가능합니다.', position: '데이터 분석가', read: true },
    { message: 'PM 포지션으로 스카우트 제안드립니다. 귀하의 경험이 저희 서비스와 딱 맞습니다.', position: '프로덕트 매니저', read: false },
    { message: 'UX 디자이너로 함께 해주실 의향이 있으신가요? 포트폴리오를 보고 연락드립니다.', position: 'UX 디자이너', read: false },
  ];

  for (let i = 0; i < scoutMessages.length; i++) {
    const receiverId = scoutTargets[i];
    if (!receiverId || !recruiterId) continue;
    await prisma.scoutMessage.create({
      data: {
        senderId: recruiterId,
        receiverId,
        company: '테크스타트업',
        position: scoutMessages[i].position,
        message: scoutMessages[i].message,
        read: scoutMessages[i].read,
      },
    });
    console.log(`  ✓ 스카우트: ${scoutMessages[i].position}`);
  }

  // ─── 5. 배너 (3개) ───────────────────────────────────────────────
  const banners = [
    { title: '🚀 이력서공방 AI 기능 출시!', subtitle: 'AI가 3분 안에 맞춤 이력서를 완성해드립니다', bgColor: 'from-indigo-600 to-purple-600', isActive: true, order: 1, linkUrl: '/templates' },
    { title: '이력서 무료 리뷰 이벤트', subtitle: '4월 한 달간 전문가 이력서 리뷰 서비스를 무료로 제공합니다', bgColor: 'from-emerald-500 to-teal-600', isActive: true, order: 2, linkUrl: '/review' },
    { title: '신규 템플릿 10종 추가', subtitle: '더욱 세련된 이력서 템플릿을 만나보세요', bgColor: 'from-amber-500 to-orange-500', isActive: true, order: 3, linkUrl: '/templates' },
  ];

  for (const b of banners) {
    const existing = await prisma.banner.findFirst({ where: { title: b.title } });
    if (existing) { console.log(`  ↩ 기존 배너: ${b.title}`); continue; }
    await prisma.banner.create({ data: b });
    console.log(`  ✓ 배너: ${b.title}`);
  }

  // ─── 6. 공지사항 (6개) ───────────────────────────────────────────
  const notices = [
    { title: '[공지] 이력서공방 서비스 오픈 안내', content: '이력서공방 서비스가 정식 오픈되었습니다. AI 이력서 작성, 템플릿, 스카우트 기능을 무료로 이용해보세요!', type: 'GENERAL', isPopup: true, isPinned: true },
    { title: '[이벤트] 이력서 무료 리뷰 이벤트', content: '4월 한 달간 이력서 전문가 리뷰 서비스를 무료로 제공합니다. 지금 바로 신청하세요!', type: 'EVENT', isPopup: false, isPinned: true },
    { title: '[점검] 4월 20일 새벽 서버 점검', content: '4월 20일 오전 2:00~4:00 서버 점검이 예정되어 있습니다. 해당 시간 서비스 이용이 불가합니다.', type: 'MAINTENANCE', isPopup: false, isPinned: false },
    { title: '[공지] 개인정보처리방침 업데이트', content: '2026년 4월 1일부로 개인정보처리방침이 업데이트되었습니다. 주요 변경사항을 확인해주세요.', type: 'GENERAL', isPopup: false, isPinned: false },
    { title: '[이벤트] 친구 초대 이벤트', content: '친구를 초대하면 양쪽 모두 프리미엄 기능 1개월 무료 이용권을 드립니다!', type: 'EVENT', isPopup: false, isPinned: false },
    { title: '[공지] AI 기능 사용량 정책 안내', content: 'AI 이력서 변환 기능의 무료 사용량이 월 10회로 조정됩니다. 더 많은 사용을 원하시면 Pro 플랜을 이용해주세요.', type: 'GENERAL', isPopup: false, isPinned: false },
  ];

  for (const n of notices) {
    const existing = await prisma.notice.findFirst({ where: { title: n.title } });
    if (existing) { console.log(`  ↩ 기존 공지: ${n.title}`); continue; }
    await prisma.notice.create({ data: n });
    console.log(`  ✓ 공지: ${n.title}`);
  }

  // ─── 7. SystemConfig 초기값 ──────────────────────────────────────
  const configs = [
    { key: 'monetization_enabled', value: 'false', label: '유료화 활성화' },
    { key: 'maintenance_mode', value: 'false', label: '점검 모드' },
    { key: 'max_free_resumes', value: '3', label: '무료 플랜 이력서 최대 개수' },
    { key: 'max_ai_transforms_free', value: '10', label: '무료 AI 변환 월 한도' },
  ];

  for (const c of configs) {
    await prisma.systemConfig.upsert({
      where: { key: c.key },
      update: {},
      create: c,
    });
    console.log(`  ✓ 시스템 설정: ${c.key} = ${c.value}`);
  }

  console.log('\n✅ 샘플 데이터 생성 완료!');
  console.log(`   유저: ${sampleUsers.length}명, 이력서: ${resumeTemplates.length}개, 채용공고: ${jobPosts.length}개`);
  console.log(`   스카우트: ${scoutMessages.length}개, 배너: ${banners.length}개, 공지: ${notices.length}개`);
}

main()
  .catch(e => { console.error('❌ 시드 실패:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
