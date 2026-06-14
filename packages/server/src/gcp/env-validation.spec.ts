import { validateEnv, formatValidationReport } from './env-validation'

const FULL_PROD_ENV: Record<string, string> = {
  DATABASE_URL: 'postgresql://u:p@host:5432/db?sslmode=require',
  JWT_SECRET: 'x'.repeat(40),
  GEMINI_API_KEY: 'gem-key',
  GROQ_API_KEY: 'groq-key',
  GOOGLE_CLIENT_ID: 'gid.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'gsecret',
  CLOUDINARY_CLOUD_NAME: 'cn',
  CLOUDINARY_API_KEY: 'ck',
  CLOUDINARY_API_SECRET: 'cs',
}

describe('validateEnv', () => {
  describe('production', () => {
    it('fully configured env → no errors, all capabilities enabled', () => {
      const r = validateEnv(FULL_PROD_ENV, true)
      expect(r.errors).toHaveLength(0)
      expect(r.summary.gemini).toBe(true)
      expect(r.summary.googleOAuth).toBe(true)
      expect(r.summary.cloudinaryStorage).toBe(true)
      expect(r.summary.llmAnyProvider).toBe(true)
    })

    it('missing DATABASE_URL → hard error', () => {
      const env = { ...FULL_PROD_ENV }
      delete env.DATABASE_URL
      const r = validateEnv(env, true)
      expect(r.errors.some((e) => e.includes('DATABASE_URL'))).toBe(true)
    })

    it('short JWT_SECRET → hard error', () => {
      const r = validateEnv({ ...FULL_PROD_ENV, JWT_SECRET: 'short' }, true)
      expect(r.errors.some((e) => e.includes('JWT_SECRET'))).toBe(true)
    })

    it('no LLM provider at all → hard error', () => {
      const env = { ...FULL_PROD_ENV }
      delete env.GEMINI_API_KEY
      delete env.GROQ_API_KEY
      const r = validateEnv(env, true)
      expect(r.summary.llmAnyProvider).toBe(false)
      expect(r.errors.some((e) => e.includes('No LLM provider'))).toBe(true)
    })

    it('one LLM provider present → no LLM error (graceful)', () => {
      const env = { ...FULL_PROD_ENV }
      delete env.GROQ_API_KEY // gemini remains
      const r = validateEnv(env, true)
      expect(r.summary.llmAnyProvider).toBe(true)
      expect(r.errors.some((e) => e.includes('No LLM provider'))).toBe(false)
    })

    it('missing Google OAuth → warning not error (graceful degradation)', () => {
      const env = { ...FULL_PROD_ENV }
      delete env.GOOGLE_CLIENT_ID
      delete env.GOOGLE_CLIENT_SECRET
      const r = validateEnv(env, true)
      expect(r.errors).toHaveLength(0)
      expect(r.summary.googleOAuth).toBe(false)
      expect(r.warnings.some((w) => w.includes('Google OAuth'))).toBe(true)
    })

    it('missing Cloudinary → warning, storage falls back to DB', () => {
      const env = { ...FULL_PROD_ENV }
      delete env.CLOUDINARY_API_KEY
      const r = validateEnv(env, true)
      expect(r.errors).toHaveLength(0)
      expect(r.summary.cloudinaryStorage).toBe(false)
      expect(r.warnings.some((w) => w.includes('Cloudinary'))).toBe(true)
    })

    it('whitespace-only value treated as missing', () => {
      const r = validateEnv({ ...FULL_PROD_ENV, DATABASE_URL: '   ' }, true)
      expect(r.errors.some((e) => e.includes('DATABASE_URL'))).toBe(true)
    })
  })

  describe('development', () => {
    it('missing required vars → warnings only, no errors', () => {
      const r = validateEnv({}, false)
      expect(r.errors).toHaveLength(0)
      expect(r.warnings.length).toBeGreaterThan(0)
    })
  })
})

describe('formatValidationReport', () => {
  it('error level when there are errors', () => {
    const r = formatValidationReport({
      errors: ['ERR'],
      warnings: [],
      summary: { gemini: true },
    })
    expect(r.level).toBe('error')
    expect(r.lines.some((l) => l.startsWith('ERROR:'))).toBe(true)
    expect(r.lines.some((l) => l.includes('enabled: [gemini]'))).toBe(true)
  })

  it('warn level when only warnings', () => {
    const r = formatValidationReport({
      errors: [],
      warnings: ['be careful'],
      summary: { gemini: false },
    })
    expect(r.level).toBe('warn')
    expect(r.lines.some((l) => l.includes('disabled: [gemini]'))).toBe(true)
  })

  it('log level when clean', () => {
    const r = formatValidationReport({ errors: [], warnings: [], summary: { gemini: true } })
    expect(r.level).toBe('log')
  })
})
