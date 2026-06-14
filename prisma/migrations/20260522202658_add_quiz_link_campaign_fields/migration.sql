-- AlterTable
ALTER TABLE `quiz_links` ADD COLUMN `accepting_responses_until` DATETIME(3) NULL,
    ADD COLUMN `details_purged_at` DATETIME(3) NULL,
    ADD COLUMN `details_visible_until` DATETIME(3) NULL,
    ADD COLUMN `last_response_at` DATETIME(3) NULL,
    ADD COLUMN `responses_started_at` DATETIME(3) NULL,
    ADD COLUMN `unlocked_until` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `quiz_answers_question_id_is_correct_idx` ON `quiz_answers`(`question_id`, `is_correct`);

-- CreateIndex
CREATE INDEX `quiz_answers_question_id_expired_idx` ON `quiz_answers`(`question_id`, `expired`);

-- CreateIndex
CREATE INDEX `quiz_attempts_quiz_link_id_status_finished_at_idx` ON `quiz_attempts`(`quiz_link_id`, `status`, `finished_at`);

-- CreateIndex
CREATE INDEX `quiz_attempts_quiz_link_id_finished_at_idx` ON `quiz_attempts`(`quiz_link_id`, `finished_at`);

-- CreateIndex
CREATE INDEX `quiz_attempts_quiz_link_id_started_at_idx` ON `quiz_attempts`(`quiz_link_id`, `started_at`);

-- CreateIndex
CREATE INDEX `quiz_links_accepting_responses_until_idx` ON `quiz_links`(`accepting_responses_until`);

-- CreateIndex
CREATE INDEX `quiz_links_details_visible_until_idx` ON `quiz_links`(`details_visible_until`);

-- CreateIndex
CREATE INDEX `quiz_links_unlocked_until_idx` ON `quiz_links`(`unlocked_until`);
