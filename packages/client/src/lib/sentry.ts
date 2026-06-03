/**
 * Sentry initialisation for the React client. No-op when `VITE_SENTRY_DSN`
 * is unset — CI builds and local dev ship no telemetry by default, and the
 * package install adds zero runtime cost because `init()` short-circuits.
 * Call once from `main.tsx` (before render, around the ErrorBoundary).
 */
import * as Sentry from '@sentry/react';

let initialised = false;

export function initSentry() {
  if (initialised) return;
  initialised = true;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    replaysSessionSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_SAMPLE_RATE ?? 0),
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
  });
}
