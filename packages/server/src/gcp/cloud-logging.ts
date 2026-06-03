/**
 * Cloud Logging (a.k.a. Stackdriver) structured-log helpers for Cloud Run.
 *
 * Cloud Run automatically captures stdout/stderr. When a line is valid JSON,
 * Cloud Logging parses it as a structured `jsonPayload` and recognises a few
 * special fields:
 *   - `severity`                              → log level (maps to the LogSeverity enum)
 *   - `message`                               → the main text shown in the console
 *   - `logging.googleapis.com/trace`          → groups logs under a request trace
 *   - `logging.googleapis.com/sourceLocation` → file/line attribution
 *
 * Refs:
 * - https://cloud.google.com/run/docs/logging#using-json
 * - https://cloud.google.com/logging/docs/structured-logging
 *
 * These functions are pure (no I/O) so they can be unit-tested. The Nest
 * `LoggerService` wrapper that calls `console.log(JSON.stringify(entry))` lives
 * in `gcp-logger.service.ts`.
 */

/** Cloud Logging severity levels we use (subset of the LogSeverity enum). */
export type CloudSeverity = 'DEFAULT' | 'DEBUG' | 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR';

export interface CloudLogEntry {
  severity: CloudSeverity;
  message: string;
  context?: string;
  /** `logging.googleapis.com/trace` — set when an X-Cloud-Trace-Context is present. */
  'logging.googleapis.com/trace'?: string;
  [key: string]: unknown;
}

/** Map Nest log levels to Cloud Logging severities. */
export function nestLevelToSeverity(level: string): CloudSeverity {
  switch (level) {
    case 'debug':
      return 'DEBUG';
    case 'verbose':
      return 'DEFAULT';
    case 'log':
      return 'INFO';
    case 'warn':
      return 'WARNING';
    case 'error':
    case 'fatal':
      return 'ERROR';
    default:
      return 'DEFAULT';
  }
}

/**
 * Build the `logging.googleapis.com/trace` value from Cloud Run's
 * `X-Cloud-Trace-Context` header (format: `TRACE_ID/SPAN_ID;o=1`).
 *
 * @param header     raw header value
 * @param projectId  GCP project id (required to form the full resource name)
 */
export function buildTraceField(
  header: string | undefined,
  projectId: string | undefined,
): string | undefined {
  if (!header || !projectId) return undefined;
  const traceId = header.split('/')[0]?.trim();
  if (!traceId) return undefined;
  return `projects/${projectId}/traces/${traceId}`;
}

/**
 * Build a structured log entry. `message` is coerced to a string; Error objects
 * keep their stack under `stack` while the message stays readable.
 */
export function buildLogEntry(
  severity: CloudSeverity,
  message: unknown,
  context?: string,
  extra?: Record<string, unknown>,
): CloudLogEntry {
  let text: string;
  let stack: string | undefined;

  if (message instanceof Error) {
    text = message.message;
    stack = message.stack;
  } else if (typeof message === 'string') {
    text = message;
  } else {
    try {
      text = JSON.stringify(message);
    } catch {
      text = String(message);
    }
  }

  const entry: CloudLogEntry = {
    severity,
    message: text,
    ...(context ? { context } : {}),
    ...(stack ? { stack } : {}),
    ...(extra ?? {}),
  };
  return entry;
}

/** Serialize an entry as a single JSON line for stdout/stderr. */
export function serializeLogEntry(entry: CloudLogEntry): string {
  try {
    return JSON.stringify(entry);
  } catch {
    // Circular or otherwise unserializable payload — fall back to a minimal line.
    return JSON.stringify({ severity: entry.severity, message: entry.message });
  }
}
