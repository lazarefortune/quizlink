-- AlterTable
ALTER TABLE `quizzes` ADD COLUMN `expires_at` DATETIME(3) NULL,
    ADD COLUMN `is_anonymous` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `quizzes_is_anonymous_idx` ON `quizzes`(`is_anonymous`);

-- CreateIndex
CREATE INDEX `quizzes_expires_at_idx` ON `quizzes`(`expires_at`);
