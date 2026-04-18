-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resume_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "issuer" TEXT NOT NULL DEFAULT '',
    "issue_date" TEXT NOT NULL DEFAULT '',
    "expiry_date" TEXT NOT NULL DEFAULT '',
    "credential_id" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "certifications_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "languages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resume_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "test_name" TEXT NOT NULL DEFAULT '',
    "score" TEXT NOT NULL DEFAULT '',
    "test_date" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "languages_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "awards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resume_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "issuer" TEXT NOT NULL DEFAULT '',
    "award_date" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "awards_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resume_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "organization" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '',
    "start_date" TEXT NOT NULL DEFAULT '',
    "end_date" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "activities_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "certifications_resume_id_idx" ON "certifications"("resume_id");

-- CreateIndex
CREATE INDEX "languages_resume_id_idx" ON "languages"("resume_id");

-- CreateIndex
CREATE INDEX "awards_resume_id_idx" ON "awards"("resume_id");

-- CreateIndex
CREATE INDEX "activities_resume_id_idx" ON "activities"("resume_id");
