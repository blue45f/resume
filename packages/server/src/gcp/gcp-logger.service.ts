import { ConsoleLogger, LoggerService, LogLevel } from '@nestjs/common'

import { buildLogEntry, nestLevelToSeverity, serializeLogEntry } from './cloud-logging'

/**
 * Cloud Logging-friendly Nest logger.
 *
 * In production it emits one JSON line per log to stdout/stderr so that Cloud
 * Run / Cloud Logging parses them as structured entries (with `severity`,
 * `message`, `context`, and `stack`). `error`/`fatal` go to stderr, everything
 * else to stdout — matching Cloud Logging's stream-to-severity defaults.
 *
 * This is additive and opt-in: it is only installed in `main.ts` when
 * `NODE_ENV=production`. In dev, Nest's pretty `ConsoleLogger` is used, so the
 * existing local DX is unchanged.
 */
export class GcpLoggerService extends ConsoleLogger implements LoggerService {
  private readonly enabledLevels: Set<LogLevel>

  constructor(levels: LogLevel[] = ['log', 'warn', 'error']) {
    super()
    this.enabledLevels = new Set(levels)
  }

  private emit(
    level: LogLevel,
    message: unknown,
    context?: string,
    extra?: Record<string, unknown>
  ) {
    if (!this.enabledLevels.has(level)) return
    const severity = nestLevelToSeverity(level)
    const entry = buildLogEntry(severity, message, context, extra)
    const line = serializeLogEntry(entry)
    if (level === 'error' || level === 'fatal') {
      process.stderr.write(line + '\n')
    } else {
      process.stdout.write(line + '\n')
    }
  }

  log(message: unknown, context?: string) {
    this.emit('log', message, context ?? this.context)
  }

  error(message: unknown, stackOrContext?: string, context?: string) {
    // Nest calls error(message, stack?, context?). Preserve the stack as `extra`.
    const ctx = context ?? this.context
    const extra = stackOrContext && stackOrContext !== ctx ? { stack: stackOrContext } : undefined
    this.emit('error', message, ctx, extra)
  }

  warn(message: unknown, context?: string) {
    this.emit('warn', message, context ?? this.context)
  }

  debug(message: unknown, context?: string) {
    this.emit('debug', message, context ?? this.context)
  }

  verbose(message: unknown, context?: string) {
    this.emit('verbose', message, context ?? this.context)
  }

  fatal(message: unknown, context?: string) {
    this.emit('error', message, context ?? this.context, { fatal: true })
  }
}
