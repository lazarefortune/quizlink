-- AlterTable: Prevent cascade delete of quiz_answers when a question is deleted.
-- This preserves attempt details when questions are kept (e.g. quiz not re-saved).
-- Dropping and re-adding the foreign key to change ON DELETE from CASCADE to RESTRICT.
ALTER TABLE `quiz_answers` DROP FOREIGN KEY `quiz_answers_question_id_fkey`;
ALTER TABLE `quiz_answers` ADD CONSTRAINT `quiz_answers_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
