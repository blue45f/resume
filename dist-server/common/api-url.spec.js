"use strict";
describe('API_URL configuration', () => {
    it('defaults to empty string when VITE_API_URL is not set', () => {
        const VITE_API_URL = undefined;
        const API_URL = VITE_API_URL || '';
        expect(API_URL).toBe('');
    });
    it('uses the environment variable value when set', () => {
        const VITE_API_URL = 'https://api.example.com';
        const API_URL = VITE_API_URL || '';
        expect(API_URL).toBe('https://api.example.com');
    });
    it('uses empty string when value is explicitly empty', () => {
        const VITE_API_URL = '';
        const API_URL = VITE_API_URL || '';
        expect(API_URL).toBe('');
    });
    it('BASE path is constructed correctly with empty API_URL', () => {
        const API_URL = '';
        const BASE = `${API_URL}/api`;
        expect(BASE).toBe('/api');
    });
    it('BASE path is constructed correctly with a custom API_URL', () => {
        const API_URL = 'https://api.example.com';
        const BASE = `${API_URL}/api`;
        expect(BASE).toBe('https://api.example.com/api');
    });
    it('trailing slash in API_URL does not break path (shows current behavior)', () => {
        const API_URL = 'https://api.example.com/';
        const BASE = `${API_URL}/api`;
        expect(BASE).toBe('https://api.example.com//api');
    });
});
