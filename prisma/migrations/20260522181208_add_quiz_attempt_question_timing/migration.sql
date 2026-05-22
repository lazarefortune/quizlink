-- AlterTable
ALTER TABLE `quiz_answers` ADD COLUMN `expired` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `quiz_attempts` ADD COLUMN `duration_seconds` INTEGER NULL,
    ADD COLUMN `identity_mode` VARCHAR(191) NOT NULL DEFAULT 'ANONYMOUS',
    ADD COLUMN `total_questions` INTEGER NULL;

-- CreateTable
CREATE TABLE `quiz_attempt_questions` (
    `id` VARCHAR(191) NOT NULL,
    `attempt_id` VARCHAR(191) NOT NULL,
    `question_id` VARCHAR(191) NOT NULL,
    `started_at` DATETIME(3) NOT NULL,
    `deadline_at` DATETIME(3) NULL,
    `answered_at` DATETIME(3) NULL,
    `time_spent_seconds` INTEGER NULL,
    `expired` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `quiz_attempt_questions_attempt_id_idx`(`attempt_id`),
    UNIQUE INDEX `quiz_attempt_questions_attempt_id_question_id_key`(`attempt_id`, `question_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `quiz_attempts_identity_mode_idx` ON `quiz_attempts`(`identity_mode`);

-- AddForeignKey
ALTER TABLE `quiz_attempt_questions` ADD CONSTRAINT `quiz_attempt_questions_attempt_id_fkey` FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_attempt_questions` ADD CONSTRAINT `quiz_attempt_questions_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
