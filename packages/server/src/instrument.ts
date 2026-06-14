/**
 * Sentry instrumentation for the NestJS API. Imported FIRST in `main.ts`
 * (before any other module) so its hooks are installed before the rest of the
 * app loads.
 *
 * No-op when `SENTRY_DSN` is unset — CI and any deployment without a DSN ship
 * no telemetry, and the package install adds zero runtime cost because
 * `init()` short-circuits.
 */
import * as Sentry from '@sentry/nestjs'

const dsn = process.env.SENTRY_DSN?.trim()
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    sendDefaultPii: false,
  })

  console.log('[sentry] enabled')
}
