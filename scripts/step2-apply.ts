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
  const sqlFile = path.join(process.cwd(), 'prisma/migrations/20261007_step2_ledger_tables/migration.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');
  const statements = splitStatements(sql);

  console.log(`=== Applying STEP 2 migration (${statements.length} statements) to Neon ===\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`[${String(i+1).padStart(2,'0')}] OK: ${preview}...`);
    } catch (e: any) {
      console.error(`[${String(i+1).padStart(2,'0')}] FAILED: ${preview}...`);
      console.error(`         Error: ${e.message.split('\n')[0]}`);
      process.exit(1); // Fail fast on Step 2 since tables must exist
    }
  }

  // --- VERIFY ---
  console.log('\n=== POST-MIGRATION VERIFICATION ===\n');

  // 1. Verify tables exist
  const tables = await prisma.$queryRaw<any[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name IN ('registry', 'credit_range', 'ledger_event')
    ORDER BY table_name
  `;
  console.log('1. Ledger tables created:');
  tables.forEach(t => console.log(`   ✓ ${t.table_name}`));

  // 2. Verify GiST exclusion constraint on credit_range
  const exclude = await prisma.$queryRaw<any[]>`
    SELECT conname, pg_get_constraintdef(c.oid) as def
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'credit_range' AND contype = 'x'
  `;
  console.log('\n2. GiST Exclusion Constraint:');
  exclude.forEach(e => console.log(`   ✓ ${e.conname}: ${e.def}`));

  // 3. Data Migration Check - Compare totals
  console.log('\n3. Verifying Total Credits migrated:');
  const projectTotal = await prisma.$queryRaw<any[]>`SELECT SUM("totalCredits") as total FROM "CarbonProject"`;
  const rangeTotal = await prisma.$queryRaw<any[]>`
    SELECT SUM(upper(serial_range) - lower(serial_range)) as total FROM credit_range
  `;
  console.log(`   Total in CarbonProject: ${projectTotal[0].total}`);
  console.log(`   Total in credit_range: ${rangeTotal[0].total}`);
  if (String(projectTotal[0].total) === String(rangeTotal[0].total)) {
    console.log('   ✓ SUCCESS: Totals match perfectly!');
  } else {
    console.log('   ✗ FAILURE: Totals mismatch!');
  }

  // 4. Data Migration Check - Compare Available Credits
  const projectAvailable = await prisma.$queryRaw<any[]>`SELECT SUM("availableCredits") as total FROM "CarbonProject"`;
  const rangeAvailable = await prisma.$queryRaw<any[]>`
    SELECT SUM(upper(serial_range) - lower(serial_range)) as total 
    FROM credit_range WHERE status = 'AVAILABLE' AND owner_id IN (SELECT id FROM "User" WHERE role IN ('ADMIN', 'SELLER'))
  `;
  
  // Note: old schema didn't link available credits to a specific owner table, so we just check total AVAILABLE status
  const rangeAvailableGlobal = await prisma.$queryRaw<any[]>`
    SELECT SUM(upper(serial_range) - lower(serial_range)) as total FROM credit_range WHERE status = 'AVAILABLE'
  `;
  // Actually, some 'AVAILABLE' in range might be owned by buyers (from CreditOwnership).
  // CreditOwnership represents bought but NOT retired.
  // So rangeAvailableGlobal = CarbonProject.availableCredits + SUM(CreditOwnership.quantity)
  
  const ownershipTotal = await prisma.$queryRaw<any[]>`SELECT COALESCE(SUM(quantity), 0) as total FROM "CreditOwnership"`;
  
  console.log(`\n   CarbonProject Available: ${projectAvailable[0].total}`);
  console.log(`   CreditOwnership (Bought & Held): ${ownershipTotal[0].total}`);
  console.log(`   Total Expected AVAILABLE ranges: ${Number(projectAvailable[0].total) + Number(ownershipTotal[0].total)}`);
  console.log(`   Actual AVAILABLE ranges: ${rangeAvailableGlobal[0].total}`);

  // 5. Ledger Event Check
  const events = await prisma.$queryRaw<any[]>`SELECT COUNT(*) as count FROM ledger_event`;
  console.log(`\n   Ledger Events generated: ${events[0].count}`);

  await prisma.$disconnect();
  console.log('\n=== STEP 2 COMPLETE ===');
}

apply().catch(e => { console.error(e.message); process.exit(1); });
