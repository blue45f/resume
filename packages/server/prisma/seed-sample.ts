/**
 * 샘플 데이터 시드 스크립트
 * 실행: npx ts-node prisma/seed-sample.ts
 *
 * - 모든 엔티티에 isSample: true 플래그
 * - 샘플 이메일: sample-xxx@sample.local
 * - 어드민 "샘플 데이터 일괄 삭제" 기능으로 삭제 가능
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL environment variable is required');
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

async function main() {
  console.log('🌱 샘플 데이터 생성 시작...');

  // ─── 1. 샘플 유저 (10명+) ───────────────────────────────────────
  const sampleUsers = [
    {
      email: 'sample-dev1@sample.local',
      name: '김개발',
      username: 'dev-kim',
      userType: 'personal',
      plan: 'free',
      role: 'user',
    },
    {
      email: 'sample-dev2@sample.local',
      name: '이프론트',
      username: 'frontend-lee',
      userType: 'personal',
      plan: 'pro',
      role: 'user',
    },
    {
      email: 'sample-design@sample.local',
      name: '박디자이너',
      username: 'designer-park',
      userType: 'personal',
      plan: 'free',
      role: 'user',
    },
    {
      email: 'sample-marketing@sample.local',
      name: '최마케터',
      username: 'marketer-choi',
      userType: 'personal',
      plan: 'free',
      role: 'user',
    },
    {
      email: 'sample-pm@sample.local',
      name: '정기획',
      username: 'pm-jung',
      userType: 'personal',
      plan: 'pro',
      role: 'user',
    },
    {
      email: 'sample-newbie@sample.local',
      name: '신입준',
      username: 'newbie-shin',
      userType: 'personal',
      plan: 'free',
      role: 'user',
    },
    {
      email: 'sample-senior@sample.local',
      name: '오시니어',
      username: 'senior-oh',
      userType: 'personal',
      plan: 'pro',
      role: 'user',
    },
    {
      email: 'sample-recruiter1@sample.local',
      name: '황리크루터',
      username: 'recruiter-hwang',
      userType: 'recruiter',
      companyName: '테크스타트업',
      plan: 'pro',
      role: 'user',
    },
    {
      email: 'sample-company@sample.local',
      name: '주식회사 이력서공방',
      username: 'company-sample',
      userType: 'company',
      companyName: '이력서공방 Inc.',
      plan: 'pro',
      role: 'user',
    },
    {
      email: 'sample-recruiter2@sample.local',
      name: '임HR팀장',
      username: 'hr-im',
      userType: 'recruiter',
      companyName: '빅테크코리아',
      plan: 'free',
      role: 'user',
    },
    {
      email: 'sample-data@sample.local',
      name: '조데이터',
      username: 'data-jo',
      userType: 'personal',
      plan: 'free',
      role: 'user',
    },
    {
      email: 'sample-backend@sample.local',
      name: '강백엔드',
      username: 'backend-kang',
      userType: 'personal',
      plan: 'pro',
      role: 'user',
    },
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
      info: {
        name: '김개발',
        email: 'sample-dev1@sample.local',
        phone: '010-1234-5678',
        summary:
          'React와 Node.js를 중심으로 풀스택 개발 경험 5년. 스타트업부터 대기업까지 다양한 규모의 프로젝트에서 리드 개발자로 활동하였습니다.',
      },
      experiences: [
        {
          company: '테크스타트업',
          position: '시니어 풀스택 개발자',
          startDate: '2022-03',
          endDate: '',
          description: 'React 기반 SPA 설계 및 개발, Node.js REST API 구축, AWS 인프라 관리',
        },
        {
          company: '이커머스컴퍼니',
          position: '프론트엔드 개발자',
          startDate: '2020-01',
          endDate: '2022-02',
          description: 'React + TypeScript 도입 주도, 성능 최적화로 LCP 40% 개선',
        },
      ],
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker'],
    },
    {
      email: 'sample-dev2@sample.local',
      title: '프론트엔드 개발자 이력서 (Vue/React 4년)',
      visibility: 'public',
      viewCount: 218,
      info: {
        name: '이프론트',
        email: 'sample-dev2@sample.local',
        phone: '010-2345-6789',
        summary:
          '사용자 중심의 UI/UX를 구현하는 프론트엔드 개발자입니다. Vue.js와 React를 활용한 대규모 프로젝트 경험이 있습니다.',
      },
      experiences: [
        {
          company: '핀테크기업',
          position: '프론트엔드 개발자',
          startDate: '2021-06',
          endDate: '',
          description: 'Vue.js 기반 금융 대시보드 개발, 실시간 차트 구현',
        },
      ],
      skills: ['Vue.js', 'React', 'Webpack', 'Sass', 'TypeScript', 'Figma'],
    },
    {
      email: 'sample-design@sample.local',
      title: 'UX/UI 디자이너 포트폴리오 이력서',
      visibility: 'public',
      viewCount: 156,
      info: {
        name: '박디자이너',
        email: 'sample-design@sample.local',
        phone: '010-3456-7890',
        summary:
          '사용자 경험을 최우선으로 생각하는 UX 디자이너. Figma와 Framer로 인터랙티브 프로토타입 제작에 강점.',
      },
      experiences: [
        {
          company: '디자인스튜디오',
          position: 'UX 디자이너',
          startDate: '2022-01',
          endDate: '',
          description: 'B2B SaaS 제품 UX 리디자인, 사용성 테스트 및 A/B 테스트 주도',
        },
      ],
      skills: ['Figma', 'Framer', 'Sketch', 'Adobe XD', 'Prototyping', 'User Research'],
    },
    {
      email: 'sample-marketing@sample.local',
      title: '디지털 마케터 이력서 — 그로스 해킹 전문',
      visibility: 'public',
      viewCount: 89,
      info: {
        name: '최마케터',
        email: 'sample-marketing@sample.local',
        phone: '010-4567-8901',
        summary:
          '데이터 기반 그로스 해킹과 퍼포먼스 마케팅으로 스타트업 MAU를 3배 성장시킨 마케터.',
      },
      experiences: [
        {
          company: '스타트업A',
          position: '그로스 마케터',
          startDate: '2021-03',
          endDate: '',
          description: 'Facebook/Google 광고 운영, ROAS 250% 달성, 유저 퍼널 최적화',
        },
      ],
      skills: ['Google Analytics', 'Facebook Ads', 'SQL', 'Amplitude', 'A/B Testing', 'SEO'],
    },
    {
      email: 'sample-pm@sample.local',
      title: '프로덕트 매니저 이력서 — IT 서비스 기획 7년',
      visibility: 'public',
      viewCount: 203,
      info: {
        name: '정기획',
        email: 'sample-pm@sample.local',
        phone: '010-5678-9012',
        summary:
          '7년간 모바일/웹 서비스를 기획하고 0→1 런치를 이끈 PM. 개발자 출신으로 기술 이해도 높음.',
      },
      experiences: [
        {
          company: '빅테크코리아',
          position: '시니어 PM',
          startDate: '2020-07',
          endDate: '',
          description: '신규 구독 서비스 런치, MAU 50만 달성',
        },
        {
          company: '모바일스타트업',
          position: 'PM',
          startDate: '2017-01',
          endDate: '2020-06',
          description: '앱 0→1 런치, iOS/Android 동시 출시',
        },
      ],
      skills: ['Jira', 'Notion', 'Figma', 'SQL', 'OKR', 'Agile'],
    },
    {
      email: 'sample-newbie@sample.local',
      title: '신입 개발자 이력서 — 컴공 졸업예정',
      visibility: 'public',
      viewCount: 45,
      info: {
        name: '신입준',
        email: 'sample-newbie@sample.local',
        phone: '010-6789-0123',
        summary:
          '올해 2월 컴퓨터공학 졸업예정. Java Spring Boot와 React로 토이 프로젝트 다수 진행. 열정적인 성장을 추구합니다.',
      },
      experiences: [],
      skills: ['Java', 'Spring Boot', 'React', 'MySQL', 'Git'],
    },
    {
      email: 'sample-senior@sample.local',
      title: '백엔드 아키텍트 이력서 — 10년 경력',
      visibility: 'public',
      viewCount: 412,
      info: {
        name: '오시니어',
        email: 'sample-senior@sample.local',
        phone: '010-7890-1234',
        summary:
          '10년간 대용량 트래픽 서비스의 백엔드 아키텍처를 설계하고 운영. MSA 전환 및 Kubernetes 도입 경험.',
      },
      experiences: [
        {
          company: '유니콘스타트업',
          position: '백엔드 아키텍트',
          startDate: '2019-01',
          endDate: '',
          description: 'MSA 전환 리드, 일 100만 트랜잭션 처리 시스템 설계',
        },
        {
          company: '대기업SI',
          position: '백엔드 개발자',
          startDate: '2014-03',
          endDate: '2018-12',
          description: 'Java EE 기반 레거시 마이그레이션, Spring Boot 전환',
        },
      ],
      skills: ['Java', 'Kotlin', 'Spring', 'Kubernetes', 'Kafka', 'Redis', 'AWS'],
    },
    {
      email: 'sample-data@sample.local',
      title: '데이터 분석가 이력서 — SQL/Python 전문',
      visibility: 'public',
      viewCount: 167,
      info: {
        name: '조데이터',
        email: 'sample-data@sample.local',
        phone: '010-8901-2345',
        summary:
          '데이터로 비즈니스 의사결정을 지원하는 데이터 분석가. Python과 SQL로 대규모 데이터 파이프라인 구축 경험.',
      },
      experiences: [
        {
          company: '이커머스플랫폼',
          position: '데이터 분석가',
          startDate: '2021-08',
          endDate: '',
          description: 'Tableau 대시보드 구축, 주문 이탈율 분석으로 전환율 15% 개선',
        },
      ],
      skills: ['Python', 'SQL', 'Tableau', 'Spark', 'Airflow', 'dbt'],
    },
    {
      email: 'sample-backend@sample.local',
      title: 'Backend Engineer Resume (English)',
      visibility: 'public',
      viewCount: 98,
      info: {
        name: '강백엔드',
        email: 'sample-backend@sample.local',
        phone: '010-9012-3456',
        summary:
          'Experienced backend engineer with 6 years of expertise in Python/Django and microservices architecture. Passionate about scalable system design.',
      },
      experiences: [
        {
          company: 'GlobalTech Inc.',
          position: 'Senior Backend Engineer',
          startDate: '2021-01',
          endDate: '',
          description: 'Built scalable APIs handling 10M+ daily requests using Python/FastAPI',
        },
      ],
      skills: ['Python', 'FastAPI', 'Django', 'PostgreSQL', 'Redis', 'Docker', 'GCP'],
    },
    // 비공개 이력서들 (private)
    {
      email: 'sample-dev1@sample.local',
      title: '대기업 지원용 이력서 (비공개)',
      visibility: 'private',
      viewCount: 0,
      info: {
        name: '김개발',
        email: 'sample-dev1@sample.local',
        phone: '010-1234-5678',
        summary: '대기업 지원 전용 커스텀 이력서',
      },
      experiences: [
        {
          company: '테크스타트업',
          position: '시니어 개발자',
          startDate: '2022-03',
          endDate: '',
          description: '풀스택 개발',
        },
      ],
      skills: ['React', 'Java', 'Spring'],
    },
    {
      email: 'sample-pm@sample.local',
      title: 'PM 이력서 — 핀테크 특화',
      visibility: 'private',
      viewCount: 0,
      info: {
        name: '정기획',
        email: 'sample-pm@sample.local',
        phone: '010-5678-9012',
        summary: '핀테크 서비스 기획 특화 이력서',
      },
      experiences: [
        {
          company: '핀테크기업',
          position: 'PM',
          startDate: '2020-01',
          endDate: '',
          description: '결제 서비스 기획',
        },
      ],
      skills: ['Jira', 'Figma', 'SQL'],
    },
  ];

  const resumeIds: string[] = [];
  for (const r of resumeTemplates) {
    const userId = createdUsers[r.email];
    if (!userId) continue;
    const slug =
      r.title
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-가-힣]/g, '')
        .substring(0, 50) +
      '-' +
      Date.now();
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
    {
      userId: recruiterId,
      company: '테크스타트업',
      position: '프론트엔드 개발자',
      location: '서울 강남구',
      salary: '4000~6000만원',
      type: 'fulltime',
      skills: 'React,TypeScript,CSS',
      description:
        '빠르게 성장하는 B2B SaaS 스타트업에서 프론트엔드 개발자를 채용합니다. React와 TypeScript 경험자 우대.',
      requirements: '- React 2년 이상\n- TypeScript 경험\n- 협업 능력',
      benefits: '- 스톡옵션 제공\n- 유연근무제\n- 식비 지원',
      status: 'active',
    },
    {
      userId: recruiterId,
      company: '테크스타트업',
      position: '백엔드 개발자 (Node.js)',
      location: '서울 강남구',
      salary: '4500~7000만원',
      type: 'fulltime',
      skills: 'Node.js,TypeScript,PostgreSQL,AWS',
      description: 'Node.js 기반 API 서버 개발 및 운영. MSA 전환 프로젝트 참여 기회.',
      requirements: '- Node.js 3년 이상\n- REST API 설계 경험\n- DB 설계 경험',
      benefits: '- 성과급\n- 최신 장비\n- 도서구입비',
      status: 'active',
    },
    {
      userId: recruiterId,
      company: '테크스타트업',
      position: 'DevOps 엔지니어',
      location: '서울 강남구 (원격 협의)',
      salary: '5000~8000만원',
      type: 'fulltime',
      skills: 'AWS,Kubernetes,Terraform,CI/CD',
      description: '클라우드 인프라 자동화 및 CI/CD 파이프라인 구축을 담당할 DevOps 엔지니어 채용.',
      requirements: '- AWS 자격증 우대\n- Kubernetes 운영 경험',
      benefits: '- 원격근무 가능\n- 장비비 지원',
      status: 'active',
    },
    {
      userId: recruiterId2,
      company: '빅테크코리아',
      position: 'UI/UX 디자이너',
      location: '서울 마포구',
      salary: '3800~5500만원',
      type: 'fulltime',
      skills: 'Figma,UX Research,Prototyping',
      description:
        '사용자 중심 서비스를 만들어갈 UX 디자이너를 찾습니다. 리서치부터 와이어프레임, 시각 디자인까지 담당.',
      requirements: '- Figma 능숙\n- UX 리서치 경험\n- 포트폴리오 필수',
      benefits: '- 재택 2회/주\n- 디자인 도구 구독 지원',
      status: 'active',
    },
    {
      userId: recruiterId2,
      company: '빅테크코리아',
      position: '데이터 엔지니어',
      location: '서울 중구',
      salary: '5000~8000만원',
      type: 'fulltime',
      skills: 'Python,Spark,Airflow,BigQuery',
      description: '대규모 데이터 파이프라인 설계 및 운영. 실시간 스트리밍 처리 경험 우대.',
      requirements: '- Python 3년 이상\n- Spark/Hadoop 경험',
      benefits: '- 성과급 최대 300%\n- 스톡옵션',
      status: 'active',
    },
    {
      userId: companyId,
      company: '이력서공방 Inc.',
      position: 'AI/ML 엔지니어',
      location: '서울 성동구',
      salary: '6000~1억원',
      type: 'fulltime',
      skills: 'Python,PyTorch,LLM,NLP',
      description:
        'AI 이력서 분석 서비스 고도화를 위한 ML 엔지니어 채용. LLM Fine-tuning 경험자 우대.',
      requirements: '- ML 모델 개발 경험\n- LLM API 활용 경험\n- 논문 구현 능력',
      benefits: '- 연구 자율성 보장\n- 논문 제출 지원',
      status: 'active',
    },
    {
      userId: companyId,
      company: '이력서공방 Inc.',
      position: '마케팅 매니저',
      location: '서울 성동구 (일부 원격)',
      salary: '4000~5500만원',
      type: 'fulltime',
      skills: 'Google Analytics,Facebook Ads,Content Marketing',
      description: '이력서/커리어 플랫폼 성장을 이끌 마케터. B2C SaaS 마케팅 경험 필수.',
      requirements: '- 디지털 마케팅 3년 이상\n- 데이터 분석 능력',
      benefits: '- 스톡옵션\n- 성과급',
      status: 'active',
    },
    {
      userId: recruiterId,
      company: '테크스타트업',
      position: 'QA 엔지니어 (계약직)',
      location: '서울 강남구',
      salary: '3500~4500만원',
      type: 'contract',
      skills: 'Selenium,JIRA,Test Automation',
      description: '신규 서비스 런치 전 QA 전담 계약직 채용 (6개월, 정규직 전환 검토).',
      requirements: '- QA 2년 이상\n- 자동화 테스트 경험',
      benefits: '- 성과 시 정규직 전환',
      status: 'active',
    },
    {
      userId: recruiterId2,
      company: '빅테크코리아',
      position: '프로덕트 매니저',
      location: '서울 중구',
      salary: '5500~9000만원',
      type: 'fulltime',
      skills: 'Jira,OKR,SQL,Figma',
      description:
        '금융 서비스 신규 프로덕트를 이끌 시니어 PM. 핀테크 또는 대용량 서비스 경험 우대.',
      requirements: '- PM 5년 이상\n- 데이터 기반 의사결정 경험',
      benefits: '- 임원급 대우 협의\n- 성과급',
      status: 'active',
    },
    {
      userId: companyId,
      company: '이력서공방 Inc.',
      position: '풀스택 개발자 (인턴)',
      location: '서울 성동구',
      salary: '250만원/월',
      type: 'intern',
      skills: 'React,Node.js,PostgreSQL',
      description: '이력서 플랫폼 기능 개발 참여 인턴. 실무 경험 및 정규직 전환 기회 제공.',
      requirements: '- CS 전공생\n- React 기본기',
      benefits: '- 정규직 전환 우선 검토\n- 멘토링',
      status: 'active',
    },
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
    {
      message:
        '안녕하세요! 이력서를 보고 연락드립니다. 저희 팀과 함께 성장할 의향이 있으신지요? 프론트엔드 포지션으로 연락드립니다.',
      position: '프론트엔드 개발자',
      read: false,
    },
    {
      message:
        '백엔드 포지션으로 스카우트 제안드립니다. 귀하의 기술 스택이 저희 팀과 매우 잘 맞습니다!',
      position: '백엔드 엔지니어',
      read: true,
    },
    {
      message: '데이터 분석가 포지션 제안드립니다. 연봉 협의 가능합니다.',
      position: '데이터 분석가',
      read: true,
    },
    {
      message: 'PM 포지션으로 스카우트 제안드립니다. 귀하의 경험이 저희 서비스와 딱 맞습니다.',
      position: '프로덕트 매니저',
      read: false,
    },
    {
      message: 'UX 디자이너로 함께 해주실 의향이 있으신가요? 포트폴리오를 보고 연락드립니다.',
      position: 'UX 디자이너',
      read: false,
    },
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
    {
      title: '🚀 이력서공방 AI 기능 출시!',
      subtitle: 'AI가 3분 안에 맞춤 이력서를 완성해드립니다',
      bgColor: 'from-indigo-600 to-purple-600',
      isActive: true,
      order: 1,
      linkUrl: '/templates',
    },
    {
      title: '이력서 무료 리뷰 이벤트',
      subtitle: '4월 한 달간 전문가 이력서 리뷰 서비스를 무료로 제공합니다',
      bgColor: 'from-emerald-500 to-teal-600',
      isActive: true,
      order: 2,
      linkUrl: '/review',
    },
    {
      title: '신규 템플릿 10종 추가',
      subtitle: '더욱 세련된 이력서 템플릿을 만나보세요',
      bgColor: 'from-amber-500 to-orange-500',
      isActive: true,
      order: 3,
      linkUrl: '/templates',
    },
  ];

  for (const b of banners) {
    const existing = await prisma.banner.findFirst({ where: { title: b.title } });
    if (existing) {
      console.log(`  ↩ 기존 배너: ${b.title}`);
      continue;
    }
    await prisma.banner.create({ data: b });
    console.log(`  ✓ 배너: ${b.title}`);
  }

  // ─── 6. 공지사항 (6개) ───────────────────────────────────────────
  const notices = [
    {
      title: '[공지] 이력서공방 서비스 오픈 안내',
      content:
        '이력서공방 서비스가 정식 오픈되었습니다. AI 이력서 작성, 템플릿, 스카우트 기능을 무료로 이용해보세요!',
      type: 'GENERAL',
      isPopup: true,
      isPinned: true,
    },
    {
      title: '[이벤트] 이력서 무료 리뷰 이벤트',
      content: '4월 한 달간 이력서 전문가 리뷰 서비스를 무료로 제공합니다. 지금 바로 신청하세요!',
      type: 'EVENT',
      isPopup: false,
      isPinned: true,
    },
    {
      title: '[점검] 4월 20일 새벽 서버 점검',
      content:
        '4월 20일 오전 2:00~4:00 서버 점검이 예정되어 있습니다. 해당 시간 서비스 이용이 불가합니다.',
      type: 'MAINTENANCE',
      isPopup: false,
      isPinned: false,
    },
    {
      title: '[공지] 개인정보처리방침 업데이트',
      content:
        '2026년 4월 1일부로 개인정보처리방침이 업데이트되었습니다. 주요 변경사항을 확인해주세요.',
      type: 'GENERAL',
      isPopup: false,
      isPinned: false,
    },
    {
      title: '[이벤트] 친구 초대 이벤트',
      content: '친구를 초대하면 양쪽 모두 프리미엄 기능 1개월 무료 이용권을 드립니다!',
      type: 'EVENT',
      isPopup: false,
      isPinned: false,
    },
    {
      title: '[공지] AI 기능 사용량 정책 안내',
      content:
        'AI 이력서 변환 기능의 무료 사용량이 월 10회로 조정됩니다. 더 많은 사용을 원하시면 Pro 플랜을 이용해주세요.',
      type: 'GENERAL',
      isPopup: false,
      isPinned: false,
    },
  ];

  for (const n of notices) {
    const existing = await prisma.notice.findFirst({ where: { title: n.title } });
    if (existing) {
      console.log(`  ↩ 기존 공지: ${n.title}`);
      continue;
    }
    await prisma.notice.create({ data: n });
    console.log(`  ✓ 공지: ${n.title}`);
  }

  // ─── 7. 스터디 그룹 (15개) ───────────────────────────────────────
  const existingUsers = await prisma.user.findMany({
    where: { email: { startsWith: 'sample-' } },
    select: { id: true, email: true, name: true },
  });
  const userByIdx = (i: number) => existingUsers[i % Math.max(1, existingUsers.length)];

  const studyGroupSeeds = [
    {
      name: '네이버 프론트엔드 신입 면접 스터디',
      description: '네이버 FE 신입 공채 대비. 주 2회 모의 면접, CS 기초 + React 심화.',
      companyTier: 'large',
      cafeCategory: 'interview',
      experienceLevel: 'new',
      companyName: '네이버',
      position: '프론트엔드',
      maxMembers: 8,
    },
    {
      name: '카카오 백엔드 코딩테스트 스터디',
      description: '카카오 공채 코테 대비 — 주 3회 프로그래머스 Lv3-5 풀이.',
      companyTier: 'large',
      cafeCategory: 'coding-test',
      experienceLevel: 'junior',
      companyName: '카카오',
      position: '백엔드',
      maxMembers: 10,
    },
    {
      name: '삼성전자 SW역량테스트',
      description: 'SW Expert Academy 기반 주 4회 문제풀이.',
      companyTier: 'large',
      cafeCategory: 'coding-test',
      experienceLevel: 'new',
      companyName: '삼성전자',
      position: '소프트웨어',
      maxMembers: 15,
    },
    {
      name: '한국전력공사 NCS 스터디',
      description: '공기업 NCS + 전공필기 주 2회 모의고사.',
      companyTier: 'public',
      cafeCategory: 'study',
      experienceLevel: 'new',
      companyName: '한국전력공사',
      position: '전산직',
      maxMembers: 12,
    },
    {
      name: '한국수력원자력 인성면접 준비',
      description: '공기업 인성면접·상황면접 기출 모의.',
      companyTier: 'public',
      cafeCategory: 'interview',
      experienceLevel: 'new',
      companyName: '한국수력원자력',
      position: '사무직',
      maxMembers: 8,
    },
    {
      name: '토스 시니어 개발자 네트워킹',
      description: '핀테크 시니어 개발자들의 커피챗·레퍼런스 체크.',
      companyTier: 'startup',
      cafeCategory: 'networking',
      experienceLevel: 'senior',
      companyName: '토스',
      position: '풀스택',
      maxMembers: 20,
    },
    {
      name: '당근마켓 PM 전환 준비',
      description: '개발자→PM 전환 케이스 스터디 + 포트폴리오 리뷰.',
      companyTier: 'startup',
      cafeCategory: 'resume',
      experienceLevel: 'mid',
      companyName: '당근마켓',
      position: 'PM',
      maxMembers: 6,
    },
    {
      name: '배달의민족 디자이너 포트폴리오 리뷰',
      description: '프로덕트 디자이너 포트폴리오 상호 리뷰.',
      companyTier: 'startup',
      cafeCategory: 'resume',
      experienceLevel: 'junior',
      companyName: '배달의민족',
      position: '프로덕트 디자이너',
      maxMembers: 8,
    },
    {
      name: 'AWS Solutions Architect 자격증',
      description: 'SAA-C03 2주 집중 스터디. 모의고사 공유.',
      companyTier: 'etc',
      cafeCategory: 'study',
      experienceLevel: 'any',
      companyName: null,
      position: 'Cloud',
      maxMembers: 20,
    },
    {
      name: '구글 기술면접 System Design',
      description: '영어 면접 + System Design 주 1회 목업.',
      companyTier: 'foreign',
      cafeCategory: 'interview',
      experienceLevel: 'senior',
      companyName: '구글',
      position: '소프트웨어 엔지니어',
      maxMembers: 5,
    },
    {
      name: '스타트업 시니어 이직 준비',
      description: '스타트업 시니어의 이직 전략·연봉 협상·레퍼런스.',
      companyTier: 'startup',
      cafeCategory: 'networking',
      experienceLevel: 'senior',
      companyName: null,
      position: '시니어 개발자',
      maxMembers: 12,
    },
    {
      name: '비전공자 개발자 취업',
      description: '부트캠프 수료 후 첫 취업 준비. 이력서·면접 전반.',
      companyTier: 'etc',
      cafeCategory: 'study',
      experienceLevel: 'new',
      companyName: null,
      position: '주니어 개발자',
      maxMembers: 15,
    },
    {
      name: '육아휴직 후 복귀 스터디',
      description: '장기 공백 후 복귀자를 위한 최신 스택 따라잡기.',
      companyTier: 'etc',
      cafeCategory: 'study',
      experienceLevel: 'mid',
      companyName: null,
      position: '개발자',
      maxMembers: 10,
    },
    {
      name: 'LINE 글로벌 이력서 영문 작성',
      description: '일본/글로벌 지사 대상 영문 이력서 첨삭.',
      companyTier: 'large',
      cafeCategory: 'resume',
      experienceLevel: 'mid',
      companyName: 'LINE',
      position: 'SWE',
      maxMembers: 10,
    },
    {
      name: '현대자동차 SW 공채',
      description: '현대차 SW 아카데미 공채 대비 포트폴리오 리뷰.',
      companyTier: 'large',
      cafeCategory: 'resume',
      experienceLevel: 'new',
      companyName: '현대자동차',
      position: 'SW엔지니어',
      maxMembers: 12,
    },
  ];

  for (let i = 0; i < studyGroupSeeds.length; i++) {
    const s = studyGroupSeeds[i];
    const owner = userByIdx(i);
    if (!owner) break;
    const existing = await prisma.studyGroup.findFirst({ where: { name: s.name } });
    if (existing) {
      console.log(`  ↩ 기존 스터디: ${s.name}`);
      continue;
    }
    const group = await prisma.studyGroup.create({
      data: {
        ...s,
        ownerId: owner.id,
        isPrivate: false,
        memberCount: 1,
      },
    });
    await prisma.studyGroupMember.create({
      data: { groupId: group.id, userId: owner.id, role: 'owner' },
    });
    // 추가 멤버 2-5명 랜덤 가입
    const joinCount = Math.min(Math.floor(Math.random() * 4) + 2, Math.max(0, s.maxMembers - 1));
    const extras = existingUsers.filter((u) => u.id !== owner.id).slice(0, joinCount);
    for (const u of extras) {
      await prisma.studyGroupMember.create({
        data: { groupId: group.id, userId: u.id, role: 'member' },
      });
    }
    await prisma.studyGroup.update({
      where: { id: group.id },
      data: { memberCount: 1 + extras.length },
    });
    console.log(`  ✓ 스터디: ${s.name} (멤버 ${1 + extras.length})`);
  }

  // ─── 8. 면접 예상 질문 (20개+) ────────────────────────────────────
  const questions = [
    {
      c: '네이버',
      p: '프론트엔드',
      q: 'React의 Virtual DOM 동작 원리를 설명하세요.',
      a: 'Virtual DOM 은 실제 DOM 의 가벼운 복제본으로...',
    },
    {
      c: '네이버',
      p: '프론트엔드',
      q: 'CSS-in-JS 대 Tailwind 의 장단점은?',
      a: '런타임 vs 빌드타임, 번들 사이즈...',
    },
    {
      c: '카카오',
      p: '백엔드',
      q: 'Kafka 와 Redis Pub/Sub 의 차이는?',
      a: '영속성·순서 보장·파티셔닝 관점에서...',
    },
    {
      c: '카카오',
      p: '백엔드',
      q: 'N+1 쿼리 문제와 해결 방법',
      a: 'JPA fetch join, @EntityGraph, batch size...',
    },
    {
      c: '토스',
      p: '풀스택',
      q: '금융 트랜잭션 격리 수준을 어떻게 선택하나요?',
      a: 'Read Committed vs Repeatable Read...',
    },
    {
      c: '토스',
      p: '풀스택',
      q: '분산 트랜잭션 처리 전략은?',
      a: 'SAGA 패턴, 2PC, 보상 트랜잭션...',
    },
    {
      c: '당근마켓',
      p: 'PM',
      q: '지역 기반 서비스 핵심 지표는?',
      a: 'DAU/MAU, 동네별 활성 유저, 매칭 전환...',
    },
    {
      c: '배달의민족',
      p: '디자이너',
      q: '음식 사진 퀄리티 가이드라인을 어떻게 관리?',
      a: '사진 검수 프로세스, 업주 교육...',
    },
    {
      c: '쿠팡',
      p: '백엔드',
      q: 'AWS 에서 고가용성 아키텍처 설계',
      a: 'Multi-AZ, ALB, Auto Scaling...',
    },
    {
      c: '라인',
      p: '모바일',
      q: 'Android 앱 콜드 스타트 최적화',
      a: 'DexGuard, App Startup, Baseline Profile...',
    },
    { c: '삼성전자', p: 'SW', q: '본인이 작성한 가장 복잡한 알고리즘은?', a: '...' },
    {
      c: '현대자동차',
      p: 'SW엔지니어',
      q: '차량 소프트웨어의 안전성은 어떻게 검증?',
      a: 'ISO 26262, MISRA, 자율주행 시뮬레이션...',
    },
    {
      c: '한국전력공사',
      p: '전산직',
      q: '공기업을 지원한 동기는?',
      a: '사회적 책임·안정성 관점...',
    },
    {
      c: '한국수력원자력',
      p: '사무직',
      q: '원전 안전성 논란에 대한 본인의 생각은?',
      a: '과학적 근거와 사회적 합의...',
    },
    { c: '구글', p: 'SWE', q: 'Design a URL shortener.', a: 'Hash, base62, read-heavy, TTL...' },
    {
      c: '페이스북',
      p: 'SWE',
      q: 'Design Instagram feed.',
      a: 'Push vs Pull, ranking, timeline cache...',
    },
    {
      c: 'AWS',
      p: '클라우드',
      q: 'VPC 피어링과 Transit Gateway 의 차이?',
      a: '스케일·라우팅·비용 트레이드오프...',
    },
    {
      c: '우아한형제들',
      p: '개발자',
      q: '주문 트래픽 피크에 어떻게 대응?',
      a: 'Queue 기반 비동기, 읽기 분리...',
    },
    {
      c: '컬리',
      p: '데이터',
      q: '신선식품 수요 예측 모델 어떻게 설계?',
      a: '시계열 + 계절성 + 프로모션 feature...',
    },
    {
      c: '요기요',
      p: '백엔드',
      q: '실시간 주문 매칭을 어떻게 구현?',
      a: 'Redis Sorted Set + 배치 매칭...',
    },
    {
      c: '스타트업',
      p: '주니어 개발자',
      q: '본인의 강점 한 가지를 프로젝트로 증명해보세요.',
      a: '...',
    },
    {
      c: '비전공자',
      p: '주니어 개발자',
      q: '부트캠프에서 배운 것을 실무에 어떻게 적용?',
      a: '...',
    },
  ];

  for (const q of questions) {
    const exists = await prisma.jobInterviewQuestion.findFirst({
      where: { question: q.q, companyName: q.c },
    });
    if (exists) continue;
    const author = userByIdx(Math.floor(Math.random() * existingUsers.length));
    if (!author) continue;
    await prisma.jobInterviewQuestion.create({
      data: {
        companyName: q.c,
        position: q.p,
        question: q.q,
        sampleAnswer: q.a,
        source: 'sample',
        isApproved: Math.random() > 0.3,
        isRejected: false,
        upvotes: Math.floor(Math.random() * 20),
        authorId: author.id,
      },
    });
  }
  console.log(`  ✓ 면접 질문 ${questions.length}개`);

  // ─── 9. 커뮤니티 게시글 (15개) ────────────────────────────────────
  const posts = [
    {
      t: '[후기] 네이버 FE 최종 합격! 준비 과정 공유합니다',
      c: '긴 여정 끝에 네이버 프론트엔드 신입 공채 최종 합격했습니다. React + TypeScript 집중, 알고리즘 1일 3문제, 도메인 공부...',
      cat: 'interview',
    },
    {
      t: '[후기] 카카오 3년차 이직 후기',
      c: '카카오 백엔드로 이직하며 느낀 점. 기술면접 3회 + 인성 1회, 코테는 상대적으로 쉬웠습니다.',
      cat: 'interview',
    },
    {
      t: '[팁] 공기업 NCS 한 달 컷',
      c: 'NCS 직업기초능력 50문제 80% 이상 맞히는 전략. 의사소통·수리·문제해결 집중...',
      cat: 'tips',
    },
    {
      t: '[팁] 이력서 한 장 룰, 필요할까?',
      c: '주니어는 한 장, 시니어는 두 장까지 OK. 폰트 10pt, 여백 15mm 이상 권장...',
      cat: 'tips',
    },
    {
      t: '[팁] 연봉 협상 스크립트 5가지',
      c: '현재 연봉 공개 시점, 오퍼 비교, 거절 후 재협상까지 실전 스크립트...',
      cat: 'tips',
    },
    {
      t: '[자유] 개발자 이직 몇 번이 적당?',
      c: '스킬 확장 vs 한 곳 오래의 장단점. 3년 주기설 vs 2년 주기설...',
      cat: 'free',
    },
    {
      t: '[자유] 저는 영어 때문에 글로벌 포기합니다',
      c: '면접에서 영어 질문 들어오자마자 머릿속 하얘짐. 영어 준비 루틴 공유 부탁...',
      cat: 'free',
    },
    {
      t: '[질문] 풀스택 개발자는 현실적으로 가능한가?',
      c: '프론트/백엔드 모두 숙련도 유지가 어려운데 5년차 이상 현업자분들 조언 부탁...',
      cat: 'qna',
    },
    {
      t: '[질문] 대기업 vs 유니콘 스타트업',
      c: '네이버 오퍼 vs B라운드 유니콘 오퍼. 연봉·스톡·주거비 고려하면?',
      cat: 'qna',
    },
    {
      t: '[질문] CS 공부는 언제까지?',
      c: '주니어 개발자인데 CS 기초를 언제까지 복습해야 할지 감이 안 옵니다.',
      cat: 'qna',
    },
    {
      t: '[이력서] 경력 3년차 풀스택 피드백 부탁드립니다',
      c: '링크 첨부. 특히 프로젝트 섹션의 성과 정량화가 약한 것 같아 고민 중입니다.',
      cat: 'resume',
    },
    {
      t: '[이력서] 6년차 시니어 — 이직용 이력서',
      c: 'Next.js + Node 시니어. 팀 리딩 경험을 어떻게 녹일지 고민...',
      cat: 'resume',
    },
    {
      t: '[공지] 이력서공방 v2.1 업데이트 공지',
      c: '새 창의 기능 8개 추가 — 이력서 오디오 요약, Career DNA, JD 매칭기...',
      cat: 'notice',
    },
    {
      t: '[자유] 번아웃 극복 노하우',
      c: '개발 10년차에 번아웃 왔습니다. 다른 분들 회복 루틴 궁금해요.',
      cat: 'free',
    },
    {
      t: '[팁] GitHub 프로필 README 꾸미기',
      c: 'Activity Graph + Wakatime + 언어 통계 + 최근 블로그 글 자동 연동...',
      cat: 'tips',
    },
  ];

  for (const p of posts) {
    const exists = await prisma.communityPost.findFirst({ where: { title: p.t } });
    if (exists) continue;
    const author = userByIdx(Math.floor(Math.random() * existingUsers.length));
    if (!author) continue;
    await prisma.communityPost.create({
      data: {
        title: p.t,
        content: p.c,
        category: p.cat,
        user: { connect: { id: author.id } },
        viewCount: Math.floor(Math.random() * 500),
        likeCount: Math.floor(Math.random() * 50),
      },
    });
  }
  console.log(`  ✓ 커뮤니티 게시글 ${posts.length}개`);

  // ─── 10. 코치 프로필 (6명) ───────────────────────────────────────
  const coachSpecs = [
    {
      specialty: '이력서 첨삭',
      rate: 40000,
      yrs: 7,
      bio: '대기업·스타트업 면접관 경험 10회+. 프론트엔드/백엔드 이력서 첨삭 전문.',
    },
    {
      specialty: '면접 코칭',
      rate: 60000,
      yrs: 10,
      bio: '네이버·카카오 기술면접관. 실전 모의면접 + 즉석 피드백.',
    },
    {
      specialty: '커리어 상담',
      rate: 50000,
      yrs: 12,
      bio: '개발자→PM→CTO 커리어 전환 경험. 장기 커리어 설계 상담.',
    },
    {
      specialty: '포트폴리오',
      rate: 45000,
      yrs: 6,
      bio: '디자이너·PM 포트폴리오 리뷰 300+건. 스토리텔링 특화.',
    },
    {
      specialty: '자기소개서',
      rate: 30000,
      yrs: 5,
      bio: '대기업 합격 자소서 컨설팅. 첨삭 + 구조 설계.',
    },
    {
      specialty: '연봉 협상',
      rate: 70000,
      yrs: 15,
      bio: '헤드헌터 출신. 오퍼 비교 · 네고 스크립트 코칭.',
    },
  ];
  for (let i = 0; i < coachSpecs.length; i++) {
    const c = coachSpecs[i];
    const user = userByIdx(i);
    if (!user) break;
    const existing = await prisma.coachProfile.findUnique({ where: { userId: user.id } });
    if (existing) continue;
    await prisma.user.update({ where: { id: user.id }, data: { userType: 'coach' } });
    await prisma.coachProfile.create({
      data: {
        userId: user.id,
        specialty: c.specialty,
        bio: c.bio,
        hourlyRate: c.rate,
        yearsExp: c.yrs,
        languages: 'ko,en',
        availableHours: JSON.stringify({
          mon: '19:00-22:00',
          wed: '19:00-22:00',
          sat: '10:00-18:00',
        }),
        totalSessions: Math.floor(Math.random() * 50),
        avgRating: 4.0 + Math.random() * 1.0,
        isActive: true,
      },
    });
    console.log(`  ✓ 코치: ${user.name} — ${c.specialty}`);
  }

  // ─── 10b. 스터디 그룹 게시판 샘플 포스트 ───────────────────────────
  const allGroups = await prisma.studyGroup.findMany({
    select: { id: true, name: true, ownerId: true },
    take: 30,
  });

  const postTemplates = [
    {
      category: 'notice',
      title: '[필독] 이번 주 스터디 진행 일정',
      content:
        '안녕하세요 스터디장입니다.\n이번 주 수요일 오후 8시에 온라인 미팅이 있습니다. Zoom 링크는 당일 공유드릴게요.\n- 주제: 자기소개 3분 스피치\n- 준비물: 본인 이력서 1부',
    },
    {
      category: 'question',
      title: '면접에서 가장 자주 나왔던 질문 공유해주세요',
      content:
        '실제 경험한 기술/인성 질문 중에서 압박감 있었던 것 위주로 댓글 남겨주시면 감사하겠습니다!',
    },
    {
      category: 'resource',
      title: '[자료] 2026 상반기 채용 대비 CS 정리 PDF',
      content:
        'OS·자료구조·네트워크 핵심만 60페이지로 정리했습니다. 필요하신 분 자료실에서 다운로드하세요.\n링크: https://example.com/cs-summary.pdf',
    },
    {
      category: 'study-log',
      title: 'Day 12 — 알고리즘 DP 집중',
      content:
        '오늘 푼 문제\n- 백준 1463 1로 만들기 ✅\n- 프로그래머스 정수 삼각형 ✅\n- LeetCode 322 Coin Change (재시도 필요)\n\n내일은 DP 심화로 LIS/LCS 집중.',
    },
    {
      category: 'free',
      title: '면접 전날 긴장 푸는 루틴 공유',
      content:
        '저는 커피 줄이고 가벼운 산책 + 9시 취침으로 컨디션 맞춥니다. 여러분은 어떻게 하시나요?',
    },
    {
      category: 'question',
      title: 'Java vs Kotlin 백엔드 선택 고민',
      content:
        '신규 서비스 백엔드로 Spring Boot 기반 Java/Kotlin 중 고민 중입니다. 실무 선택 기준 조언 부탁드려요.',
    },
    {
      category: 'resource',
      title: '[자료] 자기소개서 4대 항목 샘플 10건',
      content:
        '대기업 합격 자소서 샘플 정리. 성장과정·지원동기·성격·포부 순으로 구성.\n링크: https://example.com/cover-letter-samples',
    },
    {
      category: 'free',
      title: '합격 후기! 드디어 최종 합격했습니다 🎉',
      content: '3개월간 스터디하며 함께해주신 분들 감사합니다. 다음 분도 곧 좋은 소식 있으시길!',
    },
    {
      category: 'study-log',
      title: 'Day 5 — 모의면접 녹화 피드백',
      content: '녹화 영상을 보니 습관적 "음..." 을 너무 많이 씀. 다음 주엔 의식적으로 줄이기 목표.',
    },
    {
      category: 'question',
      title: '포트폴리오 GitHub 스타 개수 중요한가요?',
      content: '주니어 채용에서 GitHub Star/Fork 실제 가중치가 있을지 궁금합니다.',
    },
    {
      category: 'resource',
      title: '[자료] 최신 채용공고 키워드 분석 스프레드시트',
      content: '최근 한 달간 네카라쿠배 등 JD 200건에서 가장 자주 등장한 키워드 TOP 50.',
    },
    {
      category: 'free',
      title: '스터디원 맥주 한잔 오프라인 번개 (선택참여)',
      content: '다음 금요일 강남역 7시, 참여 원하시는 분 댓글 부탁드려요. (강요 아님)',
    },
  ];

  let seedPostCount = 0;
  for (const group of allGroups) {
    // 그룹당 3~6개 포스트 생성
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const tpl = postTemplates[Math.floor(Math.random() * postTemplates.length)];
      const authorId =
        Math.random() > 0.3
          ? group.ownerId
          : userByIdx(Math.floor(Math.random() * existingUsers.length))?.id;
      if (!authorId) continue;
      // 고유 제목 — 그룹명 + 인덱스 suffix 로 중복 방지
      const title = `${tpl.title}`;
      const exists = await prisma.studyGroupPost.findFirst({
        where: { groupId: group.id, title },
      });
      if (exists) continue;
      await prisma.studyGroupPost.create({
        data: {
          group: { connect: { id: group.id } },
          user: { connect: { id: authorId } },
          title,
          content: tpl.content,
          category: tpl.category,
          isPinned: tpl.category === 'notice' && i === 0,
          viewCount: Math.floor(Math.random() * 200),
          likeCount: Math.floor(Math.random() * 30),
          commentCount: Math.floor(Math.random() * 10),
        },
      });
      seedPostCount++;
    }
  }
  console.log(`  ✓ 스터디 게시글 ${seedPostCount}개`);

  // ─── 11. SystemConfig 초기값 ─────────────────────────────────────
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
  console.log(
    `   유저: ${sampleUsers.length}명, 이력서: ${resumeTemplates.length}개, 채용공고: ${jobPosts.length}개`,
  );
  console.log(
    `   스카우트: ${scoutMessages.length}개, 배너: ${banners.length}개, 공지: ${notices.length}개`,
  );
  console.log(
    `   스터디: ${studyGroupSeeds.length}개, 면접질문: ${questions.length}개, 커뮤니티: ${posts.length}개, 코치: ${coachSpecs.length}명`,
  );
}

main()
  .catch((e) => {
    console.error('❌ 시드 실패:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
