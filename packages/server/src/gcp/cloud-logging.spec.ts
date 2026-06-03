import {
  nestLevelToSeverity,
  buildTraceField,
  buildLogEntry,
  serializeLogEntry,
} from './cloud-logging';

describe('nestLevelToSeverity', () => {
  it.each([
    ['debug', 'DEBUG'],
    ['verbose', 'DEFAULT'],
    ['log', 'INFO'],
    ['warn', 'WARNING'],
    ['error', 'ERROR'],
    ['fatal', 'ERROR'],
    ['unknown', 'DEFAULT'],
  ])('%s → %s', (level, expected) => {
    expect(nestLevelToSeverity(level)).toBe(expected);
  });
});

describe('buildTraceField', () => {
  it('builds the full trace resource name from header + project', () => {
    expect(buildTraceField('abc123/456;o=1', 'resume-platform-prod')).toBe(
      'projects/resume-platform-prod/traces/abc123',
    );
  });

  it('returns undefined without a header', () => {
    expect(buildTraceField(undefined, 'p')).toBeUndefined();
  });

  it('returns undefined without a project id', () => {
    expect(buildTraceField('abc/def', undefined)).toBeUndefined();
  });

  it('handles header without a span segment', () => {
    expect(buildTraceField('justatrace', 'p')).toBe('projects/p/traces/justatrace');
  });
});

describe('buildLogEntry', () => {
  it('string message → severity + message', () => {
    const e = buildLogEntry('INFO', 'hello', 'Bootstrap');
    expect(e.severity).toBe('INFO');
    expect(e.message).toBe('hello');
    expect(e.context).toBe('Bootstrap');
  });

  it('Error message → keeps stack', () => {
    const err = new Error('boom');
    const e = buildLogEntry('ERROR', err);
    expect(e.message).toBe('boom');
    expect(typeof e.stack).toBe('string');
  });

  it('object message → JSON-stringified', () => {
    const e = buildLogEntry('INFO', { a: 1 });
    expect(e.message).toBe('{"a":1}');
  });

  it('merges extra fields', () => {
    const e = buildLogEntry('INFO', 'm', undefined, { latencyMs: 12 });
    expect(e.latencyMs).toBe(12);
  });

  it('omits context when not provided', () => {
    const e = buildLogEntry('INFO', 'm');
    expect('context' in e).toBe(false);
  });
});

describe('serializeLogEntry', () => {
  it('produces a single-line JSON string', () => {
    const line = serializeLogEntry(buildLogEntry('INFO', 'hi', 'Ctx'));
    expect(line).not.toContain('\n');
    const parsed = JSON.parse(line);
    expect(parsed.severity).toBe('INFO');
    expect(parsed.message).toBe('hi');
  });

  it('falls back gracefully on circular payloads', () => {
    const circular: Record<string, unknown> = { severity: 'ERROR', message: 'x' };
    circular.self = circular;
    const line = serializeLogEntry(circular as never);
    const parsed = JSON.parse(line);
    expect(parsed.message).toBe('x');
    expect(parsed.severity).toBe('ERROR');
  });
});
