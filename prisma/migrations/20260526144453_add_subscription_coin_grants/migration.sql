-- CreateTable
CREATE TABLE `subscription_coin_grants` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `subscription_id` VARCHAR(191) NOT NULL,
    `stripe_subscription_id` VARCHAR(191) NOT NULL,
    `stripe_invoice_id` VARCHAR(191) NULL,
    `stripe_price_id` VARCHAR(191) NULL,
    `coins_granted` INTEGER NOT NULL,
    `period_start` DATETIME(3) NOT NULL,
    `period_end` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `subscription_coin_grants_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `subscription_coin_grants_subscription_id_idx`(`subscription_id`),
    UNIQUE INDEX `subscription_coin_grants_stripe_subscription_id_period_start_key`(`stripe_subscription_id`, `period_start`, `period_end`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subscription_coin_grants` ADD CONSTRAINT `subscription_coin_grants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription_coin_grants` ADD CONSTRAINT `subscription_coin_grants_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `user_subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
