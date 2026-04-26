-- AlterTable
ALTER TABLE "interview_answers"
  ADD COLUMN "analysis_score" INTEGER,
  ADD COLUMN "analysis_json" TEXT,
  ADD COLUMN "analyzed_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "interview_answers_user_id_created_at_idx" ON "interview_answers"("user_id", "created_at");
