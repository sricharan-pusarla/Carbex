-- ============================================================
-- STEP 1: Audit + Hardening
-- Branch: feature/range-ledger
-- ============================================================

-- 1. Ensure btree_gist is installed (needed for Step 2 exclusion constraints)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- 2. FLOAT → NUMERIC(14,2)
--    Applies to: CarbonProject.pricePerCredit, availableCredits (INT stays),
--                Listing.pricePerCredit, Transaction.pricePerCredit, Transaction.totalAmount
-- ============================================================

ALTER TABLE "CarbonProject"
  ALTER COLUMN "pricePerCredit" TYPE NUMERIC(14,2)
    USING "pricePerCredit"::NUMERIC(14,2);

ALTER TABLE "Listing"
  ALTER COLUMN "pricePerCredit" TYPE NUMERIC(14,2)
    USING "pricePerCredit"::NUMERIC(14,2);

ALTER TABLE "Transaction"
  ALTER COLUMN "pricePerCredit" TYPE NUMERIC(14,2)
    USING "pricePerCredit"::NUMERIC(14,2),
  ALTER COLUMN "totalAmount"    TYPE NUMERIC(14,2)
    USING "totalAmount"::NUMERIC(14,2);

-- ============================================================
-- 3. timestamp without time zone → timestamptz
-- ============================================================

ALTER TABLE "User"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ
    USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "CarbonProject"
  ALTER COLUMN "createdAt"        TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "projectStartDate" TYPE TIMESTAMPTZ USING "projectStartDate" AT TIME ZONE 'UTC',
  ALTER COLUMN "verificationDate" TYPE TIMESTAMPTZ USING "verificationDate" AT TIME ZONE 'UTC';

ALTER TABLE "CarbonCredit"
  ALTER COLUMN "issuedAt" TYPE TIMESTAMPTZ USING "issuedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Listing"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "Transaction"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "Retirement"
  ALTER COLUMN "retiredAt" TYPE TIMESTAMPTZ USING "retiredAt" AT TIME ZONE 'UTC';

-- ============================================================
-- 4. Business-rule CHECK constraints
-- ============================================================

-- availableCredits must be between 0 and totalCredits (inclusive)
ALTER TABLE "CarbonProject"
  ADD CONSTRAINT chk_available_credits_range
    CHECK ("availableCredits" >= 0 AND "availableCredits" <= "totalCredits");

-- totalCredits must be positive
ALTER TABLE "CarbonProject"
  ADD CONSTRAINT chk_total_credits_positive
    CHECK ("totalCredits" > 0);

-- pricePerCredit must be positive (CarbonProject, Listing, Transaction)
ALTER TABLE "CarbonProject"
  ADD CONSTRAINT chk_project_price_positive
    CHECK ("pricePerCredit" > 0);

ALTER TABLE "Listing"
  ADD CONSTRAINT chk_listing_price_positive
    CHECK ("pricePerCredit" > 0);

ALTER TABLE "Listing"
  ADD CONSTRAINT chk_listing_quantity_positive
    CHECK ("quantity" > 0);

ALTER TABLE "Transaction"
  ADD CONSTRAINT chk_tx_price_positive
    CHECK ("pricePerCredit" > 0);

ALTER TABLE "Transaction"
  ADD CONSTRAINT chk_tx_quantity_positive
    CHECK ("quantity" > 0);

ALTER TABLE "Transaction"
  ADD CONSTRAINT chk_tx_total_positive
    CHECK ("totalAmount" > 0);

-- CreditOwnership quantity must be positive
ALTER TABLE "CreditOwnership"
  ADD CONSTRAINT chk_ownership_quantity_positive
    CHECK ("quantity" > 0);

-- Retirement quantity must be positive
ALTER TABLE "Retirement"
  ADD CONSTRAINT chk_retirement_quantity_positive
    CHECK ("quantity" > 0);

-- ============================================================
-- 5. Add missing FK on CarbonCredit.currentOwnerId → User.id
-- ============================================================

ALTER TABLE "CarbonCredit"
  ADD CONSTRAINT fk_carbon_credit_current_owner
    FOREIGN KEY ("currentOwnerId") REFERENCES "User"("id");

-- ============================================================
-- 6. Replace find-then-create ownership pattern:
--    Add an ON CONFLICT DO UPDATE (upsert) index to support
--    INSERT ... ON CONFLICT ON CONSTRAINT ... DO UPDATE.
--    The UNIQUE constraint already exists from Prisma (@@unique([userId, projectId])).
--    We just name it explicitly so application code can reference it.
-- ============================================================

-- The constraint name Prisma generates is: CreditOwnership_userId_projectId_key
-- We alias it as a named constraint for clarity in upsert SQL.
-- (No DDL needed — constraint already exists, we document the upsert pattern here.)

-- ============================================================
-- VERIFICATION: Confirm the CHECK fires on a bad insert
-- (This will fail with an error, proving the constraint works)
-- We do this in a transaction so it auto-rolls back cleanly.
-- ============================================================
DO $$
DECLARE
  test_project_id TEXT;
BEGIN
  -- Grab any project id
  SELECT id INTO test_project_id FROM "CarbonProject" LIMIT 1;

  -- Try to violate chk_available_credits_range (availableCredits > totalCredits)
  BEGIN
    UPDATE "CarbonProject"
       SET "availableCredits" = "totalCredits" + 9999
     WHERE id = test_project_id;
    RAISE EXCEPTION 'CHECK should have blocked this — CONSTRAINT NOT WORKING';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'CHECK constraint chk_available_credits_range CORRECTLY REJECTED the violation: %', SQLERRM;
  END;

  -- Try to violate chk_total_credits_positive (totalCredits = -1)
  BEGIN
    UPDATE "CarbonProject"
       SET "totalCredits" = -1
     WHERE id = test_project_id;
    RAISE EXCEPTION 'CHECK should have blocked this — CONSTRAINT NOT WORKING';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'CHECK constraint chk_total_credits_positive CORRECTLY REJECTED the violation: %', SQLERRM;
  END;
END;
$$;
