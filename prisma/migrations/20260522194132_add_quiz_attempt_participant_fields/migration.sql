-- AlterTable
ALTER TABLE `quiz_attempts` ADD COLUMN `participant_email` VARCHAR(191) NULL,
    ADD COLUMN `participant_name` VARCHAR(100) NULL;
