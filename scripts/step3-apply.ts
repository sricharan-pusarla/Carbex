import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarBlock = false;

  const lines = sql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!inDollarBlock && (trimmed.startsWith('--') || trimmed === '')) continue;
    current += line + '\n';

    const dollarMatches = (line.match(/\$\$/g) || []).length;
    if (dollarMatches % 2 !== 0) inDollarBlock = !inDollarBlock;

    if (!inDollarBlock && trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt && stmt !== ';') statements.push(stmt);
      current = '';
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function apply() {
  const sqlFile = path.join(process.cwd(), 'prisma/migrations/20261007_step3_integrity_triggers/migration.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');
  const statements = splitStatements(sql);

  console.log(`=== Applying STEP 3 migration (${statements.length} statements) to Neon ===\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`[${String(i+1).padStart(2,'0')}] OK: ${preview}...`);
    } catch (e: any) {
      console.error(`[${String(i+1).padStart(2,'0')}] FAILED: ${preview}...`);
      console.error(`         Error: ${e.message.split('\n')[0]}`);
      process.exit(1);
    }
  }

  // --- VERIFY ---
  console.log('\n=== POST-MIGRATION VERIFICATION ===\n');

  // 1. Verify Triggers Exist
  const triggers = await prisma.$queryRaw<any[]>`
    SELECT tgname, relname 
    FROM pg_trigger 
    JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
    WHERE tgname LIKE 'trg_%' AND relname IN ('ledger_event', 'Transaction', 'Retirement', 'credit_range')
    ORDER BY relname, tgname
  `;
  console.log('1. Installed Triggers:');
  triggers.forEach(t => console.log(`   ✓ [${t.relname}] ${t.tgname}`));

  // 2. Proof: Block UPDATE on ledger_event
  console.log('\n2. Proof: Attempting to UPDATE a ledger_event');
  const event = await prisma.$queryRaw<any[]>`SELECT id FROM ledger_event LIMIT 1`;
  if (event.length > 0) {
    try {
      await prisma.$executeRawUnsafe(`UPDATE ledger_event SET quantity = 999 WHERE id = '${event[0].id}'`);
      console.log('   ✗ FAILURE: Update succeeded on ledger_event!');
    } catch (e: any) {
      console.log('   ✓ PASS: Update REJECTED.');
      console.log(`     Error: ${e.message.split('\n')[0]}`);
    }
  }

  // 3. Proof: Block DELETE on Transaction
  console.log('\n3. Proof: Attempting to DELETE a Transaction');
  const tx = await prisma.$queryRaw<any[]>`SELECT id FROM "Transaction" LIMIT 1`;
  if (tx.length > 0) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "Transaction" WHERE id = '${tx[0].id}'`);
      console.log('   ✗ FAILURE: Delete succeeded on Transaction!');
    } catch (e: any) {
      console.log('   ✓ PASS: Delete REJECTED.');
      console.log(`     Error: ${e.message.split('\n')[0]}`);
    }
  }

  // 4. Proof: State Machine (Un-retiring a credit)
  console.log('\n4. Proof: Attempting to un-retire a credit range');
  const retired = await prisma.$queryRaw<any[]>`SELECT id FROM credit_range WHERE status = 'RETIRED' LIMIT 1`;
  if (retired.length > 0) {
    try {
      await prisma.$executeRawUnsafe(`UPDATE credit_range SET status = 'AVAILABLE' WHERE id = '${retired[0].id}'`);
      console.log('   ✗ FAILURE: Un-retire succeeded!');
    } catch (e: any) {
      console.log('   ✓ PASS: Un-retire REJECTED.');
      console.log(`     Error: ${e.message.split('\n')[0]}`);
    }
  } else {
    console.log('   (No retired ranges found to test)');
  }

  // 5. Proof: Verify Hash Chain
  console.log('\n5. Proof: Running verify_ledger_chain() on all registries');
  const registries = await prisma.$queryRaw<any[]>`SELECT id, name FROM registry`;
  let allIntact = true;
  for (const reg of registries) {
    const brokenId = await prisma.$queryRaw<any[]>`SELECT verify_ledger_chain('${reg.id}') as broken_id`;
    if (brokenId[0].broken_id !== null) {
      console.log(`   ✗ FAILURE: Registry '${reg.name}' chain broken at event ${brokenId[0].broken_id}`);
      allIntact = false;
    }
  }
  if (allIntact) {
    console.log(`   ✓ SUCCESS: All ${registries.length} registries have a fully intact hash chain.`);
  }

  await prisma.$disconnect();
  console.log('\n=== STEP 3 COMPLETE ===');
}

apply().catch(e => { console.error(e.message); process.exit(1); });
