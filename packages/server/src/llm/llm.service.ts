import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ResumesService } from '../resumes/resumes.service';
import { LlmProvider, LlmStreamChunk } from './llm-provider.interface';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { N8nWebhookProvider } from './providers/n8n-webhook.provider';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';
import { TransformResumeDto } from './dto/transform-resume.dto';

const TEMPLATE_PROMPTS: Record<string, string> = {
  standard: `당신은 전문 이력서 작성 전문가입니다. 주어진 이력서 데이터를 깔끔하고 전문적인 한국어 표준 이력서 양식으로 변환해주세요.
- 경력 사항은 최신순으로 정리
- 성과 중심으로 서술 (숫자/지표 포함)
- 간결하고 명확한 문장 사용`,

  'career-description': `당신은 경력기술서 전문가입니다. 주어진 이력서 데이터를 상세한 경력기술서로 변환해주세요.
- 각 프로젝트/업무별 상세 기술
- 담당 역할, 사용 기술, 성과를 구체적으로
- STAR 기법 (Situation, Task, Action, Result) 활용`,

  'cover-letter': `당신은 자기소개서 전문가입니다. 주어진 이력서 데이터를 바탕으로 설득력 있는 자기소개서를 작성해주세요.
- 지원 동기, 성장 과정, 직무 역량, 입사 후 포부 구성
- 구체적인 경험과 성과를 스토리텔링으로 연결`,

  linkedin: `You are a LinkedIn profile optimization expert. Transform the resume data into an engaging LinkedIn-style profile.
- Write a compelling headline and summary
- Use action verbs and quantified achievements
- Professional yet personable tone`,

  english: `You are a professional resume writer. Transform the given resume data into a polished English resume (US format).
- Use reverse chronological order
- Lead with strong action verbs, quantify achievements
- ATS-friendly formatting`,

  developer: `당신은 개발자 이력서 전문가입니다. 주어진 데이터를 개발자에 최적화된 이력서로 변환해주세요.
- 기술 스택을 눈에 띄게 정리
- 프로젝트별 기술적 기여도와 아키텍처 결정 사항 강조
- 코드 리뷰, 성능 개선 등 기술적 성과 수치화`,

  designer: `당신은 디자이너 이력서 전문가입니다. 주어진 데이터를 디자이너에 최적화된 이력서로 변환해주세요.
- 포트폴리오 중심 구성
- 디자인 프로세스와 방법론 강조
- 사용자 리서치, A/B 테스트 등 데이터 기반 결과 포함`,
};

// Max JD length to prevent prompt injection and cost explosion
const MAX_JD_LENGTH = 3000;
const MAX_CUSTOM_PROMPT_LENGTH = 2000;

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly providers: Map<string, LlmProvider> = new Map();
  private readonly defaultProvider: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private resumesService: ResumesService,
    private anthropicProvider: AnthropicProvider,
    private geminiProvider: GeminiProvider,
    private groqProvider: GroqProvider,
    private n8nProvider: N8nWebhookProvider,
    private openAiCompatibleProvider: OpenAiCompatibleProvider,
  ) {
    // Register providers
    if (geminiProvider.isAvailable) this.providers.set('gemini', geminiProvider);
    if (groqProvider.isAvailable) this.providers.set('groq', groqProvider);
    if (anthropicProvider.isAvailable) this.providers.set('anthropic', anthropicProvider);
    if (n8nProvider.isAvailable) this.providers.set('n8n', n8nProvider);
    if (openAiCompatibleProvider.isAvailable)
      this.providers.set('openai-compatible', openAiCompatibleProvider);

    // Default priority: gemini (free) > groq (free) > n8n > openai-compatible > anthropic (paid)
    this.defaultProvider =
      this.config.get<string>('LLM_DEFAULT_PROVIDER') ||
      (geminiProvider.isAvailable
        ? 'gemini'
        : groqProvider.isAvailable
          ? 'groq'
          : n8nProvider.isAvailable
            ? 'n8n'
            : openAiCompatibleProvider.isAvailable
              ? 'openai-compatible'
              : 'anthropic');

    this.logger.log(
      `LLM providers: [${[...this.providers.keys()].join(', ')}] | default: ${this.defaultProvider}`,
    );
  }

  getAvailableProviders() {
    return [...this.providers.entries()].map(([name, provider]) => ({
      name,
      available: provider.isAvailable,
      isDefault: name === this.defaultProvider,
    }));
  }

  async transform(resumeId: string, dto: TransformResumeDto, userId?: string) {
    const resume = await this.resumesService.findOne(resumeId, userId);
    const systemPrompt = this.buildSystemPrompt(dto);
    const userMessage = this.buildUserMessage(resume);

    // 성능 순 자동 fallback (유저 선택 불필요)
    const result = await this.generateWithFallback(systemPrompt, userMessage);

    const transformation = await this.prisma.llmTransformation.create({
      data: {
        resumeId,
        templateType: dto.templateType,
        targetLanguage: dto.targetLanguage || 'ko',
        jobDescription: dto.jobDescription,
        result: JSON.stringify({ text: result.text }),
        tokensUsed: result.tokensUsed,
        model: `${result.provider}/${result.model}`,
      },
    });

    return {
      id: transformation.id,
      text: result.text,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
      createdAt: transformation.createdAt.toISOString(),
    };
  }

  async *transformStream(
    resumeId: string,
    dto: TransformResumeDto,
  ): AsyncGenerator<LlmStreamChunk> {
    const provider = this.getProvider(dto.provider);
    const resume = await this.resumesService.findOne(resumeId);
    const systemPrompt = this.buildSystemPrompt(dto);
    const userMessage = this.buildUserMessage(resume);

    let fullText = '';
    let finalChunk: LlmStreamChunk | null = null;

    for await (const chunk of provider.generateStream(systemPrompt, userMessage)) {
      if (chunk.type === 'delta') {
        fullText += chunk.text || '';
        yield chunk;
      } else if (chunk.type === 'done') {
        finalChunk = chunk;
      }
    }

    const transformation = await this.prisma.llmTransformation.create({
      data: {
        resumeId,
        templateType: dto.templateType,
        targetLanguage: dto.targetLanguage || 'ko',
        jobDescription: dto.jobDescription,
        result: JSON.stringify({ text: fullText }),
        tokensUsed: finalChunk?.tokensUsed || 0,
        model: `${finalChunk?.provider || 'unknown'}/${finalChunk?.model || 'unknown'}`,
      },
    });

    yield {
      type: 'done',
      id: transformation.id,
      tokensUsed: finalChunk?.tokensUsed || 0,
      provider: finalChunk?.provider,
      model: finalChunk?.model,
      createdAt: transformation.createdAt.toISOString(),
    };
  }

  async getTransformationHistory(resumeId: string) {
    const transformations = await this.prisma.llmTransformation.findMany({
      where: { resumeId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return transformations.map((t) => ({
      id: t.id,
      templateType: t.templateType,
      targetLanguage: t.targetLanguage,
      tokensUsed: t.tokensUsed,
      model: t.model,
      createdAt: t.createdAt.toISOString(),
      result: JSON.parse(t.result),
    }));
  }

  /**
   * 비정형 텍스트로부터 이력서 자동 생성
   */
  async autoGenerate(rawText: string, instruction?: string, _provider?: string) {
    const systemPrompt = `당신은 이력서 데이터 파싱 전문가입니다. 사용자가 제공하는 비정형 텍스트(경력 메모, LinkedIn 복사, 이전 이력서, 자유 형식 등)를 분석하여 구조화된 이력서 JSON 데이터를 생성해주세요.

반드시 아래 JSON 형식으로만 응답하세요. 설명이나 마크다운 없이 순수 JSON만 출력하세요.

{
  "title": "이력서 제목",
  "personalInfo": {
    "name": "", "email": "", "phone": "", "address": "", "website": "", "summary": ""
  },
  "experiences": [
    { "company": "", "position": "", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "current": false, "description": "" }
  ],
  "educations": [
    { "school": "", "degree": "", "field": "", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "description": "" }
  ],
  "skills": [
    { "category": "", "items": "" }
  ],
  "projects": [
    { "name": "", "role": "", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "description": "", "link": "" }
  ],
  "certifications": [
    { "name": "", "issuer": "", "issueDate": "YYYY-MM-DD", "expiryDate": "", "credentialId": "", "description": "" }
  ],
  "languages": [
    { "name": "", "testName": "", "score": "", "testDate": "YYYY-MM-DD" }
  ],
  "awards": [
    { "name": "", "issuer": "", "awardDate": "YYYY-MM-DD", "description": "" }
  ],
  "activities": [
    { "name": "", "organization": "", "role": "", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "description": "" }
  ]
}

규칙:
- 텍스트에 없는 정보는 빈 문자열로 두세요
- 해당 섹션에 데이터가 없으면 빈 배열 []로 두세요
- 날짜는 YYYY-MM-DD 형식, 정확하지 않으면 YYYY-MM-01 또는 YYYY-01-01 사용
- 경력의 성과/업무를 description에 줄바꿈으로 구분하여 상세히 작성
- title은 "이름의 이력서" 형식으로 자동 생성`;

    // instruction을 user message에 포함 (system prompt 인젝션 방지)
    let userMessage = rawText;
    if (instruction) {
      userMessage += `\n\n추가 지시사항: ${instruction}`;
    }

    const result = await this.generateWithFallback(systemPrompt, userMessage);

    // JSON 파싱 시도
    let parsed;
    try {
      // LLM 응답에서 JSON 블록 추출
      let jsonText = result.text;
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonText = jsonMatch[0];
      parsed = JSON.parse(jsonText);
    } catch {
      throw new BadRequestException('LLM 응답을 파싱할 수 없습니다. 다시 시도해주세요.');
    }

    return {
      resume: parsed,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  /**
   * 외부 문서(예: 이전 이력서, LinkedIn 복사, 프로젝트 메모) 텍스트로 기존 이력서를 고도화.
   * 원본을 보존하며 누락 정보·성과·기술 스택을 추가/보완하고 설명을 재작성.
   */
  async enhanceWithDocument(
    resumeId: string,
    documentText: string,
    instruction?: string,
    _provider?: string,
  ) {
    const existing = await this.prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        personalInfo: true,
        experiences: true,
        educations: true,
        skills: true,
        projects: true,
        certifications: true,
        languages: true,
        awards: true,
        activities: true,
      },
    });
    if (!existing) throw new BadRequestException('이력서를 찾을 수 없습니다');

    // 관련 테이블 전부 포함한 JSON 직렬화
    const existingJson = JSON.stringify(
      {
        personalInfo: existing.personalInfo,
        experiences: existing.experiences,
        educations: existing.educations,
        skills: existing.skills,
        projects: existing.projects,
        certifications: existing.certifications,
        languages: existing.languages,
        awards: existing.awards,
        activities: existing.activities,
      },
      null,
      0,
    );

    const systemPrompt = `당신은 한국어 이력서 고도화 전문가입니다.
사용자는 이미 작성된 이력서(JSON)와 외부 참고 문서(텍스트)를 제공합니다.
외부 문서의 정보를 활용해 기존 이력서를 "업데이트"하고 "고도화"한 완성 이력서 JSON을 반환하세요.

규칙:
1. 기존 이력서의 모든 항목은 보존 (id 유지). 외부 문서에 정보가 없는 필드는 그대로 둡니다.
2. 외부 문서에 기존에 없던 경력·프로젝트·자격증이 있으면 추가.
3. 같은 항목의 description/achievements 는 외부 문서 정보로 더 구체화·수치화.
4. 개인정보(name/email/phone)는 외부 문서가 더 최신이면 덮어쓰기. 아니면 기존 유지.
5. skills 는 중복 제거 후 합치기.
6. 반드시 JSON 만 출력. 마크다운/설명 없음.

출력 JSON 스키마 (기존 이력서와 동일 — personalInfo/experiences/educations/skills/projects/certifications/languages/awards/activities).

추가로 "changes" 배열 포함: 각 원소는 자연어 한국어 한 문장으로 "어떤 변경을 했는지" 설명.

출력 최상위 형식:
{
  "personalInfo": {...}, "experiences":[...], "educations":[...], "skills":[...],
  "projects":[...], "certifications":[...], "languages":[...], "awards":[...], "activities":[...],
  "changes": ["경력 '네이버'의 성과를 MAU 50만 달성으로 구체화", "자격증 '정보처리기사' 추가"]
}`;

    let userMessage = `[기존 이력서 JSON]\n${existingJson}\n\n[외부 참고 문서]\n${documentText.slice(0, 15000)}`;
    if (instruction) userMessage += `\n\n[추가 지시]\n${instruction.slice(0, 500)}`;

    const result = await this.generateWithFallback(systemPrompt, userMessage);

    let parsed: any;
    try {
      let json = result.text;
      const m = json.match(/\{[\s\S]*\}/);
      if (m) json = m[0];
      parsed = JSON.parse(json);
    } catch {
      throw new BadRequestException(
        'AI 응답 파싱에 실패했습니다. 문서가 너무 길거나 형식이 복잡할 수 있습니다.',
      );
    }

    const changes: string[] = Array.isArray(parsed.changes) ? parsed.changes.slice(0, 30) : [];
    delete parsed.changes;

    return {
      enhanced: parsed,
      changes,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  /**
   * AI 기반 한국어 맞춤법·문체 교정.
   * 정규식 규칙이 잡지 못하는 문맥 의존적 오류(어절 단위, 조사, 맥락상 부자연스러운 표현)를
   * LLM으로 검출·수정하고 구조화된 JSON 을 반환.
   */
  async aiSpellCheck(resumeId: string, provider?: string) {
    const r = await this.prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        personalInfo: true,
        experiences: true,
        projects: true,
        educations: true,
      },
    });
    if (!r) throw new BadRequestException('이력서를 찾을 수 없습니다');

    const sections: Array<{ section: string; text: string }> = [];
    if (r.personalInfo?.summary)
      sections.push({ section: '자기소개', text: r.personalInfo.summary });
    for (const e of r.experiences) {
      if (e.description) sections.push({ section: `경력·${e.company}`, text: e.description });
      if (e.achievements) sections.push({ section: `성과·${e.company}`, text: e.achievements });
    }
    for (const p of r.projects) {
      if (p.description) sections.push({ section: `프로젝트·${p.name}`, text: p.description });
    }

    const input = sections.map((s, i) => `[${i}] (${s.section})\n${s.text}`).join('\n\n');
    if (!input.trim()) {
      return { issues: [], tokensUsed: 0, provider: 'local', model: 'none' };
    }

    const systemPrompt = `당신은 한국어 이력서 맞춤법·문체 교정 전문가입니다.
제공된 섹션별 텍스트에서 맞춤법 오류, 부적절한 조사·어미, 외래어 표기 오류, 이력서에 부적합한 표현을 찾으세요.

반드시 JSON 배열만 출력. 최대 15개. 각 항목:
{
  "section": "섹션명 (예: 자기소개)",
  "wrong": "원문에서 잘못된 부분 (문장 일부, 짧게)",
  "suggestion": "올바른 수정안",
  "reason": "한 문장 설명",
  "severity": "error" | "warning" | "info"
}

규칙:
- 명확한 맞춤법 오류(예: 컨텐츠→콘텐츠, 어플리케이션→애플리케이션)는 "error"
- 부자연스러운 표현·조사·띄어쓰기는 "warning"
- 약한 표현·개선 제안(예: "열심히 했다"→수치화)은 "info"
- 고유명사, 회사명, 기술명, 외국인명은 오류 처리 금지
- HTML 태그(<br>, <p> 등)는 무시`;

    const result = await this.generateWithFallback(systemPrompt, input, provider);

    let issues: any[] = [];
    try {
      let text = result.text;
      const m = text.match(/\[[\s\S]*\]/);
      if (m) text = m[0];
      issues = JSON.parse(text);
      if (!Array.isArray(issues)) issues = [];
      issues = issues
        .slice(0, 20)
        .filter(
          (i) =>
            i &&
            typeof i.wrong === 'string' &&
            typeof i.suggestion === 'string' &&
            typeof i.section === 'string',
        );
    } catch {
      issues = [];
    }

    return {
      issues,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  async getUsageStats() {
    const stats = await this.prisma.llmTransformation.aggregate({
      _sum: { tokensUsed: true },
      _count: true,
    });
    return {
      totalTransformations: stats._count,
      totalTokensUsed: stats._sum.tokensUsed || 0,
    };
  }

  // 무료 프로바이더 성능 순 우선순위 (품질 > 속도)
  // Gemini 2.0 Flash(높은 품질+무료) > Groq Llama 70B(빠른 속도) > OpenRouter > n8n
  private readonly FREE_PROVIDER_PRIORITY = ['gemini', 'groq', 'openai-compatible', 'n8n'];

  private getProvider(providerName?: string): LlmProvider {
    const name = providerName || this.defaultProvider;
    const provider = this.providers.get(name);

    if (!provider) {
      const available = [...this.providers.keys()].join(', ');
      throw new BadRequestException(
        `LLM 프로바이더 '${name}'을 사용할 수 없습니다. 사용 가능: [${available}]. .env 파일의 API 키 설정을 확인해주세요.`,
      );
    }

    return provider;
  }

  /**
   * Rate limit/에러 시 다음 무료 프로바이더로 자동 fallback
   */
  async generateWithFallback(
    systemPrompt: string,
    userMessage: string,
    preferredProvider?: string,
  ): Promise<import('./llm-provider.interface').LlmResponse> {
    const tried = new Set<string>();
    const errors: string[] = [];
    const order = preferredProvider
      ? [preferredProvider, ...this.FREE_PROVIDER_PRIORITY.filter((p) => p !== preferredProvider)]
      : this.FREE_PROVIDER_PRIORITY;

    // 등록된 프로바이더가 없으면 즉시 에러
    if (this.providers.size === 0) {
      throw new BadRequestException(
        'LLM 프로바이더가 설정되지 않았습니다. 관리자에게 API 키 설정을 요청해주세요.',
      );
    }

    for (const name of order) {
      if (tried.has(name)) continue;
      const provider = this.providers.get(name);
      if (!provider) continue;
      tried.add(name);

      try {
        this.logger.log(`LLM: trying ${name} (${tried.size}/${this.providers.size})`);
        return await provider.generate(systemPrompt, userMessage);
      } catch (err: any) {
        const msg = err?.message || String(err);
        errors.push(`${name}: ${msg.substring(0, 150)}`);
        this.logger.warn(`LLM ${name} failed: ${msg.substring(0, 200)}`);
        // 모든 에러에서 다음 프로바이더로 fallback (rate limit 뿐 아니라 일시적 장애도 대응)
      }
    }

    // 모든 프로바이더 실패
    this.logger.error(`All LLM providers failed: ${errors.join(' | ')}`);
    throw new BadRequestException(
      `AI 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요. (${tried.size}개 프로바이더 시도)`,
    );
  }

  private buildSystemPrompt(dto: TransformResumeDto): string {
    let base: string;

    if (dto.templateType === 'custom' && dto.customPrompt) {
      if (dto.customPrompt.length > MAX_CUSTOM_PROMPT_LENGTH) {
        throw new BadRequestException(
          `커스텀 프롬프트는 ${MAX_CUSTOM_PROMPT_LENGTH}자 이내여야 합니다.`,
        );
      }
      base = dto.customPrompt;
    } else {
      base = TEMPLATE_PROMPTS[dto.templateType] || TEMPLATE_PROMPTS['standard'];
    }

    let prompt = base;

    if (dto.targetLanguage === 'en') {
      prompt += '\n\nIMPORTANT: Write the entire output in English.';
    }

    // Prompt injection mitigation: JD is placed in user message, not system prompt
    // System prompt only contains instructions

    prompt +=
      '\n\n응답은 마크다운 형식으로 작성해주세요. 이력서 내용만 출력하고, 부가 설명은 하지 마세요.';

    return prompt;
  }

  private buildUserMessage(resume: any): string {
    const sanitized = JSON.stringify(resume, null, 2);
    return `다음은 변환할 이력서 원본 데이터입니다:\n\n${sanitized}`;
  }

  // ==========================================
  // AI 분석 기능
  // ==========================================

  /** AI 이력서 피드백 (점수 + 강점 + 개선점) */
  async analyzeFeedback(resumeId: string, provider?: string) {
    // 자동 fallback 사용 (provider 무시)
    const resume = await this.resumesService.findOne(resumeId);

    const systemPrompt = `당신은 채용 전문가이자 이력서 컨설턴트입니다. 주어진 이력서를 분석하여 JSON으로 응답해주세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "score": 75,
  "grade": "B+",
  "summary": "전체적인 한줄 평가",
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": ["개선점1", "개선점2", "개선점3"],
  "sectionScores": {
    "personalInfo": {"score": 80, "feedback": "피드백"},
    "experience": {"score": 70, "feedback": "피드백"},
    "education": {"score": 90, "feedback": "피드백"},
    "skills": {"score": 60, "feedback": "피드백"},
    "projects": {"score": 75, "feedback": "피드백"}
  },
  "keywords": ["추천 키워드1", "추천 키워드2"],
  "tips": ["구체적인 개선 팁1", "구체적인 개선 팁2"]
}

점수 기준:
- 90-100: S (완벽한 이력서)
- 80-89: A (우수)
- 70-79: B (양호, 개선 여지 있음)
- 60-69: C (보통, 보완 필요)
- 50 미만: D (대폭 개선 필요)

한국어로 작성하세요.`;

    const result = await this.generateWithFallback(systemPrompt, JSON.stringify(resume, null, 2));

    let parsed;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : result.text);
    } catch {
      throw new BadRequestException('AI 분석 결과를 파싱할 수 없습니다. 다시 시도해주세요.');
    }

    return {
      feedback: parsed,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  /** AI JD 매칭 분석 */
  async analyzeJobMatch(resumeId: string, jobDescription: string, provider?: string) {
    if (!jobDescription || jobDescription.length < 20) {
      throw new BadRequestException('채용공고(JD)를 20자 이상 입력해주세요.');
    }
    if (jobDescription.length > MAX_JD_LENGTH) {
      throw new BadRequestException(`채용공고는 ${MAX_JD_LENGTH}자 이내여야 합니다.`);
    }

    // 자동 fallback 사용 (provider 무시)
    const resume = await this.resumesService.findOne(resumeId);

    const systemPrompt = `당신은 채용 전문가입니다. 이력서와 채용공고(JD)를 비교 분석하여 JSON으로 응답해주세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "matchScore": 78,
  "matchGrade": "B+",
  "summary": "전체 매칭 한줄 평가",
  "matchedSkills": ["매칭된 스킬1", "매칭된 스킬2"],
  "missingSkills": ["부족한 스킬1", "부족한 스킬2"],
  "matchedExperience": ["매칭된 경험1", "매칭된 경험2"],
  "gaps": ["부족한 경험/자격1", "부족한 경험/자격2"],
  "recommendations": ["이력서 수정 제안1", "이력서 수정 제안2"],
  "coverLetterPoints": ["자소서에 강조할 포인트1", "자소서에 강조할 포인트2"],
  "interviewPrep": ["면접에서 어필할 포인트1", "면접에서 어필할 포인트2"]
}

한국어로 작성하세요.`;

    const userMessage = `[이력서]\n${JSON.stringify(resume, null, 2)}\n\n[채용공고(JD)]\n${jobDescription}`;
    const result = await this.generateWithFallback(systemPrompt, userMessage);

    let parsed;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : result.text);
    } catch {
      throw new BadRequestException('AI 분석 결과를 파싱할 수 없습니다.');
    }

    return {
      analysis: parsed,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  /** AI 면접 질문 생성 */
  async generateInterviewQuestions(
    resumeId: string,
    jobRole?: string,
    provider?: string,
    jobDescription?: string,
    difficulty?: string,
  ) {
    const resume = await this.resumesService.findOne(resumeId);

    const roleContext = jobRole ? `지원 직무: ${jobRole}\n` : '';
    const jdContext = jobDescription
      ? `\n채용공고/자격요건:\n${jobDescription.slice(0, 2000)}\n\n위 채용공고의 요구사항에 맞춤화된 질문을 생성하세요.\n`
      : '';
    const diffContext =
      difficulty === 'beginner'
        ? '신입/주니어 수준의 기초적인 질문을 생성하세요.\n'
        : difficulty === 'advanced'
          ? '시니어/리드 수준의 심화 질문을 생성하세요.\n'
          : '';

    const systemPrompt = `당신은 기술 면접관입니다. 이력서를 분석하여 예상 면접 질문과 모범 답변을 JSON으로 생성해주세요.
${roleContext}${jdContext}${diffContext}
반드시 아래 JSON 형식으로만 응답하세요:
{
  "questions": [
    {
      "category": "경험/프로젝트",
      "question": "면접 질문",
      "intent": "면접관이 이 질문을 하는 의도",
      "sampleAnswer": "이력서 기반 모범 답변 (300자 이내)",
      "tips": "답변 시 주의할 점"
    }
  ]
}

카테고리: 자기소개, 경험/프로젝트, 기술역량, 문제해결, 리더십/협업, 성장/학습, 인성/가치관
총 8-10개 질문을 생성하세요.
한국어로 작성하세요.`;

    const result = await this.generateWithFallback(systemPrompt, JSON.stringify(resume, null, 2));

    let parsed;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : result.text);
    } catch {
      throw new BadRequestException('AI 분석 결과를 파싱할 수 없습니다.');
    }

    return {
      interview: parsed,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }

  /** AI 인라인 문장 개선 */
  async inlineAssist(text: string, type: string, provider?: string) {
    if (!text || text.trim().length < 2) {
      throw new BadRequestException('개선할 텍스트를 입력해주세요.');
    }
    if (text.length > 2000) {
      throw new BadRequestException('텍스트는 2000자 이내여야 합니다.');
    }

    const prompts: Record<string, string> = {
      improve: `당신은 이력서 작성 전문가입니다. 주어진 문장을 더 전문적이고 임팩트 있게 개선해주세요.
- 능동적인 표현 사용
- 구체적이고 명확한 문장
- 한국어 이력서에 적합한 톤
개선된 문장만 출력하세요. 설명이나 부가 텍스트 없이 결과만 출력하세요.`,
      quantify: `당신은 이력서 컨설턴트입니다. 주어진 문장에서 성과를 수치화하여 개선해주세요.
- 가능한 부분에 숫자/비율/기간 등 정량적 지표 추가
- 예: "성능을 개선했다" → "API 응답 속도를 40% 개선하여 평균 200ms → 120ms로 단축"
- 원래 내용의 의미를 유지하면서 수치를 자연스럽게 추가
개선된 문장만 출력하세요. 설명 없이 결과만 출력하세요.`,
      concise: `당신은 이력서 편집 전문가입니다. 주어진 문장을 간결하게 줄여주세요.
- 불필요한 수식어 제거
- 핵심 내용만 남기기
- 의미는 유지하면서 분량 30-50% 축소
간결하게 개선된 문장만 출력하세요. 설명 없이 결과만 출력하세요.`,
      english: `You are a professional resume translator. Translate the given Korean text into polished, professional English suitable for an international resume.
- Use strong action verbs
- Keep it concise and impactful
- ATS-friendly language
Output only the translated text. No explanations.`,
    };

    const systemPrompt = prompts[type] || prompts.improve;
    const result = await this.generateWithFallback(systemPrompt, text, provider);

    return {
      original: text,
      improved: result.text.trim(),
      type,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      model: result.model,
    };
  }
}
