import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JobUrlParserService } from './job-url-parser.service';
import { LlmService } from '../llm/llm.service';

describe('JobUrlParserService', () => {
  let service: JobUrlParserService;
  let mockLlm: { generateWithFallback: jest.Mock };
  let mockFetch: jest.Mock;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    mockLlm = { generateWithFallback: jest.fn() };
    mockFetch = jest.fn();
    global.fetch = mockFetch as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [JobUrlParserService, { provide: LlmService, useValue: mockLlm }],
    }).compile();
    service = module.get(JobUrlParserService);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  // 응답 mock 헬퍼 — body.getReader 흉내내기 (parser 가 stream 으로 읽음)
  function mockHtmlResponse(html: string, ok = true, status = 200) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(html);
    let consumed = false;
    mockFetch.mockResolvedValue({
      ok,
      status,
      body: {
        getReader() {
          return {
            async read() {
              if (consumed) return { done: true, value: undefined };
              consumed = true;
              return { done: false, value: bytes };
            },
          };
        },
      },
      text: async () => html,
    });
  }

  describe('validateUrl', () => {
    it('유효하지 않은 URL → BadRequestException', async () => {
      await expect(service.parse('not-a-url')).rejects.toThrow(BadRequestException);
    });

    it('http/https 가 아닌 protocol → BadRequestException', async () => {
      await expect(service.parse('ftp://example.com')).rejects.toThrow(BadRequestException);
    });

    it('localhost / 사설 IP → SSRF 차단', async () => {
      await expect(service.parse('http://localhost:3000/job')).rejects.toThrow(BadRequestException);
      await expect(service.parse('http://127.0.0.1/x')).rejects.toThrow(BadRequestException);
      await expect(service.parse('http://192.168.1.1/x')).rejects.toThrow(BadRequestException);
      await expect(service.parse('http://10.0.0.1/x')).rejects.toThrow(BadRequestException);
    });
  });

  describe('JSON-LD JobPosting 파싱', () => {
    it('표준 JobPosting schema 인식 + 필드 추출', async () => {
      const html = `<html><head>
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "JobPosting",
  "title": "백엔드 엔지니어",
  "description": "<p>Node/Nest 경험자 우대</p>",
  "hiringOrganization": { "@type": "Organization", "name": "이력서공방" },
  "jobLocation": { "address": { "@type": "PostalAddress", "addressLocality": "서울" } },
  "employmentType": "FULL_TIME",
  "experienceRequirements": "3년 이상",
  "skills": ["Node.js", "NestJS", "TypeScript"]
}
</script>
</head><body>본문</body></html>`;
      mockHtmlResponse(html);

      const result = await service.parse('https://example.com/job/1');
      expect(result.source).toBe('json-ld');
      expect(result.title).toBe('백엔드 엔지니어');
      expect(result.company).toBe('이력서공방');
      expect(result.employmentType).toBe('FULL_TIME');
      expect(result.experienceLevel).toBe('3년 이상');
      expect(result.skills).toEqual(['Node.js', 'NestJS', 'TypeScript']);
      expect(result.description).toContain('Node/Nest');
      expect(result.description).not.toContain('<p>'); // HTML 제거
      expect(mockLlm.generateWithFallback).not.toHaveBeenCalled();
    });

    it('@graph 안에 있는 JobPosting 도 인식', async () => {
      const html = `<html><script type="application/ld+json">
{ "@graph": [
  { "@type": "WebSite" },
  { "@type": "JobPosting", "title": "프론트", "hiringOrganization": "ACME" }
] }
</script></html>`;
      mockHtmlResponse(html);

      const result = await service.parse('https://example.com/x');
      expect(result.source).toBe('json-ld');
      expect(result.title).toBe('프론트');
      expect(result.company).toBe('ACME');
    });

    it('JSON-LD parse 실패 → LLM 폴백 시도', async () => {
      const html = `<html><script type="application/ld+json">{invalid}</script>
<meta property="og:title" content="title from OG">
<body>본문 텍스트</body></html>`;
      mockHtmlResponse(html);
      mockLlm.generateWithFallback.mockResolvedValue({
        text: '{"title":"LLM Title","company":"LLM Co","position":"","location":"","employmentType":"","experienceLevel":"","salary":"","skills":[],"description":""}',
      });

      const result = await service.parse('https://example.com/x');
      expect(result.source).toBe('llm');
      expect(result.title).toBe('LLM Title');
      expect(mockLlm.generateWithFallback).toHaveBeenCalled();
    });
  });

  describe('LLM 폴백', () => {
    it('JSON-LD 없음 + LLM 성공 → source=llm', async () => {
      const html = `<html><meta property="og:title" content="공고">
<meta property="og:description" content="설명">
<body>요건 본문</body></html>`;
      mockHtmlResponse(html);
      mockLlm.generateWithFallback.mockResolvedValue({
        text: '{"title":"백엔드","company":"네이버","position":"백엔드","location":"분당","employmentType":"정규직","experienceLevel":"경력 3년","salary":"","skills":["Java","Spring"],"description":"본문"}',
      });

      const result = await service.parse('https://example.com/x');
      expect(result.source).toBe('llm');
      expect(result.title).toBe('백엔드');
      expect(result.company).toBe('네이버');
      expect(result.skills).toEqual(['Java', 'Spring']);
    });

    it('LLM 응답에 ```json``` 마커 → 정상 파싱', async () => {
      const html = '<html></html>';
      mockHtmlResponse(html);
      mockLlm.generateWithFallback.mockResolvedValue({
        text: '```json\n{"title":"ok","company":"","position":"","location":"","employmentType":"","experienceLevel":"","salary":"","skills":[],"description":""}\n```',
      });

      const result = await service.parse('https://example.com/x');
      expect(result.title).toBe('ok');
    });

    it('LLM 실패 → og 정보로 partial 결과 반환 (사용자가 수정 가능)', async () => {
      const html = `<html>
<meta property="og:title" content="공고 OG 제목">
<meta property="og:description" content="공고 OG 설명">
<meta property="og:site_name" content="원티드">
</html>`;
      mockHtmlResponse(html);
      mockLlm.generateWithFallback.mockRejectedValue(new Error('LLM 장애'));

      const result = await service.parse('https://example.com/x');
      expect(result.source).toBe('partial');
      expect(result.title).toBe('공고 OG 제목');
      expect(result.description).toBe('공고 OG 설명');
      expect(result.company).toBe('원티드');
    });
  });

  describe('HTTP 에러', () => {
    it('200 외 응답 → BadRequestException', async () => {
      mockHtmlResponse('', false, 404);
      await expect(service.parse('https://example.com/dead')).rejects.toThrow(BadRequestException);
    });

    it('fetch 자체가 throw → BadRequestException 으로 wrap', async () => {
      mockFetch.mockRejectedValue(new Error('network down'));
      await expect(service.parse('https://example.com/x')).rejects.toThrow(BadRequestException);
    });
  });

  describe('htmlToText', () => {
    it('script/style/comment 제거', async () => {
      const html = `<html><script>alert(1)</script><style>body{}</style>
<!-- comment --><body>본문 <strong>강조</strong></body></html>`;
      mockHtmlResponse(html);
      // 헤더에 og 도 없음 → LLM 호출 → mock 으로 본문 받기
      mockLlm.generateWithFallback.mockImplementation(async (_sys, user) => ({
        text: `{"title":"${user.includes('alert') ? 'leaked' : 'clean'}","company":"","position":"","location":"","employmentType":"","experienceLevel":"","salary":"","skills":[],"description":""}`,
      }));

      const result = await service.parse('https://example.com/x');
      // script 안의 alert(1) 이 본문에 누출되지 않아야 함
      expect(result.title).toBe('clean');
    });
  });
});
