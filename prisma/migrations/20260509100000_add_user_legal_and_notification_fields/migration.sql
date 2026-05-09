-- AlterTable
ALTER TABLE `users` ADD COLUMN `terms_accepted_at` DATETIME(3) NULL,
    ADD COLUMN `terms_version` VARCHAR(20) NULL,
    ADD COLUMN `privacy_accepted_at` DATETIME(3) NULL,
    ADD COLUMN `privacy_version` VARCHAR(20) NULL,
    ADD COLUMN `welcome_email_sent_at` DATETIME(3) NULL,
    ADD COLUMN `notify_quiz_responses` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notify_product_updates` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `notify_marketing` BOOLEAN NOT NULL DEFAULT false;
