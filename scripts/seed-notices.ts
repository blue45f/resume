/**
 * 공지사항 샘플 데이터 시드 스크립트
 * 실행: npx tsx scripts/seed-notices.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📢 공지사항 샘플 데이터 생성 중...');

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const notices = [
    // GENERAL - 필수 공지
    {
      title: '🎉 이력서공방 2.0 출시 — AI 이력서 생성 기능 전면 업그레이드',
      content: `안녕하세요, 이력서공방 팀입니다.

## 주요 업데이트 내용

### ✨ AI 이력서 생성 2.0
- **다중 LLM 지원**: GPT-4o, Gemini 1.5, Groq Llama 등 최신 AI 모델 선택 가능
- **맞춤형 프롬프트**: 직종별 최적화된 이력서 생성 알고리즘 적용
- **실시간 미리보기**: 작성과 동시에 최종 결과물 확인

### 🎨 디자인 템플릿 확대
- 9가지 새로운 컬러 테마 추가
- 커스텀 색상 직접 설정 기능
- 6가지 폰트 선택 옵션

### 📊 지원 현황 대시보드
- 캘린더/칸반/리스트 뷰 지원
- 취업 성공률 분석 차트
- 월별 지원 트렌드 통계

서비스 이용 중 불편한 점은 언제든지 고객센터로 문의해 주세요.

감사합니다. 🙏`,
      type: 'GENERAL',
      isPopup: false,
      isPinned: true,
      startAt: yesterday,
      endAt: nextMonth,
    },
    // EVENT - 팝업 이벤트
    {
      title: '🎁 [이벤트] 이력서 완성 챌린지 — 상품권 1만원 증정!',
      content: `## 이력서 완성 챌린지 이벤트

**기간**: 2026년 4월 16일 ~ 4월 30일

### 참여 방법

1. 이력서공방에서 이력서를 **100% 완성**하세요 (모든 섹션 입력)
2. 완성된 이력서를 **PDF로 다운로드**하세요
3. 커뮤니티에 **"이력서 완성 후기"** 글을 작성하세요 (category: 성공 후기)
4. 게시글에 **#이력서챌린지** 해시태그 포함

### 경품
- **추첨 10명**: 네이버페이 1만원 상품권
- **참여 전원**: 프리미엄 이력서 템플릿 무료 이용권 1개월

### 발표
- 2026년 5월 2일 이벤트 당첨자 발표 (커뮤니티 공지)

많은 참여 부탁드립니다! 🎊`,
      type: 'EVENT',
      isPopup: true,
      isPinned: true,
      startAt: now,
      endAt: new Date('2026-04-30T23:59:59'),
    },
    // MAINTENANCE - 점검 공지
    {
      title: '🔧 [점검 완료] 서버 정기 점검 안내 — 서비스 정상 운영 중',
      content: `## 서버 점검 완료 안내

안녕하세요, 이력서공방 운영팀입니다.

지난 **4월 15일(화) 새벽 2:00 ~ 4:00** 진행된 정기 서버 점검이 완료되었습니다.

### 점검 내용
- 데이터베이스 성능 최적화
- 보안 패치 적용 (OpenSSL 업데이트)
- 파일 업로드 시스템 안정화
- CDN 캐싱 설정 개선

### 개선 사항
- PDF 생성 속도 **약 40% 향상**
- 이미지 업로드 처리 시간 단축
- 동시 접속자 처리 용량 확대

서비스 이용에 불편을 드려 죄송합니다.
앞으로도 더 나은 서비스를 제공하기 위해 최선을 다하겠습니다.

감사합니다. 🙏`,
      type: 'MAINTENANCE',
      isPopup: false,
      isPinned: false,
      startAt: yesterday,
      endAt: nextWeek,
    },
    // GENERAL - 기능 안내
    {
      title: '📱 커뮤니티 기능 업데이트 — 파일 첨부 및 마크다운 에디터 지원',
      content: `## 커뮤니티 새 기능 안내

### 📎 파일 첨부 기능
이제 커뮤니티 게시글에 파일을 첨부할 수 있습니다!
- **이미지**: JPG, PNG, GIF, WebP (최대 10MB)
- **문서**: PDF, Word (.docx), 텍스트 파일 (최대 20MB)
- 이력서 샘플, 포트폴리오, 참고 자료 등을 첨부해 보세요

### ✏️ 마크다운 에디터
게시글 작성이 한층 편리해졌습니다.
- **굵게**, *기울임*, ~~취소선~~, \`코드\` 등 서식 지원
- 실시간 미리보기 (편집/미리보기 탭 전환)
- 키보드 단축키: Ctrl+B (굵게), Ctrl+I (기울임), Ctrl+K (링크)

### 💡 활용 팁
\`\`\`
## 제목 (H2)
### 소제목 (H3)
> 인용구
- 목록 항목
\`\`\`

더 풍부한 커뮤니티 활동을 즐겨보세요!`,
      type: 'GENERAL',
      isPopup: false,
      isPinned: false,
      startAt: yesterday,
      endAt: nextMonth,
    },
    // EVENT - 봄 이벤트 팝업
    {
      title: '🌸 [봄 특별 이벤트] 취업 성공 후기 작성하고 커피 쿠폰 받자!',
      content: `## 봄맞이 취업 성공 후기 이벤트

취업에 성공하셨나요? 축하드립니다! 🎉

여러분의 소중한 취업 성공 스토리를 공유해 주세요.

### 참여 방법
1. 커뮤니티 **"성공 후기"** 카테고리에 취업 성공 후기 작성
2. 이력서공방을 통해 어떻게 취업에 성공했는지 상세히 작성
3. 이력서 작성 팁, 면접 준비 방법 등 포함 시 추가 점수!

### 선물
- **매주 선정 3명**: 스타벅스 아메리카노 쿠폰 (Tall 사이즈)
- **이달의 베스트 후기 1명**: 스타벅스 케이크 세트

### 기간
**2026년 4월 ~ 5월 31일**

여러분의 경험이 다른 구직자들에게 큰 힘이 됩니다!`,
      type: 'EVENT',
      isPopup: true,
      isPinned: false,
      startAt: now,
      endAt: new Date('2026-05-31T23:59:59'),
    },
  ];

  for (const notice of notices) {
    const existing = await prisma.notice.findFirst({
      where: { title: notice.title },
    });

    if (existing) {
      await prisma.notice.update({ where: { id: existing.id }, data: notice });
      console.log(`  ✅ 공지 업데이트: ${notice.title.slice(0, 40)}...`);
    } else {
      await prisma.notice.create({ data: notice });
      console.log(`  ✅ 공지 생성: [${notice.type}] ${notice.title.slice(0, 35)}...`);
    }
  }

  console.log('\n🎉 공지사항 샘플 데이터 생성 완료!');
  console.log(`  - GENERAL: ${notices.filter(n => n.type === 'GENERAL').length}개`);
  console.log(`  - EVENT: ${notices.filter(n => n.type === 'EVENT').length}개`);
  console.log(`  - MAINTENANCE: ${notices.filter(n => n.type === 'MAINTENANCE').length}개`);
  console.log(`  - 팝업: ${notices.filter(n => n.isPopup).length}개`);
  console.log(`  - 고정: ${notices.filter(n => n.isPinned).length}개`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
