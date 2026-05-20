import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Param,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
import { Throttle } from '@nestjs/throttler';
import { BillingService, PLANS, PlanId } from './billing.service';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'Plan 카탈로그 (가격 + 기능)' })
  listPlans() {
    return this.service.listPlans();
  }

  @Get('me')
  @ApiOperation({ summary: '내 현재 plan + active subscription' })
  getMine(@Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.getMyBilling(req.user.id);
  }

  @Get('me/payments')
  @ApiOperation({ summary: '내 결제 내역' })
  listMyPayments(@Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.listMyPayments(req.user.id);
  }

  /**
   * 사용자 self-cancel — currentPeriodEnd 까지 유효.
   */
  @Post('me/cancel')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '내 구독 해지 예약' })
  cancelMine(@Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.cancelMyPlan(req.user.id);
  }

  /**
   * Mock checkout — 실 PG 연동 전까지 사용. admin 또는 본인이 호출 가능.
   * 실 운영에선 Toss Payments 또는 Stripe Checkout Session 으로 대체.
   *
   * 멱등성: 사용자당 manual/trial 1회만 허용 (다회 호출 시 BadRequest).
   * 이미 동일 plan 활성 사용자는 즉시 현재 sub 반환.
   */
  @Post('me/checkout')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '[mock] 결제 — Pro 7일 trial (사용자당 1회)' })
  async mockCheckout(@Body() body: { plan: PlanId; days?: number }, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    if (!PLANS[body.plan]) {
      throw new ForbiddenException('유효하지 않은 plan');
    }
    const days = Math.min(7, Math.max(1, body.days || 7));
    const sub = await this.service.startTrial(req.user.id, body.plan, days);
    await this.service.recordPayment(req.user.id, {
      amount: 0,
      subscriptionId: sub.id,
      provider: 'manual',
      method: 'trial',
      description: `${PLANS[body.plan].name} ${days}일 무료 trial`,
      status: 'succeeded',
    });
    return sub;
  }

  /**
   * Admin grant — 임의 plan/days 부여. 실 결제 없음.
   */
  @Post('admin/grant/:userId')
  @ApiOperation({ summary: '[admin] 사용자에게 plan 직접 부여' })
  async adminGrant(
    @Param('userId') userId: string,
    @Body() body: { plan: PlanId; days: number; reason?: string },
    @Req() req: any,
  ) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
      throw new ForbiddenException('admin 만 가능합니다');
    }
    return this.service.grantPlan(userId, {
      plan: body.plan,
      days: body.days,
      provider: 'manual',
      reason: body.reason || `admin grant by ${req.user.id}`,
    });
  }
}
