-- CreateTable
CREATE TABLE `quiz_unlocks` (
    `id` VARCHAR(191) NOT NULL,
    `quiz_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` ENUM('SINGLE_QUIZ', 'SUBSCRIPTION', 'ADMIN', 'PROMO') NOT NULL,
    `source` ENUM('COINS', 'STRIPE_SUBSCRIPTION', 'MANUAL') NOT NULL,
    `coins_spent` INTEGER NULL,
    `starts_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `quiz_unlocks_quiz_id_user_id_idx`(`quiz_id`, `user_id`),
    INDEX `quiz_unlocks_user_id_expires_at_idx`(`user_id`, `expires_at`),
    INDEX `quiz_unlocks_quiz_id_expires_at_idx`(`quiz_id`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `quiz_unlocks` ADD CONSTRAINT `quiz_unlocks_quiz_id_fkey` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_unlocks` ADD CONSTRAINT `quiz_unlocks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
