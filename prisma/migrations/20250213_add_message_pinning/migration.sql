-- Add message pinning fields
ALTER TABLE "messages" 
ADD COLUMN "is_pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "pinned_at" TIMESTAMP(3),
ADD COLUMN "pinned_by" TEXT;

-- Add index for pinned messages
CREATE INDEX "messages_channel_id_is_pinned_idx" ON "messages"("channel_id", "is_pinned");

-- Add foreign key for pinner
ALTER TABLE "messages" ADD CONSTRAINT "messages_pinned_by_fkey" FOREIGN KEY ("pinned_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;