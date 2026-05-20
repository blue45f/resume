-- CreateTable: 게시글 좋아요 dedupe (postId, userId unique)
CREATE TABLE "study_group_post_likes" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_group_post_likes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "study_group_post_likes_post_id_user_id_key" ON "study_group_post_likes"("post_id", "user_id");
CREATE INDEX "study_group_post_likes_user_id_idx" ON "study_group_post_likes"("user_id");

ALTER TABLE "study_group_post_likes" ADD CONSTRAINT "study_group_post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "study_group_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_group_post_likes" ADD CONSTRAINT "study_group_post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
