/**
 * Boot-time environment validation for GCP / Cloud Run production.
 *
 * Pure functions (no Nest/process coupling) so they can be unit-tested in
 * isolation. `validateEnv` is called once from `main.ts` at bootstrap.
 *
 * Philosophy (matches the app's "prefer free Gemini, degrade gracefully" design):
 * - REQUIRED vars: if missing in production, throw with a clear, actionable message.
 * - OPTIONAL providers: if missing, emit a warning and let the app degrade
 *   gracefully (the LLM layer already falls back across providers, and storage
 *   falls back from Cloudinary to the DB).
 *
 * In production, Cloud Run should source secrets from Secret Manager
 * (`--set-secrets` / `--update-secrets`), never hardcoded. See docs/DEPLOYMENT.md.
 */

export interface EnvSource {
  [key: string]: string | undefined;
}

export interface EnvValidationResult {
  /** Hard failures — required vars missing (only enforced in production). */
  errors: string[];
  /** Soft warnings — optional/degraded capabilities. */
  warnings: string[];
  /** Human-readable summary of which capabilities are enabled. */
  summary: Record<string, boolean>;
}

/** A var that must be present in production or boot fails. */
interface RequiredVar {
  key: string;
  hint: string;
  /** Optional extra predicate (e.g. min length). Returns an error string if invalid. */
  validate?: (value: string) => string | null;
}

/** A capability that degrades gracefully when its vars are absent. */
interface OptionalCapability {
  /** Capability label used in `summary`. */
  name: string;
  /** All listed keys must be present for the capability to be "enabled". */
  keys: string[];
  /** Warning shown when the capability is disabled. */
  disabledHint: string;
}

const REQUIRED_IN_PROD: RequiredVar[] = [
  {
    key: 'DATABASE_URL',
    hint: 'Neon PostgreSQL connection string (sslmode=require). Source from Secret Manager on Cloud Run.',
  },
  {
    key: 'JWT_SECRET',
    hint: 'Random string, 32+ chars. Source from Secret Manager on Cloud Run.',
    validate: (v) =>
      v.length < 32 ? 'JWT_SECRET must be at least 32 characters in production.' : null,
  },
];

/**
 * LLM providers — at least ONE must be available in production, but no single
 * one is mandatory (the app prefers free Gemini and falls back). We surface a
 * warning per-missing-key and a hard error only if ALL are absent.
 */
const LLM_PROVIDER_KEYS = [
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_COMPATIBLE_URL',
  'N8N_WEBHOOK_URL',
] as const;

const OPTIONAL_CAPABILITIES: OptionalCapability[] = [
  {
    name: 'gemini',
    keys: ['GEMINI_API_KEY'],
    disabledHint:
      'GEMINI_API_KEY not set — the default free LLM provider is unavailable; the app will fall back to other providers if configured. Get a key at https://aistudio.google.com/apikey',
  },
  {
    name: 'googleOAuth',
    keys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    disabledHint:
      'Google OAuth disabled (GOOGLE_CLIENT_ID/SECRET missing) — "Sign in with Google" will be hidden.',
  },
  {
    name: 'cloudinaryStorage',
    keys: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
    disabledHint:
      'Cloudinary storage disabled (CLOUDINARY_* missing) — file attachments fall back to the database. Set the Cloudinary bucket vars for production-grade storage.',
  },
];

function has(env: EnvSource, key: string): boolean {
  const v = env[key];
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Validate the environment. Pure: does not read `process.env` directly nor exit.
 *
 * @param env       the environment map (pass `process.env`)
 * @param isProd    whether to enforce production-required vars as hard errors
 */
export function validateEnv(env: EnvSource, isProd: boolean): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const summary: Record<string, boolean> = {};

  // Required vars (hard errors only in production).
  for (const req of REQUIRED_IN_PROD) {
    if (!has(env, req.key)) {
      const msg = `Missing required env var ${req.key} — ${req.hint}`;
      if (isProd) errors.push(msg);
      else warnings.push(msg);
      continue;
    }
    if (req.validate) {
      const problem = req.validate(env[req.key] as string);
      if (problem) {
        if (isProd) errors.push(problem);
        else warnings.push(problem);
      }
    }
  }

  // At least one LLM provider must be configured in production.
  const availableLlm = LLM_PROVIDER_KEYS.filter((k) => has(env, k));
  summary.llmAnyProvider = availableLlm.length > 0;
  if (availableLlm.length === 0) {
    const msg =
      'No LLM provider configured — set at least one of ' +
      `${LLM_PROVIDER_KEYS.join(', ')}. The app prefers free GEMINI_API_KEY.`;
    if (isProd) errors.push(msg);
    else warnings.push(msg);
  }

  // Optional capabilities — graceful degradation with a warning.
  for (const cap of OPTIONAL_CAPABILITIES) {
    const enabled = cap.keys.every((k) => has(env, k));
    summary[cap.name] = enabled;
    if (!enabled) warnings.push(cap.disabledHint);
  }

  return { errors, warnings, summary };
}

/**
 * Format the validation result into log-ready lines. Returned rather than logged
 * so the caller controls the logger (and so it stays pure/testable).
 */
export function formatValidationReport(result: EnvValidationResult): {
  level: 'error' | 'warn' | 'log';
  lines: string[];
} {
  const lines: string[] = [];
  const enabled = Object.entries(result.summary)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const disabled = Object.entries(result.summary)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  lines.push(`GCP capabilities enabled: [${enabled.join(', ') || 'none'}]`);
  if (disabled.length) lines.push(`GCP capabilities disabled: [${disabled.join(', ')}]`);
  for (const w of result.warnings) lines.push(`WARN: ${w}`);
  for (const e of result.errors) lines.push(`ERROR: ${e}`);

  const level = result.errors.length ? 'error' : result.warnings.length ? 'warn' : 'log';
  return { level, lines };
}
