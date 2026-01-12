-- Remove APPOINTMENT stage from CrmDealStage enum
-- First, update any deals with APPOINTMENT stage to VISIT stage
UPDATE crm_deals SET stage = 'VISIT' WHERE stage = 'APPOINTMENT';

-- Drop and recreate the enum without APPOINTMENT
-- Note: PostgreSQL doesn't support removing enum values directly, so we need to:
-- 1. Create a new enum
CREATE TYPE "CrmDealStage_new" AS ENUM ('NEW', 'QUALIFIED', 'VISIT', 'NEGOTIATION', 'WON', 'LOST');

-- 2. Remove the default value temporarily
ALTER TABLE "crm_deals" ALTER COLUMN "stage" DROP DEFAULT;

-- 3. Update the column to use the new enum
ALTER TABLE "crm_deals" ALTER COLUMN "stage" TYPE "CrmDealStage_new" USING ("stage"::text::"CrmDealStage_new");

-- 4. Restore the default value
ALTER TABLE "crm_deals" ALTER COLUMN "stage" SET DEFAULT 'NEW'::"CrmDealStage_new";

-- 5. Drop the old enum
DROP TYPE "CrmDealStage";

-- 6. Rename the new enum to the original name
ALTER TYPE "CrmDealStage_new" RENAME TO "CrmDealStage";

