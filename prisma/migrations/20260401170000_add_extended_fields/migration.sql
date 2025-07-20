-- AlterTable: PersonalInfo
ALTER TABLE "personal_info" ADD COLUMN IF NOT EXISTS "birth_year" TEXT NOT NULL DEFAULT '';
ALTER TABLE "personal_info" ADD COLUMN IF NOT EXISTS "links" TEXT NOT NULL DEFAULT '';
ALTER TABLE "personal_info" ADD COLUMN IF NOT EXISTS "military" TEXT NOT NULL DEFAULT '';

-- AlterTable: Experience
ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "department" TEXT NOT NULL DEFAULT '';
ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "achievements" TEXT NOT NULL DEFAULT '';
ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "tech_stack" TEXT NOT NULL DEFAULT '';

-- AlterTable: Education
ALTER TABLE "educations" ADD COLUMN IF NOT EXISTS "gpa" TEXT NOT NULL DEFAULT '';

-- AlterTable: Project
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "company" TEXT NOT NULL DEFAULT '';
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "tech_stack" TEXT NOT NULL DEFAULT '';
