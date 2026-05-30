import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const path = (req.originalUrl || req.url || '').split('?')[0];
    // 헬스체크(로드밸런서/모니터링 핑)만 throttle 제외.
    // 과거엔 'GET 전부 스킵'이라 @Throttle 이 붙은 GET(예: billing verify-recent)의
    // 열거/남용 rate limit 이 통째로 무력화됐음 — 이제 GET 포함 전 요청에 정상 적용.
    if (path === '/api/health') return true;
    return false;
  }
}
