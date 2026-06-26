-- AlterTable
ALTER TABLE `pending_signups` ADD COLUMN `last_code_sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
