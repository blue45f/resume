-- AlterTable: 답변 카운트 cache 컬럼 추가
ALTER TABLE "study_group_questions" ADD COLUMN "answer_count" INTEGER NOT NULL DEFAULT 0;

-- 신규 정렬용 인덱스 (upvotes desc 조회 최적화)
CREATE INDEX "study_group_questions_group_id_upvotes_idx" ON "study_group_questions"("group_id", "upvotes");

-- CreateTable: 문제 추천(upvote) 중복 방지
CREATE TABLE "study_group_question_votes" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_group_question_votes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "study_group_question_votes_question_id_user_id_key" ON "study_group_question_votes"("question_id", "user_id");
CREATE INDEX "study_group_question_votes_user_id_idx" ON "study_group_question_votes"("user_id");

ALTER TABLE "study_group_question_votes" ADD CONSTRAINT "study_group_question_votes_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "study_group_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_group_question_votes" ADD CONSTRAINT "study_group_question_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: 스터디 문제 답변 (parentId 로 1단계 답글 지원)
CREATE TABLE "study_group_question_answers" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "body" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_group_question_answers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "study_group_question_answers_question_id_created_at_idx" ON "study_group_question_answers"("question_id", "created_at");
CREATE INDEX "study_group_question_answers_question_id_upvotes_idx" ON "study_group_question_answers"("question_id", "upvotes");
CREATE INDEX "study_group_question_answers_user_id_idx" ON "study_group_question_answers"("user_id");
CREATE INDEX "study_group_question_answers_parent_id_idx" ON "study_group_question_answers"("parent_id");

ALTER TABLE "study_group_question_answers" ADD CONSTRAINT "study_group_question_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "study_group_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_group_question_answers" ADD CONSTRAINT "study_group_question_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_group_question_answers" ADD CONSTRAINT "study_group_question_answers_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "study_group_question_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: 답변 추천(좋아요) 중복 방지
CREATE TABLE "study_group_question_answer_votes" (
    "id" TEXT NOT NULL,
    "answer_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_group_question_answer_votes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "study_group_question_answer_votes_answer_id_user_id_key" ON "study_group_question_answer_votes"("answer_id", "user_id");
CREATE INDEX "study_group_question_answer_votes_user_id_idx" ON "study_group_question_answer_votes"("user_id");

ALTER TABLE "study_group_question_answer_votes" ADD CONSTRAINT "study_group_question_answer_votes_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "study_group_question_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_group_question_answer_votes" ADD CONSTRAINT "study_group_question_answer_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
