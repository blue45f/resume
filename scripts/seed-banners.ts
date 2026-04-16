/**
 * 배너 샘플 데이터 시드 스크립트
 * 실행: npx ts-node -r tsconfig-paths/register scripts/seed-banners.ts
 * 또는: npx tsx scripts/seed-banners.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎨 배너 샘플 데이터 생성 중...');

  // 1. 커뮤니티 게시글 샘플 생성 (배너에서 링크할 용도)
  const samplePosts = [
    {
      title: '📌 [필독] 이력서 작성 완전 가이드 2026 — 면접관이 말하는 합격 이력서의 조건',
      content: `## 이력서, 이렇게 쓰면 합격합니다

> 현직 채용 담당자 100명이 뽑은 실전 가이드

### 1. 첫 줄이 전부다

이력서는 **평균 6~10초** 안에 첫 인상이 결정됩니다. 상단에 가장 강력한 경험을 배치하세요.

\`\`\`
❌ 나쁜 예: "성실하고 책임감 있는 지원자"
✅ 좋은 예: "3년간 B2B SaaS 영업팀 리드, 연간 매출 120% 달성"
\`\`\`

### 2. 숫자로 증명하라

모든 성과는 수치화하세요.

- ~~"프로젝트 기여"~~ → **"사용자 이탈률 23% 감소 프로젝트 주도"**
- ~~"매출 향상"~~ → **"QoQ 매출 18% 성장 기여"**
- ~~"팀워크"~~ → **"12인 크로스펑셔널 팀 애자일 운영"**

### 3. ATS 최적화 필수

채용 AI(ATS)를 통과해야 사람 눈에 닿습니다. 공고의 **핵심 키워드를 그대로** 사용하세요.

---

더 자세한 내용은 댓글로 질문해 주세요! 💬`,
      category: 'tips',
    },
    {
      title: '🔥 면접 단골 질문 TOP 20 — 실전 답변 예시 모음 (2026 최신)',
      content: `## 면접관이 반드시 묻는 질문들

모든 직군에서 공통으로 나오는 **필수 질문 20가지**와 합격자들의 실제 답변 패턴을 정리했습니다.

### STAR 기법이란?

**S**ituation → **T**ask → **A**ction → **R**esult

경험 기반 질문에는 항상 이 구조로 답하세요.

### Q1. "1분 자기소개를 해주세요"

> 포인트: 강점 2개 + 직무 연결 + 입사 의지

\`\`\`
"저는 [직무 핵심 역량]에 강점이 있는 [이름]입니다.
[경험 1]를 통해 [성과]를 달성했고,
[경험 2]에서 [스킬]을 키웠습니다.
이 역량을 [회사명]에서 [기여 방향]으로 발휘하고 싶습니다."
\`\`\`

### Q2. "지원 동기가 무엇인가요?"

회사 리서치 → 나의 경험 → 기여 포인트 순서로 연결하세요.

---

**💡 팁:** 답변을 암기하지 말고 *키워드*만 기억하세요. 자연스러움이 최고입니다.`,
      category: 'tips',
    },
    {
      title: '💰 직종별 연봉 협상 가이드 — "얼마 원하세요?" 에 이렇게 답하세요',
      content: `## 연봉 협상, 두려워하지 마세요

연봉 협상은 **준비한 사람이 이깁니다**.

### 시장 조사 먼저

- 잡코리아·사람인 연봉 데이터 확인
- LinkedIn Salary Insights 활용
- 동일 직군 커뮤니티에서 리서치

### 제시 타이밍

- ❌ 1차 면접에서 먼저 말하지 말 것
- ✅ 최종 합격 직후가 최고의 타이밍

### 실전 멘트

> *"시장 조사를 해보니 비슷한 경력의 포지션이 X~Y만원 범위더라고요. 저는 [구체적 성과] 경험이 있어서 Y 수준을 생각하고 있습니다만, 전체 보상 패키지를 고려해서 논의하고 싶습니다."*

### 복리후생도 협상 대상!

연봉 외에도 협상할 수 있는 것들:
- 사이닝 보너스
- 스톡옵션
- 재택/유연근무
- 교육비 지원

---

본인 직종의 연봉 정보가 궁금하시면 댓글에 직종을 남겨주세요!`,
      category: 'free',
    },
  ];

  const createdPosts: string[] = [];

  for (const post of samplePosts) {
    // 이미 있으면 건너뜀
    const existing = await prisma.communityPost.findFirst({
      where: { title: post.title },
    });

    if (existing) {
      console.log(`  ⏭ 이미 존재: ${post.title.slice(0, 40)}...`);
      createdPosts.push(existing.id);
    } else {
      const created = await prisma.communityPost.create({
        data: {
          title: post.title,
          content: post.content,
          category: post.category,
          isPinned: true,
          viewCount: Math.floor(Math.random() * 800) + 200,
          likeCount: Math.floor(Math.random() * 50) + 10,
        },
      });
      console.log(`  ✅ 게시글 생성: ${created.id}`);
      createdPosts.push(created.id);
    }
  }

  // 2. 배너 샘플 생성
  const banners = [
    {
      title: '📌 이력서 완전 가이드 2026',
      subtitle: '면접관이 말하는 합격 이력서의 조건 — 지금 바로 확인하세요',
      bgColor: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
      linkUrl: createdPosts[0] ? `/community/${createdPosts[0]}` : '/community',
      order: 0,
      isActive: true,
    },
    {
      title: '🔥 면접 단골 질문 TOP 20',
      subtitle: '2026 최신 버전 — 실전 답변 예시와 함께 완벽 준비하기',
      bgColor: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      linkUrl: createdPosts[1] ? `/community/${createdPosts[1]}` : '/community',
      order: 1,
      isActive: true,
    },
    {
      title: '💰 연봉 협상 실전 가이드',
      subtitle: '"얼마 원하세요?" — 준비된 자만이 원하는 연봉을 받습니다',
      bgColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      linkUrl: createdPosts[2] ? `/community/${createdPosts[2]}` : '/community',
      order: 2,
      isActive: true,
    },
    {
      title: '✨ AI로 이력서 완성하기',
      subtitle: '5분 만에 전문가 수준 이력서 — 이력서공방의 AI가 함께합니다',
      bgColor: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      linkUrl: '/resumes/new',
      order: 3,
      isActive: true,
    },
  ];

  for (const banner of banners) {
    const existing = await prisma.banner.findFirst({
      where: { title: banner.title },
    });

    if (existing) {
      await prisma.banner.update({ where: { id: existing.id }, data: banner });
      console.log(`  ✅ 배너 업데이트: ${banner.title.slice(0, 30)}`);
    } else {
      await prisma.banner.create({ data: { ...banner, subtitle: banner.subtitle } });
      console.log(`  ✅ 배너 생성: ${banner.title.slice(0, 30)}`);
    }
  }

  console.log('\n🎉 완료! 배너와 커뮤니티 게시글이 연결되었습니다.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
