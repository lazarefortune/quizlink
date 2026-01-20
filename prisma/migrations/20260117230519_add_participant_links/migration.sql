-- AlterTable
ALTER TABLE `quiz_links` ADD COLUMN `participant_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `quiz_links_participant_id_idx` ON `quiz_links`(`participant_id`);

-- AddForeignKey
ALTER TABLE `quiz_links` ADD CONSTRAINT `quiz_links_participant_id_fkey` FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
