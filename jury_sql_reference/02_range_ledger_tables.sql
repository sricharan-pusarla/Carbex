-- ============================================================
-- 02. IMMUTABLE LEDGER LAYER (PostgreSQL Native Tables)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Registry Table: Links a CarbonProject to the Ledger
CREATE TABLE "registry" (
    "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId"   TEXT NOT NULL REFERENCES "CarbonProject"("id") UNIQUE,
    "name"        TEXT NOT NULL,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit Range Table: The Immutable Ownership Ledger
CREATE TABLE "credit_range" (
    "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "registry_id"  TEXT NOT NULL REFERENCES "registry"("id"),
    "serial_range" INT8RANGE NOT NULL,
    "owner_id"     TEXT NOT NULL REFERENCES "User"("id"),
    "status"       TEXT NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'RETIRED'
    
    -- CRITICAL CONSTRAINT: Mathematically guarantees zero overlapping serial numbers
    CONSTRAINT no_overlapping_ranges EXCLUDE USING gist (
        "registry_id" WITH =,
        "serial_range" WITH &&
    )
);

-- Ledger Event Table: The Cryptographic Audit Log
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
