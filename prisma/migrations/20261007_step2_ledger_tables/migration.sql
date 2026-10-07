-- ============================================================
-- STEP 2: Ledger Tables & Data Migration
-- Branch: feature/range-ledger
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create the `registry` table
CREATE TABLE "registry" (
    "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId"   TEXT NOT NULL REFERENCES "CarbonProject"("id") UNIQUE,
    "name"        TEXT NOT NULL,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create the `credit_range` table with GiST exclusion constraint
CREATE TABLE "credit_range" (
    "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "registry_id"  TEXT NOT NULL REFERENCES "registry"("id"),
    "serial_range" INT8RANGE NOT NULL,
    "owner_id"     TEXT NOT NULL REFERENCES "User"("id"),
    "status"       TEXT NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'RETIRED'
    
    -- No overlapping serial numbers within the same registry!
    CONSTRAINT no_overlapping_ranges EXCLUDE USING gist (
        "registry_id" WITH =,
        "serial_range" WITH &&
    )
);

-- 3. Create the `ledger_event` (append-only audit log)
CREATE TABLE "ledger_event" (
    "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "registry_id"   TEXT NOT NULL REFERENCES "registry"("id"),
    "event_type"    TEXT NOT NULL, -- 'ISSUE', 'TRANSFER', 'RETIRE'
    "serial_range"  INT8RANGE NOT NULL,
    "from_owner_id" TEXT, -- NULL if ISSUE
    "to_owner_id"   TEXT NOT NULL,
    "quantity"      INT8 NOT NULL,
    "prev_hash"     TEXT,
    "hash"          TEXT NOT NULL,
    "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. Data Migration: Existing projects to the ledger
-- ============================================================
DO $$
DECLARE
    p_record RECORD;
    reg_id TEXT;
    q_total INT8;
    q_avail INT8;
    q_sold INT8;
    current_start INT8;
    sys_admin_id TEXT;
    
    o_record RECORD;
    buyer_start INT8;
    
    first_hash TEXT;
    second_hash TEXT;
BEGIN
    -- Get the platform admin ID for issuance
    SELECT "id" INTO sys_admin_id FROM "User" WHERE "role" = 'ADMIN' LIMIT 1;
    IF sys_admin_id IS NULL THEN
        -- Fallback if no admin exists
        SELECT "id" INTO sys_admin_id FROM "User" LIMIT 1;
    END IF;

    FOR p_record IN SELECT * FROM "CarbonProject" LOOP
        -- Create registry for project
        INSERT INTO "registry" ("projectId", "name") 
        VALUES (p_record."id", 'Registry for ' || p_record."name")
        RETURNING "id" INTO reg_id;
        
        q_total := p_record."totalCredits";
        q_avail := p_record."availableCredits";
        q_sold := q_total - q_avail;
        
        -- We will issue credits starting at serial number 1
        current_start := 1;
        
        -- A. First, process already sold credits (CreditOwnership table)
        FOR o_record IN 
            SELECT "userId", "quantity" FROM "CreditOwnership" WHERE "projectId" = p_record."id"
        LOOP
            buyer_start := current_start;
            
            -- Insert the active range for this buyer
            INSERT INTO "credit_range" ("registry_id", "serial_range", "owner_id", "status")
            VALUES (reg_id, int8range(buyer_start, buyer_start + o_record."quantity", '[)'), o_record."userId", 'AVAILABLE');
            
            -- Insert Issue Event
            first_hash := encode(digest(reg_id || 'ISSUE' || buyer_start::text || o_record."quantity"::text || COALESCE(NULL, ''), 'sha256'), 'hex');
            INSERT INTO "ledger_event" ("registry_id", "event_type", "serial_range", "from_owner_id", "to_owner_id", "quantity", "prev_hash", "hash")
            VALUES (reg_id, 'ISSUE', int8range(buyer_start, buyer_start + o_record."quantity", '[)'), NULL, o_record."userId", o_record."quantity", NULL, first_hash);
            
            current_start := current_start + o_record."quantity";
        END LOOP;
        
        -- B. Next, process retired credits (Retirement table)
        FOR o_record IN 
            SELECT "userId", "quantity" FROM "Retirement" WHERE "projectId" = p_record."id"
        LOOP
            buyer_start := current_start;
            
            -- Insert the RETIRED range
            INSERT INTO "credit_range" ("registry_id", "serial_range", "owner_id", "status")
            VALUES (reg_id, int8range(buyer_start, buyer_start + o_record."quantity", '[)'), o_record."userId", 'RETIRED');
            
            -- Insert Issue Event
            first_hash := encode(digest(reg_id || 'ISSUE' || buyer_start::text || o_record."quantity"::text || COALESCE(NULL, ''), 'sha256'), 'hex');
            INSERT INTO "ledger_event" ("registry_id", "event_type", "serial_range", "from_owner_id", "to_owner_id", "quantity", "prev_hash", "hash")
            VALUES (reg_id, 'ISSUE', int8range(buyer_start, buyer_start + o_record."quantity", '[)'), NULL, o_record."userId", o_record."quantity", NULL, first_hash);
            
            -- Note: in a true history we would issue to seller -> transfer to buyer -> retire. 
            -- For migration, we jump straight to the current end state to match existing totals.
            
            current_start := current_start + o_record."quantity";
        END LOOP;
        
        -- C. Finally, the remaining available credits belong to the project developer/admin
        IF current_start <= q_total THEN
            -- Assuming the admin holds the unsold credits for the developer
            INSERT INTO "credit_range" ("registry_id", "serial_range", "owner_id", "status")
            VALUES (reg_id, int8range(current_start, q_total + 1, '[)'), sys_admin_id, 'AVAILABLE');
            
            first_hash := encode(digest(reg_id || 'ISSUE' || current_start::text || (q_total - current_start + 1)::text || COALESCE(NULL, ''), 'sha256'), 'hex');
            INSERT INTO "ledger_event" ("registry_id", "event_type", "serial_range", "from_owner_id", "to_owner_id", "quantity", "prev_hash", "hash")
            VALUES (reg_id, 'ISSUE', int8range(current_start, q_total + 1, '[)'), NULL, sys_admin_id, (q_total - current_start + 1), NULL, first_hash);
        END IF;

    END LOOP;
END;
$$;
