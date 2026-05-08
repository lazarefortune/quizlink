-- AlterTable
ALTER TABLE `quizzes` ADD COLUMN `featured_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `quizzes_featured_at_idx` ON `quizzes`(`featured_at`);
