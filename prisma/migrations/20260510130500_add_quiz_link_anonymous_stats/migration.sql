-- CreateTable
CREATE TABLE `quiz_link_anonymous_stats` (
    `quiz_link_id` VARCHAR(191) NOT NULL,
    `open_count` INTEGER NOT NULL DEFAULT 0,
    `started_count` INTEGER NOT NULL DEFAULT 0,
    `completed_count` INTEGER NOT NULL DEFAULT 0,
    `score_sum` DOUBLE NOT NULL DEFAULT 0,
    `score_count` INTEGER NOT NULL DEFAULT 0,
    `best_score` DOUBLE NULL,
    `lowest_score` DOUBLE NULL,
    `last_opened_at` DATETIME(3) NULL,
    `last_started_at` DATETIME(3) NULL,
    `last_completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`quiz_link_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `quiz_link_anonymous_stats` ADD CONSTRAINT `quiz_link_anonymous_stats_quiz_link_id_fkey` FOREIGN KEY (`quiz_link_id`) REFERENCES `quiz_links`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
