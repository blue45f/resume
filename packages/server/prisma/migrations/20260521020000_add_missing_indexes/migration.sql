-- P3-3 — 누락 인덱스 추가
-- Notification: 사용자별 최신순 조회 + type+createdAt 으로 24h dedup 조회 최적화
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_type_createdAt_idx" ON "Notification"("userId", "type", "createdAt");

-- CommunityPost: 최신순 + pinFirst 정렬 최적화
CREATE INDEX IF NOT EXISTS "community_posts_created_at_idx" ON "community_posts"("created_at");
CREATE INDEX IF NOT EXISTS "community_posts_is_pinned_created_at_idx" ON "community_posts"("is_pinned", "created_at");
