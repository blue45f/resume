import { AuthService } from './auth.service';

describe('AuthService - OAuth State', () => {
  let service: AuthService;

  beforeEach(async () => {
    // Create a minimal instance for state testing (no DI needed for state logic)
    service = Object.create(AuthService.prototype);
    (service as any).oauthStates = new Map();
    (service as any).STATE_TTL_MS = 5 * 60 * 1000;
  });

  describe('generateOAuthState', () => {
    it('유니크한 state 값 생성', () => {
      const state1 = service.generateOAuthState();
      const state2 = service.generateOAuthState();
      expect(state1).not.toBe(state2);
      expect(state1).toHaveLength(32); // 16 bytes hex
    });
  });

  describe('validateOAuthState', () => {
    it('유효한 state → true (1회용)', () => {
      const state = service.generateOAuthState();
      expect(service.validateOAuthState(state)).toBe(true);
      // 재사용 불가
      expect(service.validateOAuthState(state)).toBe(false);
    });

    it('존재하지 않는 state → false', () => {
      expect(service.validateOAuthState('fake-state')).toBe(false);
    });

    it('만료된 state → false', () => {
      const state = service.generateOAuthState();
      // Manually expire
      (service as any).oauthStates.get(state).createdAt = Date.now() - 10 * 60 * 1000;
      expect(service.validateOAuthState(state)).toBe(false);
    });
  });
});
