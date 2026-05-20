-- AlterTable
ALTER TABLE `feedbacks` ADD COLUMN `quiz_id` VARCHAR(191) NULL,
    ADD COLUMN `rating` INTEGER NULL,
    ADD COLUMN `feature_request` TEXT NULL,
    ADD COLUMN `category` VARCHAR(50) NULL,
    ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- AlterTable: message becomes optional
ALTER TABLE `feedbacks` MODIFY `message` TEXT NULL;
