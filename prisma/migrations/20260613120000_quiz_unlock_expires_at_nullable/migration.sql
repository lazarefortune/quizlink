-- AlterTable
ALTER TABLE `quiz_unlocks` MODIFY `expires_at` DATETIME(3) NULL;

-- Permanent coin unlocks (null = no expiry)
UPDATE `quiz_unlocks` SET `expires_at` = NULL WHERE `source` = 'COINS';
