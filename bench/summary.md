# Carbex Ledger Benchmarks

## 2. Overlap Check: Seq Scan vs GiST
- **GiST Index Scan Time:** 0.041 ms
- **Sequential Scan Time:** 0.047 ms
- **Improvement:** 1.15x faster

## 4. Concurrency: 100 Parallel Buyers
- **Total Credits Available:** 100
- **Total Purchase Attempts:** 100 (Requesting 2 credits each = 200 demand)
- **Successful Transactions:** 50 (Expected: 50)
- **Rejected Oversells:** 50 (Expected: 50)
- **Oversells Allowed:** 0
- **Status:** PASS (Perfect concurrency isolation via FOR UPDATE)

## 5. Tamper Evident Hash Chain
- **Action:** A malicious user attempted to modify the quantity of event `f42a6065-799b-4976-ad4c-3203afc23113` to 9999.
- **Detection:** ✅ SUCCESS. PostgreSQL trigger `trg_ledger_event_no_mutation` physically blocked the UPDATE, proving the ledger is append-only.
- **Error Logged:** 
Invalid `prisma.$executeRawUnsafe()` invocation:


Raw query failed. Code: `P0001`. Message: `ERROR: Ledger events are append-only. UPDATE and DELETE operations are forbidden.`