/**
 * Storybook 공용 fixture — 분석 컴포넌트가 요구하는 충분히 긴 한국어 텍스트.
 * 실제 이력서 톤을 모사하고, 수치/액션동사/STAR 패턴/경력 공백 등을 포함.
 */

export const richResumeText = `
저는 6년차 백엔드 개발자입니다. 2018년 3월부터 2021년 7월까지 ABC 컴퍼니에서
Node.js 기반 결제 시스템을 설계·개발하였고, 일 평균 트랜잭션 12만건을 안정적으로
처리하는 인프라를 구축하여 응답 지연을 38% 감소시켰습니다.

2022년 5월부터 2024년 12월까지 XYZ 스튜디오에서 Tech Lead 로 7명 규모의 팀을
리딩하며, Kubernetes 기반 마이크로서비스 마이그레이션을 주도해 배포 빈도를 주
2회에서 일 3회로 향상시켰습니다. 정량적 KPI 로 장애 복구 시간(MTTR) 을 평균
42분에서 8분으로 단축하고, AWS 비용을 월 18% 절감했습니다.

기술 스택: TypeScript, NestJS, PostgreSQL, Redis, Kafka, Docker, Kubernetes,
Terraform, GitHub Actions. 사용자 1만명 규모의 서비스에서 시스템 안정성 99.95%
SLA 를 달성한 경험이 있으며, AWS Certified Solutions Architect 자격을 보유하고
있습니다.

문제 해결과 협업을 좋아하고, 팀의 성장을 돕는 멘토링에 보람을 느낍니다.
신규 입사자 8명을 1:1 페어링으로 온보딩하여 평균 첫 PR 머지 기간을 14일에서
5일로 단축한 경험이 있습니다.
`.trim()

export const shortText = '짧은 텍스트라 분석 결과가 없습니다.'

export const longTextWithGaps = `
2010년 3월 ~ 2013년 12월 한국대학교 컴퓨터공학 학사 졸업.
2014년 1월 ~ 2016년 6월 첫 직장 알파테크 백엔드 주니어. Java 기반 사내 시스템 유지보수.
2017년 10월 ~ 2020년 2월 베타솔루션 미드레벨. Python 기반 데이터 파이프라인 구축.
2021년 7월 ~ 2024년 1월 감마랩스 시니어. 클라우드 마이그레이션 리드.

수치적 성과: 처리 속도 3.2배 향상, 비용 27% 절감, 코드 커버리지 92% 달성.
사용 기술은 다음과 같습니다: AWS, Docker, Kubernetes, PostgreSQL.
`.trim()
