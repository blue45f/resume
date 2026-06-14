/**
 * Additive, NON-FATAL Zod environment validation.
 *
 * This complements the GCP boot validation in `../gcp/env-validation.ts` (which
 * remains the source of truth for hard, fail-fast requirements in production).
 * Here we only *observe* the environment with a permissive Zod schema and emit
 * structured warnings — we never throw and never call `process.exit`. The goal
 * is early visibility into misconfiguration without ever breaking a live boot.
 *
 * Two checks:
 *  1. `schema.safeParse(process.env)` — shape/format sanity (all optional).
 *  2. Known *unsafe default* secrets in production — if a deploy ships with a
 *     placeholder secret (e.g. "change-me-in-production"), we emit a LOUD
 *     warning so it is impossible to miss in logs.
 */

import { z } from 'zod'

/**
 * Permissive env schema. Everything is optional so a partial/dev environment
 * never produces hard failures here — required-var enforcement stays in the
 * GCP validator. We validate *format* where it is cheap and useful.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  PORT: z.string().regex(/^\d+$/, 'PORT must be a positive integer').optional(),
  DATABASE_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET should be at least 32 characters').optional(),
  API_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  // LLM providers (all optional — the app degrades across providers).
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_COMPATIBLE_URL: z.string().url().optional(),
  N8N_WEBHOOK_URL: z.string().url().optional(),
  // Optional capabilities.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Secret env vars whose values must never ship to production. The list of
 * unsafe placeholder values matches the known dev/sample defaults used across
 * the standardization fleet plus the placeholder shipped in this repo's
 * `.env.example`.
 */
const SECRET_KEYS = [
  'JWT_SECRET',
  'GOOGLE_CLIENT_SECRET',
  'CLOUDINARY_API_SECRET',
  'ANTHROPIC_API_KEY',
] as const

const UNSAFE_DEFAULTS = new Set(
  [
    'dev-only-change-me-please',
    'dev-secret-change-me',
    'mypassword',
    'change-me-in-production',
    'your-secret-key-min-32-chars',
    'changeme',
    'secret',
  ].map((s) => s.toLowerCase())
)

export interface EnvCheckResult {
  /** Whether the Zod shape check succeeded. */
  ok: boolean
  /** Non-fatal warning lines (format issues + unsafe defaults). */
  warnings: string[]
}

/**
 * Run the additive checks against an env map. Pure: never throws, never exits.
 *
 * @param env     the environment map (pass `process.env`)
 * @param isProd  whether to flag unsafe default secrets as loud warnings
 */
export function checkEnv(env: NodeJS.ProcessEnv, isProd: boolean): EnvCheckResult {
  const warnings: string[] = []

  const parsed = envSchema.safeParse(env)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      warnings.push(`env ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    }
  }

  if (isProd) {
    for (const key of SECRET_KEYS) {
      const value = env[key]
      if (typeof value === 'string' && UNSAFE_DEFAULTS.has(value.trim().toLowerCase())) {
        warnings.push(
          `!!! UNSAFE DEFAULT SECRET in production: ${key} is set to a known placeholder value. ` +
            'Rotate it immediately and source the real secret from your secret manager.'
        )
      }
    }
  }

  return { ok: parsed.success, warnings }
}

/**
 * Boot-time convenience wrapper: runs `checkEnv` and logs warnings via the
 * provided sink (defaults to `console.warn`). NON-FATAL by contract — it will
 * never throw and never exit, so it is always safe to call at startup.
 */
export function reportEnv(
  env: NodeJS.ProcessEnv = process.env,
  isProd: boolean = env.NODE_ENV === 'production',
  warn: (msg: string) => void = (m) => console.warn(m)
): EnvCheckResult {
  const result = checkEnv(env, isProd)
  for (const line of result.warnings) warn(`[env-check] ${line}`)
  return result
}
