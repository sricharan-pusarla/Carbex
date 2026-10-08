-- ============================================================
-- STEP 4: PL/pgSQL Functions for the Range Ledger
-- Branch: feature/range-ledger
-- ============================================================

-- ============================================================
-- 1. split_range
-- Shrinks an existing range and extracts a new chunk of p_split_quantity.
-- ============================================================
CREATE OR REPLACE FUNCTION split_range(
    p_range_id TEXT, 
    p_split_quantity INT8,
    OUT p_new_id TEXT,
    OUT p_new_range INT8RANGE
) AS $$
DECLARE
    v_range credit_range%ROWTYPE;
    v_lower INT8;
    v_upper INT8;
    v_size INT8;
BEGIN
    -- Acquire row lock to prevent concurrent splits
    SELECT * INTO v_range FROM credit_range WHERE id = p_range_id FOR UPDATE;
    
    v_lower := lower(v_range.serial_range);
    v_upper := upper(v_range.serial_range);
    v_size := v_upper - v_lower;
    
    IF v_size <= p_split_quantity THEN
        -- No split needed; return original
        p_new_id := v_range.id;
        p_new_range := v_range.serial_range;
        RETURN;
    END IF;
    
    -- Split: keep the remainder in the original row to preserve its history
    UPDATE credit_range 
    SET serial_range = int8range(v_lower + p_split_quantity, v_upper, '[)')
    WHERE id = p_range_id;
    
    -- Insert the extracted chunk
    INSERT INTO credit_range (registry_id, serial_range, owner_id, status)
    VALUES (
        v_range.registry_id, 
        int8range(v_lower, v_lower + p_split_quantity, '[)'), 
        v_range.owner_id, 
        v_range.status
    )
    RETURNING id, serial_range INTO p_new_id, p_new_range;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. transfer_credits
-- Transfers p_quantity credits from p_seller_id to p_buyer_id
-- ============================================================
CREATE OR REPLACE FUNCTION transfer_credits(
    p_registry_id TEXT, 
    p_seller_id TEXT, 
    p_buyer_id TEXT, 
    p_quantity INT8
) RETURNS BOOLEAN AS $$
DECLARE
    v_rem INT8 := p_quantity;
    v_row RECORD;
    v_split RECORD;
    v_range INT8RANGE;
    v_size INT8;
BEGIN
    FOR v_row IN 
        SELECT id, serial_range FROM credit_range 
        WHERE registry_id = p_registry_id AND owner_id = p_seller_id AND status = 'AVAILABLE'
        ORDER BY lower(serial_range)
        FOR UPDATE
    LOOP
        v_size := upper(v_row.serial_range) - lower(v_row.serial_range);
        
        IF v_size > v_rem THEN
            -- Split to extract exactly what's needed
            v_split := split_range(v_row.id, v_rem);
            v_range := v_split.p_new_range;
            
            -- Change owner of the extracted chunk
            UPDATE credit_range SET owner_id = p_buyer_id WHERE id = v_split.p_new_id;
            
            -- Log the event
            INSERT INTO ledger_event (registry_id, event_type, serial_range, from_owner_id, to_owner_id, quantity)
            VALUES (p_registry_id, 'TRANSFER', v_range, p_seller_id, p_buyer_id, v_rem);
            
            v_rem := 0;
            EXIT;
        ELSE
            -- Take the whole chunk
            v_range := v_row.serial_range;
            UPDATE credit_range SET owner_id = p_buyer_id WHERE id = v_row.id;
            
            INSERT INTO ledger_event (registry_id, event_type, serial_range, from_owner_id, to_owner_id, quantity)
            VALUES (p_registry_id, 'TRANSFER', v_range, p_seller_id, p_buyer_id, v_size);
            
            v_rem := v_rem - v_size;
            IF v_rem = 0 THEN
                EXIT;
            END IF;
        END IF;
    END LOOP;
    
    IF v_rem > 0 THEN
        RAISE EXCEPTION 'Insufficient available credits in registry % for seller %', p_registry_id, p_seller_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. retire_credits
-- Permanently retires p_quantity credits for p_owner_id
-- ============================================================
CREATE OR REPLACE FUNCTION retire_credits(
    p_registry_id TEXT, 
    p_owner_id TEXT, 
    p_quantity INT8
) RETURNS BOOLEAN AS $$
DECLARE
    v_rem INT8 := p_quantity;
    v_row RECORD;
    v_split RECORD;
    v_range INT8RANGE;
    v_size INT8;
BEGIN
    FOR v_row IN 
        SELECT id, serial_range FROM credit_range 
        WHERE registry_id = p_registry_id AND owner_id = p_owner_id AND status = 'AVAILABLE'
        ORDER BY lower(serial_range)
        FOR UPDATE
    LOOP
        v_size := upper(v_row.serial_range) - lower(v_row.serial_range);
        
        IF v_size > v_rem THEN
            v_split := split_range(v_row.id, v_rem);
            v_range := v_split.p_new_range;
            
            UPDATE credit_range SET status = 'RETIRED' WHERE id = v_split.p_new_id;
            
            INSERT INTO ledger_event (registry_id, event_type, serial_range, from_owner_id, to_owner_id, quantity)
            VALUES (p_registry_id, 'RETIRE', v_range, p_owner_id, p_owner_id, v_rem);
            
            v_rem := 0;
            EXIT;
        ELSE
            v_range := v_row.serial_range;
            UPDATE credit_range SET status = 'RETIRED' WHERE id = v_row.id;
            
            INSERT INTO ledger_event (registry_id, event_type, serial_range, from_owner_id, to_owner_id, quantity)
            VALUES (p_registry_id, 'RETIRE', v_range, p_owner_id, p_owner_id, v_size);
            
            v_rem := v_rem - v_size;
            IF v_rem = 0 THEN
                EXIT;
            END IF;
        END IF;
    END LOOP;
    
    IF v_rem > 0 THEN
        RAISE EXCEPTION 'Insufficient available credits to retire for %', p_owner_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
