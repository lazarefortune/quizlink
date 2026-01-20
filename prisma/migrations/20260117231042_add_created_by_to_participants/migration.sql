-- AlterTable
ALTER TABLE `participants` ADD COLUMN `created_by_user_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `participants_created_by_user_id_idx` ON `participants`(`created_by_user_id`);

-- AddForeignKey
ALTER TABLE `participants` ADD CONSTRAINT `participants_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
