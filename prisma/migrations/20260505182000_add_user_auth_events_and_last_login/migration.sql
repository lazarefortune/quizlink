-- AlterTable
ALTER TABLE `users` ADD COLUMN `last_login_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `user_auth_events` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NULL,
  `event_type` VARCHAR(50) NOT NULL,
  `auth_provider` VARCHAR(50) NULL,
  `ip_address_hash` VARCHAR(64) NULL,
  `user_agent` VARCHAR(500) NULL,
  `failure_reason` VARCHAR(100) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `user_auth_events_user_id_idx`(`user_id`),
  INDEX `user_auth_events_event_type_idx`(`event_type`),
  INDEX `user_auth_events_created_at_idx`(`created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_auth_events`
  ADD CONSTRAINT `user_auth_events_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
