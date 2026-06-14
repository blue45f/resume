/// <reference types="jest" />
/// <reference types="node" />
/**
 * CoffeeChat E2E — 신청/수락/거절/취소/완료/만료/WebRTC signal queue
 * 양방향 시나리오 (requester ↔ host) + topic preset / ICS / 후기 / 통계
 */
import { E2EContext, setupE2EApp, cleanupTestData, createCoffeeChat } from './e2e-helper'

type CoffeeChatTopic = {
  key: string
}

type CoffeeChatResponse = {
  status: string
}

describe('CoffeeChat (커피챗)', () => {
  let ctx: E2EContext

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'coffee-e2e', normal: true, recruiter: true, coach: true })
  }, 60000)

  afterAll(async () => {
    // 모든 커피챗 + signal 정리
    const emails = Object.values(ctx.users).map((u) => u.email)
    const userIds = Object.values(ctx.userIds)
    await ctx.prisma.webrtcSignal
      .deleteMany({
        where: { OR: [{ fromUserId: { in: userIds } }, { toUserId: { in: userIds } }] },
      })
      .catch(() => undefined)
    await ctx.prisma.coffeeChat
      .deleteMany({
        where: { OR: [{ requesterId: { in: userIds } }, { hostId: { in: userIds } }] },
      })
      .catch(() => undefined)
    await cleanupTestData(ctx.prisma, emails)
    await ctx.app.close()
  })

  describe('Topic preset (public)', () => {
    it('GET /coffee-chats/topics — 7개 preset 반환', async () => {
      const res = await ctx.api().get('/api/coffee-chats/topics').expect(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(7)
      const keys = (res.body as CoffeeChatTopic[]).map((topic) => topic.key)
      expect(keys).toContain('resume_review')
      expect(keys).toContain('general')
    })
  })

  describe('신청 → 수락 → 완료 흐름', () => {
    let chatId: string

    it('POST /coffee-chats — normal 이 coach 에게 신청', async () => {
      const chat = await createCoffeeChat(ctx, 'normal', 'coach', {
        topic: 'mock_interview',
      })
      expect(chat.id).toBeDefined()
      expect(chat.status).toBe('pending')
      expect(chat.modality).toBe('video')
      chatId = chat.id
    })

    it('본인에게 신청 → 400', async () => {
      const res = await ctx.authPost('normal', '/api/coffee-chats').send({
        hostId: ctx.userIds.normal,
        topic: 'general',
      })
      expect([400, 401]).toContain(res.status)
    })

    it('hostId 없이 신청 → 400', async () => {
      const res = await ctx.authPost('normal', '/api/coffee-chats').send({ topic: 'general' })
      expect([400, 401]).toContain(res.status)
    })

    it('동일 host 에게 pending 중복 신청 → 400', async () => {
      const res = await ctx.authPost('normal', '/api/coffee-chats').send({
        hostId: ctx.userIds.coach,
      })
      expect([400, 401]).toContain(res.status)
    })

    it('GET /coffee-chats/:id — 양쪽 모두 조회 가능', async () => {
      const own = await ctx.authGet('normal', `/api/coffee-chats/${chatId}`).expect(200)
      expect(own.body.id).toBe(chatId)
      const host = await ctx.authGet('coach', `/api/coffee-chats/${chatId}`).expect(200)
      expect(host.body.id).toBe(chatId)
    })

    it('제3자(recruiter) → 403', async () => {
      const res = await ctx.authGet('recruiter', `/api/coffee-chats/${chatId}`)
      expect([403, 404]).toContain(res.status)
    })

    it('PATCH /:id/respond — requester 는 수락 못함 (403)', async () => {
      const res = await ctx
        .authPatch('normal', `/api/coffee-chats/${chatId}/respond`)
        .send({ decision: 'accepted' })
      expect([403, 404]).toContain(res.status)
    })

    it('PATCH /:id/respond — host 가 accepted → roomId 발급', async () => {
      const res = await ctx
        .authPatch('coach', `/api/coffee-chats/${chatId}/respond`)
        .send({ decision: 'accepted', note: 'OK' })
        .expect(200)
      expect(res.body.status).toBe('accepted')
      expect(res.body.roomId).toBeDefined()
    })

    it('이미 응답한 chat 재응답 → 400', async () => {
      const res = await ctx
        .authPatch('coach', `/api/coffee-chats/${chatId}/respond`)
        .send({ decision: 'rejected' })
      expect([400, 403]).toContain(res.status)
    })

    it('GET /:id/ics — 캘린더 export (accepted)', async () => {
      const res = await ctx.authGet('normal', `/api/coffee-chats/${chatId}/ics`).expect(200)
      const text = res.text || (res.body && Buffer.isBuffer(res.body) ? res.body.toString() : '')
      expect(text).toContain('BEGIN:VCALENDAR')
      expect(text).toContain('BEGIN:VEVENT')
    })

    it('PATCH /:id/join — host 입장 기록', async () => {
      const res = await ctx
        .authPatch('coach', `/api/coffee-chats/${chatId}/join`)
        .send({})
        .expect(200)
      expect(res.body.hostJoined).toBe(true)
    })

    it('PATCH /:id/complete — completed 로 변경', async () => {
      const res = await ctx
        .authPatch('normal', `/api/coffee-chats/${chatId}/complete`)
        .send({})
        .expect(200)
      expect(res.body.status).toBe('completed')
    })

    it('PATCH /:id/feedback — completed 상태에서 후기 작성', async () => {
      const res = await ctx
        .authPatch('normal', `/api/coffee-chats/${chatId}/feedback`)
        .send({ feedback: '정말 유익했어요!' })
        .expect(200)
      expect(res.body.requesterFeedback).toContain('유익')
    })
  })

  describe('거절/취소 흐름', () => {
    it('host 가 rejected', async () => {
      const chat = await createCoffeeChat(ctx, 'recruiter', 'coach', {
        topic: 'culture_fit',
      })
      const res = await ctx
        .authPatch('coach', `/api/coffee-chats/${chat.id}/respond`)
        .send({ decision: 'rejected' })
        .expect(200)
      expect(res.body.status).toBe('rejected')
    })

    it('requester 가 pending 상태에서 cancel', async () => {
      const chat = await createCoffeeChat(ctx, 'normal', 'recruiter', {})
      const res = await ctx.authDelete('normal', `/api/coffee-chats/${chat.id}`).expect(200)
      expect(res.body.status).toBe('cancelled')
    })

    it('host 가 cancel 시도 → 403', async () => {
      const chat = await createCoffeeChat(ctx, 'normal', 'recruiter', {})
      const res = await ctx.authDelete('recruiter', `/api/coffee-chats/${chat.id}`)
      expect([403, 404]).toContain(res.status)
      // cleanup
      await ctx.authDelete('normal', `/api/coffee-chats/${chat.id}`).catch(() => undefined)
    })
  })

  describe('목록 + 상태 필터', () => {
    it('GET /coffee-chats?role=sent — 내가 보낸 것', async () => {
      const res = await ctx.authGet('normal', '/api/coffee-chats?role=sent').expect(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('GET /coffee-chats?role=received — 내가 받은 것', async () => {
      const res = await ctx.authGet('coach', '/api/coffee-chats?role=received').expect(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('GET /coffee-chats?status=pending — 상태 필터', async () => {
      const res = await ctx.authGet('normal', '/api/coffee-chats?status=pending').expect(200)
      expect(Array.isArray(res.body)).toBe(true)
      ;(res.body as CoffeeChatResponse[]).forEach((chat) => expect(chat.status).toBe('pending'))
    })

    it('비로그인 → 401', async () => {
      const res = await ctx.api().get('/api/coffee-chats')
      expect([401]).toContain(res.status)
    })
  })

  describe('Host stats (public)', () => {
    it('GET /coffee-chats/host-stats/:hostId — 통계 반환', async () => {
      const res = await ctx
        .api()
        .get(`/api/coffee-chats/host-stats/${ctx.userIds.coach}`)
        .expect(200)
      expect(typeof res.body.total).toBe('number')
      expect(typeof res.body.responseRate).toBe('number')
    })
  })

  describe('WebRTC signaling queue', () => {
    let roomId: string
    let chatId: string

    beforeAll(async () => {
      // 새 accepted 챗 발급해서 roomId 확보
      const chat = await createCoffeeChat(ctx, 'normal', 'recruiter', {
        topic: 'role_intro',
      })
      const accepted = await ctx
        .authPatch('recruiter', `/api/coffee-chats/${chat.id}/respond`)
        .send({ decision: 'accepted' })
      chatId = chat.id
      roomId = accepted.body.roomId
    })

    it('POST /coffee-chats/signal — offer 전송 (peer 매칭)', async () => {
      const res = await ctx.authPost('normal', '/api/coffee-chats/signal').send({
        roomId,
        toUserId: ctx.userIds.recruiter,
        type: 'offer',
        payload: { sdp: 'v=0\r\no=- 1 1 IN IP4 0.0.0.0\r\n' },
      })
      expect([200, 201]).toContain(res.status)
    })

    it('GET /coffee-chats/signal/:roomId/poll — peer 가 drain', async () => {
      const res = await ctx
        .authGet('recruiter', `/api/coffee-chats/signal/${roomId}/poll`)
        .expect(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
      expect(res.body[0].type).toBe('offer')
    })

    it('drain 후 같은 room 재polling → 빈 배열 (한 번 읽으면 삭제)', async () => {
      const res = await ctx
        .authGet('recruiter', `/api/coffee-chats/signal/${roomId}/poll`)
        .expect(200)
      expect(res.body.length).toBe(0)
    })

    it('잘못된 type → 400', async () => {
      const res = await ctx.authPost('normal', '/api/coffee-chats/signal').send({
        roomId,
        toUserId: ctx.userIds.recruiter,
        type: 'invalid-type',
        payload: {},
      })
      expect([400, 403]).toContain(res.status)
    })

    it('toUserId 가 room peer 아님 → 403', async () => {
      const res = await ctx.authPost('normal', '/api/coffee-chats/signal').send({
        roomId,
        toUserId: ctx.userIds.coach, // not in room
        type: 'ice',
        payload: { candidate: 'fake' },
      })
      expect([400, 403]).toContain(res.status)
    })

    it('비참여자(coach) 가 signal 전송 → 403', async () => {
      const res = await ctx.authPost('coach', '/api/coffee-chats/signal').send({
        roomId,
        toUserId: ctx.userIds.recruiter,
        type: 'offer',
        payload: {},
      })
      expect([403]).toContain(res.status)
    })

    it('POST /coffee-chats/signal/telemetry — fire-and-forget', async () => {
      const res = await ctx.authPost('normal', '/api/coffee-chats/signal/telemetry').send({
        roomId,
        state: 'connected',
        modality: 'video',
        durationMs: 1234,
      })
      expect([200, 201]).toContain(res.status)
      expect(res.body.ok).toBe(true)
    })

    afterAll(async () => {
      await ctx.prisma.coffeeChat
        .update({ where: { id: chatId }, data: { status: 'completed' } })
        .catch(() => undefined)
    })
  })

  describe('찾을 수 없는 chat', () => {
    it('GET /:id (없는 id) → 404', async () => {
      const res = await ctx.authGet('normal', '/api/coffee-chats/no-such-id')
      expect([404, 403]).toContain(res.status)
    })

    it('PATCH /:id/complete (없는 id) → 404', async () => {
      const res = await ctx.authPatch('normal', '/api/coffee-chats/no-such-id/complete').send({})
      expect([404, 403]).toContain(res.status)
    })
  })
})
