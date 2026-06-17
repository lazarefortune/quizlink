-- Drop legacy 7-day campaign / unlock-until fields from quiz_links.
-- V1 payment model was never in production; quota model is the source of truth.

ALTER TABLE `quiz_links` DROP INDEX `quiz_links_accepting_responses_until_idx`;
ALTER TABLE `quiz_links` DROP INDEX `quiz_links_details_visible_until_idx`;
ALTER TABLE `quiz_links` DROP INDEX `quiz_links_unlocked_until_idx`;

ALTER TABLE `quiz_links` DROP COLUMN `accepting_responses_until`;
ALTER TABLE `quiz_links` DROP COLUMN `details_visible_until`;
ALTER TABLE `quiz_links` DROP COLUMN `unlocked_until`;
