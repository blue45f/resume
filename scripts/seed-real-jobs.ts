/**
 * 실제 채용 공고 데이터 시드 스크립트
 * 실행: npx tsx scripts/seed-real-jobs.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const REAL_JOBS = [
  // ── 대기업 ──
  { company: '삼성전자', position: '2026 상반기 신입 공채 (SW/HW)', sourceUrl: 'https://www.samsungcareers.com/', sourceSite: '삼성커리어스', jobType: 'full_time', experienceLevel: 'entry', industry: 'electronics', companySize: 'large', location: '서울/수원', skills: 'Java, Python, C++, AI/ML, 반도체', summary: '삼성전자 및 18개 계열사 대규모 신입 채용. GSAT 포함.' },
  { company: '현대자동차그룹', position: '미래모빌리티 SW 엔지니어', sourceUrl: 'https://talent.hyundai.com/', sourceSite: '현대자동차 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'automotive', companySize: 'large', location: '서울/화성', skills: 'C++, ROS, 자율주행, 임베디드, AI', summary: '자율주행/전기차 소프트웨어 개발. 171개 포지션 모집.' },
  { company: 'SK하이닉스', position: 'AI 반도체 설계 엔지니어', sourceUrl: 'https://recruit.skhynix.com/', sourceSite: 'SK하이닉스 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'semiconductor', companySize: 'large', location: '이천/청주', skills: 'HBM, DRAM, 반도체 설계, Verilog', summary: 'HBM/AI 메모리 반도체 연구 및 설계.' },
  { company: 'LG전자', position: '2026 상반기 경력사원 수시채용', sourceUrl: 'https://careers.lg.com/', sourceSite: 'LG Careers', jobType: 'full_time', experienceLevel: 'mid', industry: 'electronics', companySize: 'large', location: '서울/평택', skills: 'AI, IoT, 임베디드, Python, C++', summary: 'LG전자 전 사업부 경력 채용.' },
  { company: '포스코그룹', position: '2026 상반기 신입/경력 채용', sourceUrl: 'https://recruit.posco.com/', sourceSite: '포스코 채용', jobType: 'full_time', experienceLevel: 'entry', industry: 'manufacturing', companySize: 'large', location: '서울/포항', skills: '공학, IT, 경영, 데이터분석', summary: '포스코그룹 신입 및 경력 대규모 채용.' },
  { company: '한국전력공사', position: '2026 상반기 신입사원 공개채용', sourceUrl: 'https://recruit.kepco.co.kr/', sourceSite: 'KEPCO 채용', jobType: 'full_time', experienceLevel: 'entry', industry: 'energy', companySize: 'large', location: '나주/서울', skills: '전기, 토목, IT, 경영', summary: '한전 공개채용. NCS 기반 필기시험.' },

  // ── IT 대기업 ──
  { company: '네이버', position: 'Backend Engineer (검색/AI)', sourceUrl: 'https://recruit.navercorp.com/', sourceSite: '네이버 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'tech', companySize: 'large', location: '성남 분당', skills: 'Java, Kotlin, Spring, Kubernetes, AI/ML', summary: '네이버 검색/AI 서비스 백엔드 개발.' },
  { company: '카카오', position: 'Frontend Developer (React)', sourceUrl: 'https://careers.kakao.com/jobs', sourceSite: '카카오 영입', jobType: 'full_time', experienceLevel: 'mid', industry: 'tech', companySize: 'large', location: '성남 판교', skills: 'React, TypeScript, Next.js, GraphQL', summary: '카카오 서비스 프론트엔드 개발.' },
  { company: '쿠팡', position: 'Software Development Engineer', sourceUrl: 'https://www.coupang.jobs/', sourceSite: '쿠팡 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'ecommerce', companySize: 'large', location: '서울 송파', skills: 'Java, Spring, AWS, MSA, Kafka', summary: '쿠팡 커머스 플랫폼 개발.' },
  { company: '배달의민족 (우아한형제들)', position: 'Server Developer', sourceUrl: 'https://career.woowahan.com/', sourceSite: '우아한형제들 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'tech', companySize: 'large', location: '서울 송파', skills: 'Java, Kotlin, Spring, JPA, Kafka', summary: '배민 서비스 서버 개발.' },
  { company: '토스 (비바리퍼블리카)', position: 'Server Developer (Kotlin)', sourceUrl: 'https://toss.im/career/jobs', sourceSite: 'Toss Careers', jobType: 'full_time', experienceLevel: 'mid', industry: 'fintech', companySize: 'large', location: '서울 강남', skills: 'Kotlin, Spring, gRPC, AWS', summary: '토스 금융 서비스 서버 개발.' },
  { company: '당근', position: 'Product Designer', sourceUrl: 'https://team.daangn.com/jobs/', sourceSite: '당근 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'tech', companySize: 'mid', location: '서울 서초', skills: 'Figma, UX Research, Design System', summary: '당근 프로덕트 디자인.' },
  { company: '라인플러스', position: 'Server-Side Engineer', sourceUrl: 'https://careers.linecorp.com/ko/jobs', sourceSite: 'LINE Careers', jobType: 'full_time', experienceLevel: 'mid', industry: 'tech', companySize: 'large', location: '성남 분당', skills: 'Java, Spring, Redis, Kafka', summary: 'LINE 메신저 서버 개발.' },

  // ── 게임 ──
  { company: '넥슨', position: 'Game Client Programmer', sourceUrl: 'https://career.nexon.com/', sourceSite: '넥슨 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'gaming', companySize: 'large', location: '서울 강남', skills: 'C++, Unity, Unreal Engine', summary: '넥슨 게임 클라이언트 프로그래밍.' },
  { company: '크래프톤', position: 'Game Server Engineer', sourceUrl: 'https://recruit.krafton.com/', sourceSite: 'KRAFTON', jobType: 'full_time', experienceLevel: 'mid', industry: 'gaming', companySize: 'large', location: '성남 분당', skills: 'C++, Go, Unreal Engine, AWS', summary: 'PUBG 등 글로벌 게임 서버 개발.' },
  { company: '엔씨소프트', position: 'AI Research Engineer', sourceUrl: 'https://careers.ncsoft.com/', sourceSite: 'NC Careers', jobType: 'full_time', experienceLevel: 'mid', industry: 'gaming', companySize: 'large', location: '성남 판교', skills: 'Python, PyTorch, NLP, Computer Vision', summary: '게임 AI 및 NPC 인공지능 연구.' },
  { company: '넷마블', position: 'Server Developer', sourceUrl: 'https://career.netmarble.com/', sourceSite: '넷마블 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'gaming', companySize: 'large', location: '서울 구로', skills: 'C#, .NET, Redis, MySQL', summary: '모바일 게임 서버 개발.' },

  // ── 스타트업 / 중견기업 ──
  { company: '무신사', position: 'Backend Developer (Java)', sourceUrl: 'https://www.musinsacareers.com/ko/home', sourceSite: '무신사 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'ecommerce', companySize: 'mid', location: '서울 성동', skills: 'Java, Spring, Kotlin, MSA, Kubernetes', summary: '패션 커머스 플랫폼 백엔드 개발.' },
  { company: '야놀자', position: 'Software Engineer (Full Stack)', sourceUrl: 'https://careers.yanolja.co/', sourceSite: '야놀자 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'travel', companySize: 'mid', location: '서울 강남', skills: 'React, Node.js, TypeScript, AWS', summary: '글로벌 여행 플랫폼 풀스택 개발.' },
  { company: '직방', position: 'Frontend Engineer (React)', sourceUrl: 'https://career.zigbang.com/', sourceSite: '직방 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'proptech', companySize: 'mid', location: '서울 서초', skills: 'React, TypeScript, Next.js', summary: '부동산 플랫폼 프론트엔드 개발.' },
  { company: '리디', position: 'Web Frontend Engineer', sourceUrl: 'https://ridi.recruit.roundhr.com', sourceSite: '리디 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'contents', companySize: 'mid', location: '서울 강남', skills: 'React, TypeScript, Next.js, GraphQL', summary: '콘텐츠 플랫폼 웹 프론트엔드 개발.' },
  { company: '마켓컬리', position: 'Data Engineer', sourceUrl: 'https://www.kurly.com/careers', sourceSite: '컬리 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'ecommerce', companySize: 'mid', location: '서울 송파', skills: 'Python, Spark, Airflow, AWS, SQL', summary: '신선식품 커머스 데이터 엔지니어링.' },
  { company: '하이브', position: 'Platform Engineer', sourceUrl: 'https://hybecorp.com/kor/careers', sourceSite: 'HYBE 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'entertainment', companySize: 'mid', location: '서울 용산', skills: 'Java, Kotlin, Kubernetes, AWS', summary: 'K-POP 글로벌 플랫폼 개발.' },
  { company: '카카오뱅크', position: 'iOS Developer', sourceUrl: 'https://www.kakaobank.com/careers', sourceSite: '카카오뱅크 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'fintech', companySize: 'mid', location: '성남 판교', skills: 'Swift, SwiftUI, Combine, RxSwift', summary: '모바일 금융 앱 iOS 개발.' },
  { company: '카카오페이', position: 'Backend Developer', sourceUrl: 'https://kakaopay.recruiter.co.kr/', sourceSite: '카카오페이 채용', jobType: 'full_time', experienceLevel: 'mid', industry: 'fintech', companySize: 'mid', location: '성남 판교', skills: 'Java, Spring, Kotlin, MSA', summary: '간편결제 서비스 백엔드 개발.' },

  // ── 공공기관 ──
  { company: '한국도로공사', position: '2026년 신입직원 공개채용', sourceUrl: 'https://recruit.ex.co.kr/', sourceSite: '도로공사 채용', jobType: 'full_time', experienceLevel: 'entry', industry: 'public', companySize: 'large', location: '김천/서울', skills: '토목, 전기, IT, 행정', summary: '한국도로공사 신입 공개채용.' },
  { company: 'LH 한국토지주택공사', position: '2026년 체험형 인턴 채용', sourceUrl: 'https://apply.lh.or.kr/', sourceSite: 'LH 채용', jobType: 'intern', experienceLevel: 'entry', industry: 'public', companySize: 'large', location: '진주/서울', skills: '건축, 토목, 행정, IT', summary: 'LH 체험형 인턴 채용.' },
  { company: '고용노동부', position: '2026년 공무원 9급 공채', sourceUrl: 'https://gosi.kr/', sourceSite: '고시넷', jobType: 'full_time', experienceLevel: 'entry', industry: 'public', companySize: 'large', location: '전국', skills: '행정학, 법학, 경제학', summary: '9급 공무원 공개경쟁채용시험.' },
];

async function main() {
  console.log('🌱 실제 채용 공고 시드 시작...');

  // 기존 CuratedJob 삭제
  const deleted = await prisma.curatedJob.deleteMany({});
  console.log(`  ❌ 기존 ${deleted.count}개 삭제`);

  // 새 데이터 삽입
  let created = 0;
  for (const job of REAL_JOBS) {
    await prisma.curatedJob.create({
      data: {
        company: job.company,
        position: job.position,
        sourceUrl: job.sourceUrl,
        sourceSite: job.sourceSite,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        industry: job.industry,
        companySize: job.companySize,
        location: job.location,
        skills: job.skills,
        summary: job.summary,
        status: 'active',
      },
    });
    created++;
  }

  console.log(`  ✅ ${created}개 실제 채용 공고 생성 완료`);
  console.log('🎉 시드 완료!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
