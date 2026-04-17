/**
 * 추가 외부 채용 링크 시드
 * 실행: npx tsx scripts/seed-external-links-extra.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const EXTRA_LINKS = [
  // ── 주요 채용 포털 ──
  { name: '잡코리아', url: 'https://www.jobkorea.co.kr/', logoEmoji: '💼', badgeText: '종합채용', description: '대한민국 대표 취업 포털', category: 'portal', gradientFrom: '#3b82f6', gradientTo: '#6366f1' },
  { name: '사람인', url: 'https://www.saramin.co.kr/', logoEmoji: '🔍', badgeText: '종합채용', description: '사람인 - 취업, 채용, 인재채용', category: 'portal', gradientFrom: '#10b981', gradientTo: '#059669' },
  { name: '원티드', url: 'https://www.wanted.co.kr/', logoEmoji: '🎯', badgeText: 'IT특화', description: 'IT/스타트업 채용 플랫폼, 합격보상금', category: 'portal', gradientFrom: '#6366f1', gradientTo: '#8b5cf6' },
  { name: '인크루트', url: 'https://www.incruit.com/', logoEmoji: '📋', badgeText: '종합채용', description: '대기업/중소기업 채용 공고', category: 'portal', gradientFrom: '#f59e0b', gradientTo: '#d97706' },
  { name: '캐치', url: 'https://www.catch.co.kr/', logoEmoji: '🎓', badgeText: '신입특화', description: '대학생/신입 취업 플랫폼', category: 'portal', gradientFrom: '#ec4899', gradientTo: '#be185d' },
  { name: '로켓펀치', url: 'https://www.rocketpunch.com/', logoEmoji: '🚀', badgeText: '스타트업', description: '스타트업/벤처 채용 네트워크', category: 'portal', gradientFrom: '#ef4444', gradientTo: '#dc2626' },
  { name: '프로그래머스', url: 'https://career.programmers.co.kr/', logoEmoji: '💻', badgeText: '개발자', description: '개발자 코딩테스트 기반 채용', category: 'portal', gradientFrom: '#8b5cf6', gradientTo: '#7c3aed' },
  { name: 'LinkedIn Jobs (Korea)', url: 'https://www.linkedin.com/jobs/search/?location=South%20Korea', logoEmoji: '🌐', badgeText: '글로벌', description: '글로벌 프로페셔널 네트워크 채용', category: 'portal', gradientFrom: '#0077b5', gradientTo: '#005885' },

  // ── IT / 스타트업 ──
  { name: '넥슨 채용', url: 'https://career.nexon.com/', logoEmoji: '🎮', badgeText: '게임', description: '넥슨 게임 개발직 채용', category: 'it', gradientFrom: '#3b82f6', gradientTo: '#1d4ed8' },
  { name: '크래프톤 채용', url: 'https://recruit.krafton.com/', logoEmoji: '🎯', badgeText: '게임', description: 'PUBG 개발사 크래프톤', category: 'it', gradientFrom: '#1e293b', gradientTo: '#334155' },
  { name: '엔씨소프트 채용', url: 'https://careers.ncsoft.com/', logoEmoji: '⚔️', badgeText: '게임', description: '리니지 개발사 엔씨소프트', category: 'it', gradientFrom: '#dc2626', gradientTo: '#b91c1c' },
  { name: '넷마블 채용', url: 'https://career.netmarble.com/', logoEmoji: '🎲', badgeText: '게임', description: '모바일 게임 글로벌 기업', category: 'it', gradientFrom: '#7c3aed', gradientTo: '#6d28d9' },
  { name: '무신사 채용', url: 'https://www.musinsacareers.com/ko/home', logoEmoji: '👕', badgeText: '커머스', description: '패션 커머스 플랫폼', category: 'it', gradientFrom: '#1e293b', gradientTo: '#475569' },
  { name: '야놀자 채용', url: 'https://careers.yanolja.co/', logoEmoji: '🏨', badgeText: '여행', description: '글로벌 여행 테크 플랫폼', category: 'it', gradientFrom: '#ef4444', gradientTo: '#f97316' },
  { name: '직방 채용', url: 'https://career.zigbang.com/', logoEmoji: '🏠', badgeText: '프롭테크', description: '부동산 AI 플랫폼', category: 'it', gradientFrom: '#3b82f6', gradientTo: '#2563eb' },
  { name: '리디 채용', url: 'https://ridi.recruit.roundhr.com', logoEmoji: '📚', badgeText: '콘텐츠', description: '디지털 콘텐츠 플랫폼', category: 'it', gradientFrom: '#6366f1', gradientTo: '#4f46e5' },
  { name: '하이브 채용', url: 'https://hybecorp.com/kor/careers', logoEmoji: '🎵', badgeText: '엔터', description: 'K-POP 글로벌 엔터테인먼트', category: 'it', gradientFrom: '#1e293b', gradientTo: '#334155' },
  { name: '카카오뱅크 채용', url: 'https://www.kakaobank.com/careers', logoEmoji: '🏦', badgeText: '핀테크', description: '인터넷 전문 은행', category: 'it', gradientFrom: '#fbbf24', gradientTo: '#f59e0b' },
  { name: '라인플러스 채용', url: 'https://careers.linecorp.com/ko/jobs', logoEmoji: '💬', badgeText: 'IT', description: 'LINE 메신저 개발', category: 'it', gradientFrom: '#22c55e', gradientTo: '#16a34a' },
  { name: '마켓컬리 채용', url: 'https://www.kurly.com/careers', logoEmoji: '🥬', badgeText: '커머스', description: '신선식품 새벽배송', category: 'it', gradientFrom: '#7c3aed', gradientTo: '#5b21b6' },
];

async function main() {
  console.log('🌱 추가 외부 채용 링크 시드...');

  let created = 0, skipped = 0;
  for (const link of EXTRA_LINKS) {
    const existing = await prisma.externalJobLink.findFirst({ where: { url: link.url } });
    if (existing) { skipped++; continue; }
    await prisma.externalJobLink.create({
      data: {
        name: link.name,
        url: link.url,
        logoEmoji: link.logoEmoji,
        badgeText: link.badgeText,
        description: link.description,
        category: link.category,
        gradientFrom: link.gradientFrom,
        gradientTo: link.gradientTo,
        companySize: 'all',
        careerLevel: 'all',
        isActive: true,
      },
    });
    created++;
  }

  console.log(`  ✅ ${created}개 추가, ${skipped}개 중복 건너뜀`);
  const total = await prisma.externalJobLink.count();
  console.log(`  📊 전체 외부 링크: ${total}개`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
