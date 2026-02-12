-- Idempotent migration (MySQL): add columns and indexes only if they do not exist.
-- Fixes P3018 / Duplicate column when migration is re-run (e.g. columns already in prod).

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participants' AND COLUMN_NAME = 'public_token') = 0,
  'ALTER TABLE `participants` ADD COLUMN `public_token` VARCHAR(24) NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participants' AND COLUMN_NAME = 'is_portal_enabled') = 0,
  'ALTER TABLE `participants` ADD COLUMN `is_portal_enabled` BOOLEAN NOT NULL DEFAULT false',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participants' AND INDEX_NAME = 'participants_public_token_key') = 0,
  'CREATE UNIQUE INDEX `participants_public_token_key` ON `participants`(`public_token`)',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participants' AND INDEX_NAME = 'participants_public_token_idx') = 0,
  'CREATE INDEX `participants_public_token_idx` ON `participants`(`public_token`)',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
