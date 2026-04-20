/*
  Warnings:

  - Added the required column `title` to the `Goal` table without a default value. This is not possible if the table is not empty.

*/
-- Add title column first so existing rows can be populated safely
ALTER TABLE "public"."Goal" ADD COLUMN "title" TEXT;

-- Copy the existing text into title for existing goals
UPDATE "public"."Goal" SET "title" = "text" WHERE "title" IS NULL;

-- Make title required now that every row has a value
ALTER TABLE "public"."Goal" ALTER COLUMN "title" SET NOT NULL;

-- Add the remaining new columns with safe defaults
ALTER TABLE "public"."Goal"
  ADD COLUMN "completedSessions" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "totalSessions" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "totalTime" INTEGER NOT NULL DEFAULT 0;
