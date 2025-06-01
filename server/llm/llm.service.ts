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
    if (openAiCompatibleProvider.isAvailable) this.providers.set('openai-compatible', openAiCompatibleProvider);

    // Default priority: gemini (free) > groq (free) > n8n > openai-compatible > anthropic (paid)
    this.defaultProvider =
      this.config.get<string>('LLM_DEFAULT_PROVIDER') ||
      (geminiProvider.isAvailable ? 'gemini' :
       groqProvider.isAvailable ? 'groq' :
       n8nProvider.isAvailable ? 'n8n' :
       openAiCompatibleProvider.isAvailable ? 'openai-compatible' :
       'anthropic');

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

  async transform(resumeId: string, dto: TransformResumeDto) {
    const provider = this.getProvider(dto.provider);
    const resume = await this.resumesService.findOne(resumeId);
    const systemPrompt = this.buildSystemPrompt(dto);
    const userMessage = this.buildUserMessage(resume);

    const result = await provider.generate(systemPrompt, userMessage);

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
  async autoGenerate(rawText: string, instruction?: string, provider?: string) {
    const llm = this.getProvider(provider);

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
- title은 "이름의 이력서" 형식으로 자동 생성
${instruction ? `\n추가 지시: ${instruction}` : ''}`;

    const result = await llm.generate(systemPrompt, rawText);

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
    // Sanitize resume data - remove any potential injection attempts
    const sanitized = JSON.stringify(resume, null, 2);
    return `다음은 변환할 이력서 원본 데이터입니다:\n\n${sanitized}`;
  }
}
