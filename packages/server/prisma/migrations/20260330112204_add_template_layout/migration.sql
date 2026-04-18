-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'general',
    "prompt" TEXT NOT NULL DEFAULT '',
    "layout" TEXT NOT NULL DEFAULT '{}',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_templates" ("category", "created_at", "description", "id", "is_default", "name", "prompt", "updated_at") SELECT "category", "created_at", "description", "id", "is_default", "name", "prompt", "updated_at" FROM "templates";
DROP TABLE "templates";
ALTER TABLE "new_templates" RENAME TO "templates";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
