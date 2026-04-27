-- CreateTable
CREATE TABLE "saved_job_searches" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "query" TEXT NOT NULL DEFAULT '',
    "skills" TEXT NOT NULL DEFAULT '',
    "locations" TEXT NOT NULL DEFAULT '',
    "job_types" TEXT NOT NULL DEFAULT '',
    "notify_on" BOOLEAN NOT NULL DEFAULT true,
    "last_matched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_job_searches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_job_searches_user_id_idx" ON "saved_job_searches"("user_id");
CREATE INDEX "saved_job_searches_notify_on_idx" ON "saved_job_searches"("notify_on");

-- AddForeignKey
ALTER TABLE "saved_job_searches" ADD CONSTRAINT "saved_job_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
