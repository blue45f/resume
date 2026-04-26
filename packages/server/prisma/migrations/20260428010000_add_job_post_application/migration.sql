-- CreateTable
CREATE TABLE "job_post_applications" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "resume_id" TEXT,
    "cover_letter" TEXT NOT NULL DEFAULT '',
    "stage" TEXT NOT NULL DEFAULT 'interested',
    "recruiter_note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_post_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (unique: 동일 공고 중복 지원 방지)
CREATE UNIQUE INDEX "job_post_applications_job_id_applicant_id_key" ON "job_post_applications"("job_id", "applicant_id");

-- CreateIndex
CREATE INDEX "job_post_applications_job_id_idx" ON "job_post_applications"("job_id");

-- CreateIndex
CREATE INDEX "job_post_applications_applicant_id_idx" ON "job_post_applications"("applicant_id");

-- CreateIndex
CREATE INDEX "job_post_applications_stage_idx" ON "job_post_applications"("stage");

-- AddForeignKey
ALTER TABLE "job_post_applications" ADD CONSTRAINT "job_post_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_post_applications" ADD CONSTRAINT "job_post_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
