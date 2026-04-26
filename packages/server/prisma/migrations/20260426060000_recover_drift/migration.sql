-- AlterTable
ALTER TABLE "community_posts" ADD COLUMN     "auto_hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "report_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "resumes" ADD COLUMN     "auto_hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "report_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "study_group_posts" ADD COLUMN     "tags" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "resume_reports" (
    "id" TEXT NOT NULL,
    "resume_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'other',
    "detail" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_post_reports" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'other',
    "detail" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_group_post_reactions" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_group_post_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_group_post_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_group_post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_group_events" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'online',
    "location" TEXT NOT NULL DEFAULT '',
    "meeting_url" TEXT NOT NULL DEFAULT '',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_group_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_group_event_rsvps" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'going',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_group_event_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_reports_resume_id_idx" ON "resume_reports"("resume_id");

-- CreateIndex
CREATE UNIQUE INDEX "resume_reports_resume_id_reporter_id_key" ON "resume_reports"("resume_id", "reporter_id");

-- CreateIndex
CREATE INDEX "community_post_reports_post_id_idx" ON "community_post_reports"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_post_reports_post_id_reporter_id_key" ON "community_post_reports"("post_id", "reporter_id");

-- CreateIndex
CREATE INDEX "study_group_post_reactions_post_id_idx" ON "study_group_post_reactions"("post_id");

-- CreateIndex
CREATE INDEX "study_group_post_reactions_user_id_idx" ON "study_group_post_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_group_post_reactions_post_id_user_id_emoji_key" ON "study_group_post_reactions"("post_id", "user_id", "emoji");

-- CreateIndex
CREATE INDEX "study_group_post_comments_post_id_created_at_idx" ON "study_group_post_comments"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "study_group_post_comments_user_id_idx" ON "study_group_post_comments"("user_id");

-- CreateIndex
CREATE INDEX "study_group_post_comments_parent_id_idx" ON "study_group_post_comments"("parent_id");

-- CreateIndex
CREATE INDEX "study_group_events_group_id_starts_at_idx" ON "study_group_events"("group_id", "starts_at");

-- CreateIndex
CREATE INDEX "study_group_event_rsvps_user_id_idx" ON "study_group_event_rsvps"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_group_event_rsvps_event_id_user_id_key" ON "study_group_event_rsvps"("event_id", "user_id");

-- AddForeignKey
ALTER TABLE "resume_reports" ADD CONSTRAINT "resume_reports_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_reports" ADD CONSTRAINT "resume_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_reports" ADD CONSTRAINT "community_post_reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_reports" ADD CONSTRAINT "community_post_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_post_reactions" ADD CONSTRAINT "study_group_post_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "study_group_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_post_reactions" ADD CONSTRAINT "study_group_post_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_post_comments" ADD CONSTRAINT "study_group_post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "study_group_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_post_comments" ADD CONSTRAINT "study_group_post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_post_comments" ADD CONSTRAINT "study_group_post_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "study_group_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_events" ADD CONSTRAINT "study_group_events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_events" ADD CONSTRAINT "study_group_events_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_event_rsvps" ADD CONSTRAINT "study_group_event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "study_group_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_event_rsvps" ADD CONSTRAINT "study_group_event_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

