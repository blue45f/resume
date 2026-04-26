-- CreateTable
CREATE TABLE "resume_viewers" (
    "id" TEXT NOT NULL,
    "resume_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "added_by_id" TEXT,
    "message" TEXT,
    "expires_at" TIMESTAMP(3),
    "last_viewed_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_viewers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_viewers_user_id_idx" ON "resume_viewers"("user_id");

-- CreateIndex
CREATE INDEX "resume_viewers_resume_id_idx" ON "resume_viewers"("resume_id");

-- CreateIndex
CREATE INDEX "resume_viewers_expires_at_idx" ON "resume_viewers"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "resume_viewers_resume_id_user_id_key" ON "resume_viewers"("resume_id", "user_id");

-- AddForeignKey
ALTER TABLE "resume_viewers" ADD CONSTRAINT "resume_viewers_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_viewers" ADD CONSTRAINT "resume_viewers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_viewers" ADD CONSTRAINT "resume_viewers_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
