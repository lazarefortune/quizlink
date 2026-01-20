/*
  Warnings:

  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- First add columns as nullable
ALTER TABLE `users` ADD COLUMN `name` VARCHAR(255) NULL,
    ADD COLUMN `preferred_language` VARCHAR(191) NOT NULL DEFAULT 'fr';

-- Set default name for existing users (use email prefix)
UPDATE `users` SET `name` = SUBSTRING_INDEX(`email`, '@', 1) WHERE `name` IS NULL;

-- Now make name required
ALTER TABLE `users` MODIFY COLUMN `name` VARCHAR(255) NOT NULL;

-- CreateTable
CREATE TABLE `email_change_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `new_email` VARCHAR(191) NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `email_change_tokens_user_id_idx`(`user_id`),
    INDEX `email_change_tokens_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `email_change_tokens` ADD CONSTRAINT `email_change_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
