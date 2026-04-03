interface CacheEntry<T> {
    data: T;
    timestamp: number;
}
declare const cache: Map<string, CacheEntry<unknown>>;
declare function getCached<T>(key: string, maxAgeMs: number): T | null;
declare function setCache<T>(key: string, data: T): void;
declare function clearCache(prefix?: string): void;
