-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "examNumber" INTEGER,
ADD COLUMN     "statementImage" TEXT,
ALTER COLUMN "subject" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "questions_examYear_examNumber_key" ON "questions"("examYear", "examNumber");

