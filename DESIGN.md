---
name: 이력서공방 (Resume Workshop)
description: 한국어 AI 기반 이력서·커리어 관리 플랫폼의 Impeccable 디자인 시스템
colors:
  signal-blue: '#2563eb'
  signal-blue-soft: '#eff6ff'
  coastal-cyan: '#06b6d4'
  deep-sapphire: '#0c4a6e'
  paper-white: '#ffffff'
  slate-50: '#f8fafc'
  slate-100: '#f1f5f9'
  slate-200: '#e2e8f0'
  slate-300: '#cbd5e1'
  slate-400: '#94a3b8'
  slate-500: '#64748b'
  slate-600: '#475569'
  slate-700: '#334155'
  slate-800: '#1e293b'
  slate-900: '#0f172a'
  slate-950: '#020617'
  emerald: '#059669'
  amber: '#f59e0b'
  rose: '#ef4444'
  dark-surface: '#0f172a'
  dark-raised: '#1e293b'
  dark-accent: '#60a5fa'
typography:
  display:
    fontFamily: 'system-ui, -apple-system, sans-serif'
    fontSize: 'clamp(1.35rem, 4vw, 3rem)'
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: '-0.02em'
  title:
    fontFamily: 'system-ui, -apple-system, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: '-0.01em'
  body:
    fontFamily: 'system-ui, -apple-system, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: 'system-ui, -apple-system, sans-serif'
    fontSize: '0.8rem'
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace"
    fontSize: '0.85rem'
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '20px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '16px'
  lg: '24px'
components:
  button-primary:
    backgroundColor: '{colors.signal-blue}'
    textColor: '{colors.paper-white}'
    rounded: '{rounded.md}'
    padding: '10px 18px'
    typography: '{typography.label}'
  button-primary-hover:
    backgroundColor: '{colors.deep-sapphire}'
    textColor: '{colors.paper-white}'
  button-ghost:
    backgroundColor: '{colors.paper-white}'
    textColor: '{colors.slate-900}'
    rounded: '{rounded.md}'
    padding: '10px 18px'
  card:
    backgroundColor: '{colors.paper-white}'
    textColor: '{colors.slate-900}'
    rounded: '{rounded.lg}'
    padding: '20px'
  card-hover:
    backgroundColor: '{colors.paper-white}'
    textColor: '{colors.slate-900}'
  input-default:
    backgroundColor: '{colors.paper-white}'
    textColor: '{colors.slate-900}'
    rounded: '{rounded.md}'
    padding: '10px 12px'
  badge-blue:
    backgroundColor: '{colors.signal-blue-soft}'
    textColor: '{colors.deep-sapphire}'
    rounded: '{rounded.sm}'
    padding: '2px 8px'
    typography: '{typography.label}'
---

# Design System: 이력서공방 (Resume Workshop)

## 1. Overview

**Creative North Star: "The Impeccable Standard"**

이력서공방의 화면은 *흠결 없음*을 지향한다. 취업·이직이라는 진지한 순간에 사용자가 기대는 도구이므로, 디자인은 스스로를 내세우지 않고 신뢰감으로 물러선다. 무채색 종이 위에 정제된 잉크, 그리고 꼭 필요한 곳에만 떨어지는 한 점의 파란 신호. 정보가 주인공이고 장식은 조연이다. 밀도는 차분하고, 여백은 의도적이며, 모든 정렬·간격·포커스링이 제자리에 있다.

이 시스템은 흔한 "AI 도구" 미학을 의도적으로 거부한다. purple→blue 그라디언트, 다크 배경 위 네온 cyan, 글래스모피즘, hero-metric 템플릿, 똑같은 카드 격자. 그런 화려함은 신뢰가 아니라 소음을 만든다. 대신 차분한 전문성(calm professionalism)과 현대적 절제(modern restraint)를 택한다. 색은 거의 쓰지 않을수록 강해지고, 그림자는 상태 변화의 응답으로만 나타난다.

한국어가 1차 언어다(영/일 대응). 데스크톱과 모바일 비중이 비슷하고 취업 시즌에 트래픽이 몰리므로, 44px 터치 타깃과 반응형 리듬이 기본 전제다.

**Key Characteristics:**

- slate 중립 종이 + 잉크 베이스에 blue/cyan/sapphire 강조를 소량만.
- 정보 우선, 장식 최소. 카드는 최후의 수단.
- subtle한 그림자, ease-out 모션, bounce/elastic 금지.
- WCAG AA(텍스트 대비 ≥ 4.5:1), `prefers-reduced-motion` 존중.
- purple/violet/pink/magenta 전면 금지.

## 2. Colors

무채색 중립 위에 파란 계열 강조를 절제해 얹는 팔레트. 의미색(emerald/amber/rose)은 상태 표현에만 등장한다.

### Primary

- **Signal Blue** (#2563eb): 유일한 주 강조색. 포커스링, 활성 탭, 1차 버튼, 링크, 선택 상태. 화면의 10% 이하로만 쓴다. 다크 모드에서는 **Dark Accent** (#60a5fa)로 밝아진다.
- **Signal Blue Soft** (#eff6ff): blue 배지·선택 배경 등 강조의 옅은 바탕.

### Secondary

- **Coastal Cyan** (#06b6d4): blue를 보조하는 2차 강조. 데이터 시각화 구분, cyan 배지, 보조 액션. blue와 인접 색조라 함께 써도 충돌하지 않는다.
- **Deep Sapphire** (#0c4a6e): blue 텍스트/아이콘의 짙은 대비 변형. 옅은 파란 배경 위 텍스트, hover 시 1차 버튼의 깊은 톤.

### Neutral

중립 시스템은 **Tailwind `slate` 램프**다. 제품 전반(~10,700개 유틸리티)이 이미 slate로 그려지므로, 이를 공식 단일 중립 체계로 선언한다. 약간 푸른 기가 도는 차가운 그레이 계열로, "차분한 전문성"이라는 North Star와 맞물린다. `--color-*` CSS 토큰들도 이 램프 위의 값으로 매핑되어, 토큰을 쓰든 `slate-*` 유틸리티를 쓰든 같은 중립을 가리킨다.

slate 램프 (light):

- **slate-50** (#f8fafc) / **slate-100** (#f1f5f9): 융기·침강 표면 (`--color-surface-raised` / `--color-surface-sunken`). 기본 표면은 **Paper White** (#ffffff, `--color-surface`).
- **slate-200** (#e2e8f0) / **slate-100** (#f1f5f9): 1px 경계·구분선 (`--color-border` / `--color-border-subtle`). 무거운 구분선은 쓰지 않는다.
- **slate-400** (#94a3b8): 비활성·플레이스홀더 (`--color-text-muted`).
- **slate-500** (#64748b): 보조 텍스트·캡션·메타 (`--color-text-secondary`). 흰 배경 대비 4.76:1로 AA 통과.
- **slate-600~800** (#475569 / #334155 / #1e293b): 제목·강조 텍스트의 짙은 단계.
- **slate-900** (#0f172a): 본문·제목 기본 텍스트 (`--color-text`). 순흑(#000) 대신 한 단계 부드러운 잉크.
- 다크 모드: 표면 slate-900(#0f172a) → slate-800(#1e293b) 융기 / slate-950(#020617) 침강, 텍스트 slate-100(#f1f5f9), 보조 slate-400, 경계 slate-700(#334155).

### Semantic (상태 전용)

- **Emerald** (#059669): 성공·긍정·완료.
- **Amber** (#f59e0b): 주의·경고·확인 필요.
- **Rose** (#ef4444): 오류·위험·삭제.

### Named Rules

**The One Signal Rule.** Signal Blue는 어느 화면에서도 면적의 10% 이하로만 쓴다. 희소함이 곧 신호다. 모든 요소를 파랗게 칠하면 아무것도 강조되지 않는다.

**The No-Purple Rule.** purple·violet·pink·magenta는 전면 금지다. 레거시 `--color-primary: #6366f1`(indigo)는 hue가 violet 쪽으로 기운 드리프트이며, Signal Blue(#2563eb)로 대체·정리 대상이다. 신규 작업에서 indigo 토큰을 쓰지 않는다.

**The Slate-Neutral Rule.** 중립은 단일 램프(Tailwind `slate`)로 통일한다. 순수 #000/#fff 대신 톤다운한 잉크(slate-900 #0f172a)와 푸른 기가 도는 차가운 표면(slate-50/100)으로 눈의 피로를 줄인다. 같은 화면에서 slate 와 순수 그레이(#666/#999 등)를 섞지 않는다 — 토큰(`--color-text*`)과 `slate-*` 유틸리티가 같은 값을 가리키도록 유지한다.

## 3. Typography

**Display/Body Font:** system-ui (with -apple-system, sans-serif)
**Label/Mono Font:** ui-monospace (with SFMono-Regular, 'SF Mono', Menlo)

**Character:** 시스템 폰트를 그대로 쓴다. 한국어 가독성(애플 SD산돌고딕/맑은 고딕 등 OS 기본)을 OS에 위임해 어떤 기기에서도 자연스럽게 읽히게 한다. 폰트 자체로 멋을 내지 않고, 크기·굵기 대비로 위계를 만든다. (이력서 _템플릿_ 미리보기는 예외적으로 `src/lib/resumeThemes.ts`의 테마별 serif/sans 페어링을 따른다.)

### Hierarchy

- **Display** (700, clamp(1.35rem → 3rem), line-height 1.15, letter-spacing -0.02em): 페이지 제목·히어로. 모바일→데스크톱 fluid 스케일.
- **Title** (600, 1.125rem, line-height 1.3): 섹션·카드 제목.
- **Body** (400, 1rem, line-height 1.6): 본문. 가독 길이는 65–75ch로 제한.
- **Label** (500, 0.8rem): 버튼·배지·메타·폼 라벨.
- **Mono** (400, 0.85rem): 수치·코드·키워드 토큰 표시.

### Named Rules

**The Scale-and-Weight Rule.** 위계는 색이 아니라 크기와 굵기 대비(단계 간 ≥1.25 비율)로 만든다. 같은 크기에 색만 다른 "납작한" 위계를 금지한다.

## 4. Elevation

기본은 평면이다. 표면은 정지 상태에서 그림자가 없고, hover·focus·융기 같은 *상태의 응답*으로만 그림자가 떠오른다. 깊이는 주로 표면 톤(paper → raised → sunken)의 단계로 표현하고, 그림자는 보조 수단이다. 그림자는 매우 옅게(불투명도 0.04–0.1) 유지해 "떠 있다"는 느낌만 주고 무게는 주지 않는다.

### Shadow Vocabulary

- **shadow-sm** (`0 1px 2px rgba(0,0,0,0.04)`): 카드·배지의 정지 상태 미세 융기.
- **shadow-md** (`0 2px 8px rgba(0,0,0,0.06)`): 드롭다운·팝오버.
- **shadow-lg** (`0 4px 16px rgba(0,0,0,0.08)`): 다이얼로그·시트.
- **shadow-hover** (`0 8px 24px rgba(0,0,0,0.1)`): 인터랙티브 카드 hover 시 상승.
- 다크 모드는 동일 단계에서 불투명도를 0.5–0.8로 키워 어두운 배경에서도 분리가 보이게 한다.

### Named Rules

**The Flat-By-Default Rule.** 표면은 정지 시 평면이다. 그림자는 상태(hover/elevation/focus)에 대한 응답으로만 등장한다. 장식용 상시 그림자를 금지한다.

## 5. Components

각 컴포넌트는 절제되고 정제된(refined and restrained) 느낌을 공유한다. 과한 테두리·강한 색면 대신 미세한 경계와 톤 차이로 구분한다.

### Buttons

- **Shape:** 부드러운 모서리(12px, `--radius-md`).
- **Primary:** Signal Blue(#2563eb) 배경 + Paper White 텍스트, 패딩 10×18px, 굵기 500.
- **Hover / Active:** hover 시 Deep Sapphire(#0c4a6e)로 깊어지고, active 시 `scale(0.98)`로 눌림. 전환은 `--transition-fast`(150ms, ease-out-quart).
- **Ghost / Secondary:** 투명/흰 배경 + slate-900 텍스트 + 1px slate-200 경계. 보조 액션.

### Chips / Badges

- **Style:** 의미 기반 색쌍만 허용. blue(bg #eff6ff / text #1e40af), cyan(bg #cffafe / text #0e7490), neutral(bg #f1f5f9 / text #334155), green/amber/red.
- **Shape:** 8px(`--radius-sm`), 패딩 2×8px, Label 타이포.
- **State:** 선택/필터 배지는 활성 시 Signal Blue 경계 또는 soft 배경으로 표시.

### Cards / Containers

- **Corner Style:** 16px(`--radius-lg`).
- **Background:** Paper White(다크: slate-900 #0f172a), 침강 영역은 slate-100(다크: slate-950).
- **Shadow Strategy:** 정지 시 shadow-sm, 인터랙티브 카드는 hover 시 shadow-hover + `translateY(-2px)`.
- **Border:** 1px Subtle Border.
- **Internal Padding:** 20px 기준, 밀도에 따라 16–24px.
- 중첩 카드는 금지(절대). 카드 안의 카드는 항상 잘못된 선택이다.

### Inputs / Fields

- **Style:** Paper White 배경 + 1px slate-200 경계 + 12px(`--radius-md`).
- **Focus:** `:focus-visible` 시 Signal Blue 2px outline(테마 프리뷰에서는 활성 테마 accent). glow 대신 또렷한 링.
- **Error:** Rose 경계 + 하단 Rose 메시지.

### Navigation

- **Style:** 무채색 바탕, Label 타이포. 기본 slate-500, hover 시 slate-900, 활성 시 Signal Blue 텍스트 + 하단 인디케이터.
- **Mobile:** 하단 탭 또는 햄버거. 모든 탭 타깃 ≥ 44×44px(`.icon-btn`).

### Signature: 분석 시각화 (Analysis Visualizations)

이력서/JD/자소서 분석 화면의 히어로. 평면 카드 더미 대신 종합 시각화로 요약하고, 상세는 접기로 드릴다운한다.

- **이력서 건강 레이더**: 6축 커스텀 SVG 육각 레이더(정량성·액션동사·구체성·구성완성도·기여명확성·가독성). 등급별 그라디언트, ease-out으로 채워지는 폴리곤.
- **JD 신호등 대시보드**: 7개 분석을 양호/주의/우려/정보없음 신호등 그리드로. 좌측 등급 accent 보더.
- **자소서 흐름 맵 / 점수 링**: 문단별 블록 세그먼트 스트립 + SVG 도넛 종합 점수.
- 모든 색은 `color-mix(in oklab, var(--color-…) N%, transparent)` 토큰 기반. 등급색은 emerald/amber/rose + accent로만.

## 6. Do's and Don'ts

### Do:

- **Do** Signal Blue(#2563eb)를 포커스·활성·1차 강조에만, 화면의 10% 이하로 쓴다 (The One Signal Rule).
- **Do** 중립색은 단일 slate 램프로 통일한다: 텍스트 slate-900(#0f172a), 표면 slate-50/100. 순수 #000/#fff와 순수 그레이(#666/#999)를 피한다.
- **Do** 깊이를 표면 톤 단계(paper→raised→sunken)로 먼저 표현하고 그림자는 상태 응답으로만 쓴다.
- **Do** 위계를 크기·굵기 대비(≥1.25)로 만든다. 본문은 65–75ch.
- **Do** 모든 인터랙티브 요소에 또렷한 `:focus-visible` 링과 ≥44×44px 터치 타깃을 준다.
- **Do** ease-out 곡선(cubic-bezier(0.25,1,0.5,1) / (0.16,1,0.3,1))으로 부드럽게 전환하고 `prefers-reduced-motion`을 존중한다.
- **Do** 의미색(emerald/amber/rose)은 상태 표현에만 쓴다.

### Don't:

- **Don't** purple/violet/pink/magenta를 쓰지 않는다. 레거시 indigo(`--color-primary: #6366f1`)도 신규 작업에서 금지하고 Signal Blue로 대체한다 (The No-Purple Rule).
- **Don't** AI 슬롭 색조합을 쓰지 않는다: cyan-on-dark 네온, purple→blue 그라디언트, 네온 강조.
- **Don't** 글래스모피즘(장식용 blur/glass 카드)을 기본값으로 쓰지 않는다.
- **Don't** `background-clip: text` 그라디언트 텍스트를 쓰지 않는다. 강조는 굵기·크기로.
- **Don't** 1px를 초과하는 색 side-stripe(`border-left/right` 강조 줄)를 카드·알림에 쓰지 않는다. 전체 보더·배경 틴트·선행 아이콘으로 대체한다.
- **Don't** hero-metric 템플릿(큰 숫자+작은 라벨+그라디언트)이나 똑같은 아이콘+제목+텍스트 카드 격자를 반복하지 않는다.
- **Don't** 카드를 중첩하지 않는다. 카드 안의 카드는 항상 틀렸다.
- **Don't** bounce/elastic easing이나 CSS 레이아웃 속성 애니메이션을 쓰지 않는다.
- **Don't** em dash(—)나 `--`를 본문에 쓰지 않는다.
