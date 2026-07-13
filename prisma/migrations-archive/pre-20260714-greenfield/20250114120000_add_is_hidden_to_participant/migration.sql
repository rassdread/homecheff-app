-- Add isHidden field to ConversationParticipant
-- This migration is safe and will not cause data loss
ALTER TABLE "ConversationParticipant" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS "idx_conversation_participant_hidden" ON "ConversationParticipant"("isHidden");

-- Also clean up any old deletedAt timestamps on messages (we don't use this anymore)
-- This will make all messages visible again
UPDATE "Message" SET "deletedAt" = NULL WHERE "deletedAt" IS NOT NULL;

