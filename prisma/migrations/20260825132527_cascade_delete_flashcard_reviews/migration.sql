-- DropForeignKey
ALTER TABLE "flashcard_reviews" DROP CONSTRAINT "flashcard_reviews_id_flashcard_fkey";

-- AddForeignKey
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_id_flashcard_fkey" FOREIGN KEY ("id_flashcard") REFERENCES "flashcards"("id_flashcard") ON DELETE CASCADE ON UPDATE CASCADE;
