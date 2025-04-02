-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_llm_transformations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resume_id" TEXT NOT NULL,
    "template_type" TEXT NOT NULL,
    "target_language" TEXT NOT NULL DEFAULT 'ko',
    "job_description" TEXT,
    "result" TEXT NOT NULL,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "model" TEXT NOT NULL DEFAULT 'unknown',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "llm_transformations_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_llm_transformations" ("created_at", "id", "job_description", "model", "result", "resume_id", "target_language", "template_type", "tokens_used") SELECT "created_at", "id", "job_description", "model", "result", "resume_id", "target_language", "template_type", "tokens_used" FROM "llm_transformations";
DROP TABLE "llm_transformations";
ALTER TABLE "new_llm_transformations" RENAME TO "llm_transformations";
CREATE INDEX "llm_transformations_resume_id_idx" ON "llm_transformations"("resume_id");
CREATE INDEX "llm_transformations_created_at_idx" ON "llm_transformations"("created_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "share_links_expires_at_idx" ON "share_links"("expires_at");
