-- AlterTable
ALTER TABLE `participants` ADD COLUMN `public_token` VARCHAR(24) NULL,
    ADD COLUMN `is_portal_enabled` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `participants_public_token_key` ON `participants`(`public_token`);

-- CreateIndex
CREATE INDEX `participants_public_token_idx` ON `participants`(`public_token`);
