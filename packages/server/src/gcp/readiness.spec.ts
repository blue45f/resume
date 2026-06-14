import { evaluateReadiness } from './readiness'

describe('evaluateReadiness', () => {
  it('db up + llm up → ok / 200', () => {
    const v = evaluateReadiness({ database: true, llm: true })
    expect(v.status).toBe('ok')
    expect(v.httpStatus).toBe(200)
    expect(v.checks).toEqual({ database: 'ok', llm: 'ok' })
  })

  it('db up + no llm → degraded but still 200 (AI degrades gracefully)', () => {
    const v = evaluateReadiness({ database: true, llm: false })
    expect(v.status).toBe('degraded')
    expect(v.httpStatus).toBe(200)
    expect(v.checks.llm).toBe('error')
    expect(v.checks.database).toBe('ok')
  })

  it('db down → error / 503 (hold traffic)', () => {
    const v = evaluateReadiness({ database: false, llm: true })
    expect(v.status).toBe('error')
    expect(v.httpStatus).toBe(503)
    expect(v.checks.database).toBe('error')
  })

  it('db down + no llm → still error / 503 (db dominates)', () => {
    const v = evaluateReadiness({ database: false, llm: false })
    expect(v.status).toBe('error')
    expect(v.httpStatus).toBe(503)
  })
})
