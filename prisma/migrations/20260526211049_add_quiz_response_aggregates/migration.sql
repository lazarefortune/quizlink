-- CreateTable
CREATE TABLE `quiz_response_stats` (
    `id` VARCHAR(191) NOT NULL,
    `quiz_id` VARCHAR(191) NOT NULL,
    `total_started` INTEGER NOT NULL DEFAULT 0,
    `total_completed` INTEGER NOT NULL DEFAULT 0,
    `total_abandoned` INTEGER NOT NULL DEFAULT 0,
    `total_score` DOUBLE NOT NULL DEFAULT 0,
    `total_possible_score` DOUBLE NOT NULL DEFAULT 0,
    `total_duration_seconds` INTEGER NOT NULL DEFAULT 0,
    `completed_duration_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `quiz_response_stats_quiz_id_key`(`quiz_id`),
    INDEX `quiz_response_stats_quiz_id_idx`(`quiz_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quiz_question_response_stats` (
    `id` VARCHAR(191) NOT NULL,
    `quiz_id` VARCHAR(191) NOT NULL,
    `question_id` VARCHAR(191) NOT NULL,
    `total_answers` INTEGER NOT NULL DEFAULT 0,
    `correct_answers` INTEGER NOT NULL DEFAULT 0,
    `expired_answers` INTEGER NOT NULL DEFAULT 0,
    `total_time_spent_seconds` INTEGER NOT NULL DEFAULT 0,
    `time_spent_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `quiz_question_response_stats_quiz_id_idx`(`quiz_id`),
    INDEX `quiz_question_response_stats_question_id_idx`(`question_id`),
    UNIQUE INDEX `quiz_question_response_stats_quiz_id_question_id_key`(`quiz_id`, `question_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `quiz_response_stats` ADD CONSTRAINT `quiz_response_stats_quiz_id_fkey` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_question_response_stats` ADD CONSTRAINT `quiz_question_response_stats_quiz_id_fkey` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_question_response_stats` ADD CONSTRAINT `quiz_question_response_stats_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
