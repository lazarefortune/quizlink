-- AlterTable
ALTER TABLE `quizzes` ADD COLUMN `created_by_admin_id` VARCHAR(191) NULL,
    ADD COLUMN `updated_by_admin_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `quizzes_created_by_admin_id_idx` ON `quizzes`(`created_by_admin_id`);

-- CreateIndex
CREATE INDEX `quizzes_updated_by_admin_id_idx` ON `quizzes`(`updated_by_admin_id`);

-- AddForeignKey
ALTER TABLE `quizzes` ADD CONSTRAINT `quizzes_created_by_admin_id_fkey` FOREIGN KEY (`created_by_admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quizzes` ADD CONSTRAINT `quizzes_updated_by_admin_id_fkey` FOREIGN KEY (`updated_by_admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
