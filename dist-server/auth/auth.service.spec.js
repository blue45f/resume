"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("./auth.service");
describe('AuthService - OAuth State (HMAC)', () => {
    let service;
    beforeEach(async () => {
        service = Object.create(auth_service_1.AuthService.prototype);
        service.stateSecret = 'test-secret-key';
        service.STATE_TTL_MS = 10 * 60 * 1000;
        service.logger = { warn: jest.fn() };
    });
    describe('generateOAuthState', () => {
        it('유니크한 state 값 생성', () => {
            const state1 = service.generateOAuthState();
            const state2 = service.generateOAuthState();
            expect(state1).not.toBe(state2);
        });
        it('timestamp.nonce.hmac 형식', () => {
            const state = service.generateOAuthState();
            const parts = state.split('.');
            expect(parts).toHaveLength(3);
        });
    });
    describe('validateOAuthState', () => {
        it('유효한 state → true', () => {
            const state = service.generateOAuthState();
            expect(service.validateOAuthState(state)).toBe(true);
        });
        it('HMAC 서명이므로 재사용 가능 (stateless)', () => {
            const state = service.generateOAuthState();
            expect(service.validateOAuthState(state)).toBe(true);
            expect(service.validateOAuthState(state)).toBe(true);
        });
        it('변조된 state → false', () => {
            const state = service.generateOAuthState();
            const tampered = state.slice(0, -1) + 'x';
            expect(service.validateOAuthState(tampered)).toBe(false);
        });
        it('잘못된 형식 → false', () => {
            expect(service.validateOAuthState('invalid')).toBe(false);
            expect(service.validateOAuthState('')).toBe(false);
            expect(service.validateOAuthState(undefined)).toBe(false);
        });
        it('만료된 state → false', () => {
            const oldTimestamp = (Date.now() - 11 * 60 * 1000).toString(36);
            const { createHmac } = require('crypto');
            const nonce = 'deadbeef01234567';
            const payload = `${oldTimestamp}.${nonce}`;
            const hmac = createHmac('sha256', 'test-secret-key').update(payload).digest('hex').slice(0, 16);
            const state = `${payload}.${hmac}`;
            expect(service.validateOAuthState(state)).toBe(false);
        });
    });
});
