-- AlterTable
ALTER TABLE "coffee_chats"
  ADD COLUMN "host_feedback" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "requester_feedback" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "host_joined" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "requester_joined" BOOLEAN NOT NULL DEFAULT false;
