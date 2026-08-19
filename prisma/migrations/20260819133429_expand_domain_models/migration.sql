-- CreateEnum
CREATE TYPE "subjects" AS ENUM ('PORTUGUES', 'LITERATURA', 'INGLES', 'ESPANHOL', 'ARTES', 'EDUCACAO_FISICA', 'HISTORIA', 'GEOGRAFIA', 'FILOSOFIA', 'SOCIOLOGIA', 'FISICA', 'QUIMICA', 'BIOLOGIA', 'MATEMATICA', 'REDACAO');

-- CreateEnum
CREATE TYPE "question_types" AS ENUM ('ENEM_OFFICIAL', 'CHATBOT_GENERATED');

-- CreateEnum
CREATE TYPE "answer_options" AS ENUM ('A', 'B', 'C', 'D', 'E');

-- CreateEnum
CREATE TYPE "study_session_types" AS ENUM ('QUESTION_BANK', 'CHATBOT', 'FLASHCARDS');

-- CreateEnum
CREATE TYPE "review_difficulties" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "questions" (
    "id_question" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "optionE" TEXT NOT NULL,
    "correctOption" "answer_options" NOT NULL,
    "explanation" TEXT,
    "type" "question_types" NOT NULL,
    "subject" "subjects" NOT NULL,
    "topic" TEXT,
    "examYear" INTEGER,
    "id_chatbot_session" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id_question")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id_flashcard" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "subject" "subjects" NOT NULL,
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastReviewedAt" TIMESTAMP(3),

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id_flashcard")
);

-- CreateTable
CREATE TABLE "question_attempts" (
    "id_attempt" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "id_question" TEXT NOT NULL,
    "id_study_session" TEXT,
    "userAnswer" "answer_options" NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "responseTimeSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_attempts_pkey" PRIMARY KEY ("id_attempt")
);

-- CreateTable
CREATE TABLE "chatbot_sessions" (
    "id_chatbot_session" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "requestedTopic" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_sessions_pkey" PRIMARY KEY ("id_chatbot_session")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id_study_session" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "type" "study_session_types" NOT NULL,
    "examYear" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id_study_session")
);

-- CreateTable
CREATE TABLE "flashcard_reviews" (
    "id_review" TEXT NOT NULL,
    "id_flashcard" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "difficulty" "review_difficulties" NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flashcard_reviews_pkey" PRIMARY KEY ("id_review")
);

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_id_chatbot_session_fkey" FOREIGN KEY ("id_chatbot_session") REFERENCES "chatbot_sessions"("id_chatbot_session") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_id_question_fkey" FOREIGN KEY ("id_question") REFERENCES "questions"("id_question") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_id_study_session_fkey" FOREIGN KEY ("id_study_session") REFERENCES "study_sessions"("id_study_session") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_sessions" ADD CONSTRAINT "chatbot_sessions_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_id_flashcard_fkey" FOREIGN KEY ("id_flashcard") REFERENCES "flashcards"("id_flashcard") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;
