-- CreateTable
CREATE TABLE "job_url_cache" (
    "url" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_url_cache_pkey" PRIMARY KEY ("url")
);
