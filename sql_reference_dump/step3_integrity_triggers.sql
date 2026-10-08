-- ============================================================
-- STEP 3: Integrity Triggers & Tamper-Evident Hash Chain
-- Branch: feature/range-ledger
-- ============================================================

-- ============================================================
-- 1. Block UPDATE/DELETE on ledger_event
-- ============================================================
CREATE OR REPLACE FUNCTION block_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Ledger events are append-only. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ledger_event_no_mutation
BEFORE UPDATE OR DELETE ON "ledger_event"
FOR EACH ROW EXECUTE FUNCTION block_ledger_mutation();

-- Also block UPDATE/DELETE on legacy Transaction and Retirement tables to maintain financial history integrity
CREATE TRIGGER trg_transaction_no_mutation
BEFORE UPDATE OR DELETE ON "Transaction"
FOR EACH ROW EXECUTE FUNCTION block_ledger_mutation();

CREATE TRIGGER trg_retirement_no_mutation
BEFORE UPDATE OR DELETE ON "Retirement"
FOR EACH ROW EXECUTE FUNCTION block_ledger_mutation();

-- ============================================================
-- 2. State machine on credit_range (RETIRED is permanent)
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_credit_state_machine()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'RETIRED' AND NEW.status != 'RETIRED' THEN
        RAISE EXCEPTION 'Once a credit range is RETIRED, its status cannot be changed back.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_credit_range_status
BEFORE UPDATE ON "credit_range"
FOR EACH ROW EXECUTE FUNCTION enforce_credit_state_machine();

-- ============================================================
-- 3. Hash-chaining trigger (tamper-evident audit log)
-- ============================================================
CREATE OR REPLACE FUNCTION hash_chain_ledger_event()
RETURNS TRIGGER AS $$
DECLARE
    last_event RECORD;
    lock_obtained BOOLEAN;
    lock_id bigint;
BEGIN
    -- We derive a 64-bit advisory lock ID from the registry_id to serialize writes per registry
    lock_id := ('x' || substr(md5(NEW.registry_id), 1, 16))::bit(64)::bigint;

    -- Acquire transaction-level exclusive lock for this registry
    -- This prevents race conditions when computing the hash chain
    PERFORM pg_advisory_xact_lock(lock_id);

    -- Find the chronologically latest event for this registry
    SELECT * INTO last_event
    FROM "ledger_event"
    WHERE registry_id = NEW.registry_id
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    IF FOUND THEN
        NEW.prev_hash := last_event.hash;
    ELSE
        NEW.prev_hash := NULL;
    END IF;

    -- The payload includes registry, event type, serial boundaries, quantity, and the PREVIOUS hash.
    -- Any tampering with a past row invalidates all subsequent hashes.
    NEW.hash := encode(digest(
        NEW.registry_id || 
        NEW.event_type || 
        NEW.serial_range::text || 
        NEW.quantity::text || 
        COALESCE(NEW.prev_hash, ''), 
        'sha256'
    ), 'hex');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hash_chain_insert
BEFORE INSERT ON "ledger_event"
FOR EACH ROW EXECUTE FUNCTION hash_chain_ledger_event();

-- ============================================================
-- 4. Audit Function: verify_ledger_chain()
-- ============================================================
-- Iterates over a registry's events chronologically and recalculates the hash.
-- Returns the ID of the first broken row, or NULL if the chain is fully valid.
CREATE OR REPLACE FUNCTION verify_ledger_chain(p_registry_id TEXT)
RETURNS TEXT AS $$
DECLARE
    event_rec RECORD;
    expected_prev_hash TEXT := NULL;
    computed_hash TEXT;
BEGIN
    FOR event_rec IN 
        SELECT * FROM "ledger_event" 
        WHERE registry_id = p_registry_id 
        ORDER BY created_at ASC, id ASC
    LOOP
        -- 1. Check prev_hash linkage
        IF COALESCE(event_rec.prev_hash, '') != COALESCE(expected_prev_hash, '') THEN
            RAISE NOTICE 'Chain broken at event %: prev_hash mismatch. Expected %, got %', event_rec.id, expected_prev_hash, event_rec.prev_hash;
            RETURN event_rec.id;
        END IF;

        -- 2. Check data integrity
        computed_hash := encode(digest(
            event_rec.registry_id || 
            event_rec.event_type || 
            event_rec.serial_range::text || 
            event_rec.quantity::text || 
            COALESCE(event_rec.prev_hash, ''), 
            'sha256'
        ), 'hex');

        IF event_rec.hash != computed_hash THEN
            RAISE NOTICE 'Chain broken at event %: data payload tampered. Stored hash %, computed %', event_rec.id, event_rec.hash, computed_hash;
            RETURN event_rec.id;
        END IF;

        -- Update expected previous hash for the next iteration
        expected_prev_hash := event_rec.hash;
    END LOOP;

    RETURN NULL; -- Chain is intact
END;
$$ LANGUAGE plpgsql;
