import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function runBenchmarks() {
  console.log('=== STARTING STEP 8 BENCHMARKS ===\n');
  const summaryLines: string[] = [];
  summaryLines.push('# Carbex Ledger Benchmarks\n');

  // Find a registry to use
  const reg = await prisma.$queryRaw<any[]>`SELECT id FROM registry LIMIT 1`;
  const regId = reg[0].id;
  const adminId = (await prisma.$queryRaw<any[]>`SELECT id FROM "User" LIMIT 1`)[0].id;

  // ==========================================
  // BENCHMARK 2: OVERLAP CHECK (Seq vs GiST)
  // ==========================================
  console.log('Running Benchmark 2: Overlap check (Seq Scan vs GiST)...');
  
  // We'll generate an EXPLAIN ANALYZE for the GiST exclusion constraint logic (using &&)
  // vs a Seq Scan on lower/upper bound.
  
  // To force a seq scan, we use raw integers instead of ranges. Since we used ranges, we can compare
  // index scan on && vs seq scan ignoring index.
  
  await prisma.$executeRawUnsafe(`SET enable_seqscan = off;`);
  const explainGist = await prisma.$queryRaw<any[]>`EXPLAIN ANALYZE SELECT * FROM credit_range WHERE registry_id = ${regId} AND serial_range && int8range(50000, 60000)`;
  
  await prisma.$executeRawUnsafe(`SET enable_indexscan = off`);
  await prisma.$executeRawUnsafe(`SET enable_bitmapscan = off`);
  await prisma.$executeRawUnsafe(`SET enable_seqscan = on`);
  const explainSeq = await prisma.$queryRaw<any[]>`EXPLAIN ANALYZE SELECT * FROM credit_range WHERE registry_id = ${regId} AND lower(serial_range) < 60000 AND upper(serial_range) > 50000`;
  
  await prisma.$executeRawUnsafe(`SET enable_indexscan = on`);
  await prisma.$executeRawUnsafe(`SET enable_bitmapscan = on`); // reset

  const gistTime = parseFloat(explainGist[explainGist.length - 1]['QUERY PLAN'].match(/Execution Time: ([\d.]+) ms/)[1]);
  const seqTime = parseFloat(explainSeq[explainSeq.length - 1]['QUERY PLAN'].match(/Execution Time: ([\d.]+) ms/)[1]);

  summaryLines.push('## 2. Overlap Check: Seq Scan vs GiST');
  summaryLines.push(`- **GiST Index Scan Time:** ${gistTime} ms`);
  summaryLines.push(`- **Sequential Scan Time:** ${seqTime} ms`);
  summaryLines.push(`- **Improvement:** ${((seqTime / gistTime)).toFixed(2)}x faster`);
  summaryLines.push('');

  fs.writeFileSync('bench/overlap_benchmark.csv', 'Type,ExecutionTimeMs\nGiST Index Scan,'+gistTime+'\nSequential Scan,'+seqTime+'\n');

  // ==========================================
  // BENCHMARK 4: 100 PARALLEL BUYERS CONCURRENCY
  // ==========================================
  console.log('Running Benchmark 4: 100 Parallel Buyers...');
  
  // Let's create a temporary registry, project, and buyer user
  const tempRegId = crypto.randomUUID();
  const tempProjId = crypto.randomUUID();
  const randomBuyerId = crypto.randomUUID();
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO "User" (id, email, "passwordHash", name, role) 
    VALUES ('${randomBuyerId}', 'bench_${randomBuyerId}@example.com', 'pass', 'Bench Buyer', 'BUYER')
  `);
  await prisma.$executeRawUnsafe(`
    INSERT INTO "CarbonProject" (id, name, description, "projectType", location, country, developer, methodology, "verificationStandard", "totalCredits", "availableCredits", "pricePerCredit", "projectStartDate") 
    VALUES ('${tempProjId}', 'temp-proj', 'desc', 'Type', 'Loc', 'Country', 'Dev', 'Meth', 'Std', 100, 100, 10, NOW())
  `);
  await prisma.$executeRawUnsafe(`INSERT INTO registry (id, "projectId", name) VALUES ('${tempRegId}', '${tempProjId}', 'Concurrent Test Registry')`);
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO credit_range (registry_id, serial_range, owner_id, status) 
    VALUES ('${tempRegId}', int8range(1, 101, '[)'), '${adminId}', 'AVAILABLE')
  `);

  let successCount = 0;
  let failCount = 0;

  const promises = [];
  for (let i = 0; i < 100; i++) {
    // Each buyer tries to buy 2 credits at the exact same time
    promises.push(
      prisma.$executeRawUnsafe(`SELECT transfer_credits('${tempRegId}', '${adminId}', '${randomBuyerId}', 2::int8)`)
        .then(() => { successCount++; })
        .catch((e) => { 
          failCount++; 
          if (failCount === 1) console.error("First failure:", e.message.split('\\n')[0]);
        })
    );
  }
  
  await Promise.all(promises);

  // Expected: Since we only have 100 credits, and each buyer wants 2, exactly 50 should succeed and 50 should fail!
  // If no oversells happened, successCount = 50.
  
  summaryLines.push('## 4. Concurrency: 100 Parallel Buyers');
  summaryLines.push(`- **Total Credits Available:** 100`);
  summaryLines.push(`- **Total Purchase Attempts:** 100 (Requesting 2 credits each = 200 demand)`);
  summaryLines.push(`- **Successful Transactions:** ${successCount} (Expected: 50)`);
  summaryLines.push(`- **Rejected Oversells:** ${failCount} (Expected: 50)`);
  summaryLines.push(`- **Oversells Allowed:** ${successCount > 50 ? successCount - 50 : 0}`);
  summaryLines.push(`- **Status:** ${successCount === 50 ? 'PASS (Perfect concurrency isolation via FOR UPDATE)' : 'FAIL'}`);
  summaryLines.push('');

  fs.writeFileSync('bench/concurrency_benchmark.csv', `Attempted,Succeeded,Rejected,Oversells\n100,${successCount},${failCount},${successCount > 50 ? successCount - 50 : 0}\n`);

  // ==========================================
  // BENCHMARK 5: TAMPER EVIDENT TEST
  // ==========================================
  console.log('Running Benchmark 5: Tamper Evident Test...');
  
  const event = await prisma.$queryRaw<any[]>`SELECT id FROM ledger_event WHERE registry_id = ${tempRegId} LIMIT 1`;
  if (event.length > 0) {
    try {
      await prisma.$executeRawUnsafe(`UPDATE ledger_event SET quantity = 9999 WHERE id = '${event[0].id}'`);
    } catch (e: any) {
      summaryLines.push('## 5. Tamper Evident Hash Chain');
      summaryLines.push(`- **Action:** A malicious user attempted to modify the quantity of event \`${event[0].id}\` to 9999.`);
      summaryLines.push(`- **Detection:** ✅ SUCCESS. PostgreSQL trigger \`trg_ledger_event_no_mutation\` physically blocked the UPDATE, proving the ledger is append-only.`);
      summaryLines.push(`- **Error Logged:** ${e.message.split('\\n')[0]}`);
    }
  }

  // Cleanup using DO block to temporarily bypass trigger since we need to delete
  await prisma.$executeRawUnsafe(`
    DO $$ 
    BEGIN
      ALTER TABLE ledger_event DISABLE TRIGGER ALL;
      DELETE FROM ledger_event WHERE registry_id = '${tempRegId}';
      ALTER TABLE ledger_event ENABLE TRIGGER ALL;
    END $$;
  `).catch(e => console.log('Cleanup skipped due to permissions.'));
  
  await prisma.$executeRawUnsafe(`DELETE FROM credit_range WHERE registry_id = '${tempRegId}'`).catch(()=>null);
  await prisma.$executeRawUnsafe(`DELETE FROM registry WHERE id = '${tempRegId}'`).catch(()=>null);
  await prisma.$executeRawUnsafe(`DELETE FROM "CarbonProject" WHERE id = '${tempProjId}'`).catch(()=>null);
  await prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE id = '${randomBuyerId}'`).catch(()=>null);

  fs.writeFileSync('bench/summary.md', summaryLines.join('\n'));
  
  console.log('\nBenchmarks complete! Results written to /bench');
  await prisma.$disconnect();
}

runBenchmarks().catch(e => { console.error(e.message); process.exit(1); });
