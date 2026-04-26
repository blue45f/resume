-- CreateTable
CREATE TABLE "coffee_chats" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduled_at" TIMESTAMP(3),
    "duration_min" INTEGER NOT NULL DEFAULT 30,
    "topic" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "modality" TEXT NOT NULL DEFAULT 'video',
    "room_id" TEXT,
    "host_note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coffee_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webrtc_signals" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webrtc_signals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coffee_chats_host_id_status_idx" ON "coffee_chats"("host_id", "status");

-- CreateIndex
CREATE INDEX "coffee_chats_requester_id_status_idx" ON "coffee_chats"("requester_id", "status");

-- CreateIndex
CREATE INDEX "coffee_chats_room_id_idx" ON "coffee_chats"("room_id");

-- CreateIndex
CREATE INDEX "webrtc_signals_to_user_id_room_id_created_at_idx" ON "webrtc_signals"("to_user_id", "room_id", "created_at");

-- AddForeignKey
ALTER TABLE "coffee_chats" ADD CONSTRAINT "coffee_chats_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coffee_chats" ADD CONSTRAINT "coffee_chats_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webrtc_signals" ADD CONSTRAINT "webrtc_signals_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webrtc_signals" ADD CONSTRAINT "webrtc_signals_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
