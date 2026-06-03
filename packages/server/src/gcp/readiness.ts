/**
 * Pure helpers for assembling a Cloud Run readiness verdict.
 *
 * Cloud Run supports separate startup/liveness probes (cheap, no deps) and
 * readiness checks (verify dependencies). We expose:
 *   - GET /api/health          → liveness (process up, no DB)  [pre-existing]
 *   - GET /api/health/ready    → readiness (cheap DB ping + provider summary)
 *
 * Keeping the verdict logic pure makes it unit-testable and keeps the
 * controller thin.
 */

export interface ReadinessChecks {
  /** Result of a cheap `SELECT 1` against the shared DB. */
  database: boolean;
  /** Whether at least one LLM provider is configured/available. */
  llm: boolean;
}

export interface ReadinessVerdict {
  status: 'ok' | 'degraded' | 'error';
  /** HTTP status to return: 200 when ready, 503 when not. */
  httpStatus: 200 | 503;
  checks: Record<keyof ReadinessChecks, 'ok' | 'error'>;
}

/**
 * Decide readiness from individual checks.
 *
 * - DB down → `error` + 503 (Cloud Run should not route traffic).
 * - DB up but no LLM provider → `degraded` but still 200 (core app works;
 *   AI features degrade gracefully, matching the app's design).
 * - All good → `ok` + 200.
 */
export function evaluateReadiness(checks: ReadinessChecks): ReadinessVerdict {
  const dbState: 'ok' | 'error' = checks.database ? 'ok' : 'error';
  const llmState: 'ok' | 'error' = checks.llm ? 'ok' : 'error';

  if (!checks.database) {
    return {
      status: 'error',
      httpStatus: 503,
      checks: { database: dbState, llm: llmState },
    };
  }

  return {
    status: checks.llm ? 'ok' : 'degraded',
    httpStatus: 200,
    checks: { database: dbState, llm: llmState },
  };
}
