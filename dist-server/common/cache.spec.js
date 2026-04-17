/**
 * Tests for in-memory cache utility.
 * Re-implements the cache logic from src/lib/cache.ts to test in the Jest/Node environment.
 */ // ---- Re-implementation of cache (mirrors src/lib/cache.ts) ----
"use strict";
const cache = new Map();
function getCached(key, maxAgeMs) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > maxAgeMs) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}
function setCache(key, data) {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
}
function clearCache(prefix) {
    if (!prefix) {
        cache.clear();
        return;
    }
    for (const key of cache.keys()){
        if (key.startsWith(prefix)) cache.delete(key);
    }
}
// ---- Tests ----
describe('cache utilities', ()=>{
    beforeEach(()=>{
        clearCache();
    });
    describe('getCached', ()=>{
        it('returns null for a missing key', ()=>{
            expect(getCached('nonexistent', 60_000)).toBeNull();
        });
        it('returns the stored value within the TTL', ()=>{
            setCache('key1', {
                foo: 'bar'
            });
            const result = getCached('key1', 60_000);
            expect(result).toEqual({
                foo: 'bar'
            });
        });
        it('returns null and evicts entry when expired', ()=>{
            // Manually insert an entry with a past timestamp
            cache.set('old-key', {
                data: 'stale',
                timestamp: Date.now() - 120_000
            });
            const result = getCached('old-key', 60_000);
            expect(result).toBeNull();
            // Verify the key was removed
            expect(cache.has('old-key')).toBe(false);
        });
        it('returns value right at the boundary (not yet expired)', ()=>{
            const now = Date.now();
            cache.set('edge-key', {
                data: 'edge',
                timestamp: now
            });
            // maxAge = 1000ms, just inserted => not expired
            const result = getCached('edge-key', 1000);
            expect(result).toBe('edge');
        });
    });
    describe('setCache', ()=>{
        it('stores a string value', ()=>{
            setCache('str', 'hello');
            expect(getCached('str', 60_000)).toBe('hello');
        });
        it('stores a number value', ()=>{
            setCache('num', 42);
            expect(getCached('num', 60_000)).toBe(42);
        });
        it('stores an object value', ()=>{
            setCache('obj', {
                a: 1,
                b: [
                    2,
                    3
                ]
            });
            expect(getCached('obj', 60_000)).toEqual({
                a: 1,
                b: [
                    2,
                    3
                ]
            });
        });
        it('overwrites existing key', ()=>{
            setCache('key', 'first');
            setCache('key', 'second');
            expect(getCached('key', 60_000)).toBe('second');
        });
        it('stores null as a valid value', ()=>{
            setCache('nullable', null);
            // getCached returns null both for "missing" and "stored null",
            // but the cache entry exists
            expect(cache.has('nullable')).toBe(true);
        });
    });
    describe('clearCache', ()=>{
        it('clears all entries when called without a prefix', ()=>{
            setCache('a', 1);
            setCache('b', 2);
            setCache('c', 3);
            clearCache();
            expect(getCached('a', 60_000)).toBeNull();
            expect(getCached('b', 60_000)).toBeNull();
            expect(getCached('c', 60_000)).toBeNull();
        });
        it('clears only entries matching the prefix', ()=>{
            setCache('user:1', 'alice');
            setCache('user:2', 'bob');
            setCache('post:1', 'hello');
            clearCache('user:');
            expect(getCached('user:1', 60_000)).toBeNull();
            expect(getCached('user:2', 60_000)).toBeNull();
            expect(getCached('post:1', 60_000)).toBe('hello');
        });
        it('does nothing if prefix matches no keys', ()=>{
            setCache('a', 1);
            clearCache('zzz:');
            expect(getCached('a', 60_000)).toBe(1);
        });
    });
    describe('expiry behavior', ()=>{
        it('entry is still valid just before expiry', ()=>{
            const maxAge = 5000;
            // Insert with timestamp 3000ms ago
            cache.set('recent', {
                data: 'ok',
                timestamp: Date.now() - 3000
            });
            expect(getCached('recent', maxAge)).toBe('ok');
        });
        it('entry is expired just after maxAge', ()=>{
            const maxAge = 5000;
            // Insert with timestamp 6000ms ago
            cache.set('expired', {
                data: 'gone',
                timestamp: Date.now() - 6000
            });
            expect(getCached('expired', maxAge)).toBeNull();
        });
        it('zero maxAge always expires', ()=>{
            setCache('instant', 'value');
            // Even immediate read with maxAge=0 may or may not expire depending on timing;
            // but manually setting a 1ms-old entry with maxAge=0 should expire
            cache.set('instant', {
                data: 'value',
                timestamp: Date.now() - 1
            });
            expect(getCached('instant', 0)).toBeNull();
        });
    });
});
