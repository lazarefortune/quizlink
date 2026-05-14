-- AlterTable
ALTER TABLE `quizzes` ADD COLUMN `status` ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `published_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `quizzes_status_idx` ON `quizzes`(`status`);
