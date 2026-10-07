import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function probe() {
  console.log('=== STEP 1: Neon Audit ===\n');

  // 1. btree_gist available?
  const ext = await prisma.$queryRaw<any[]>`
    SELECT name, default_version, comment
    FROM pg_available_extensions
    WHERE name = 'btree_gist'
  `;
  console.log('1. btree_gist in pg_available_extensions:');
  console.log(ext.length ? JSON.stringify(ext[0]) : 'NOT FOUND');

  // 2. Already installed?
  const installed = await prisma.$queryRaw<any[]>`
    SELECT extname, extversion FROM pg_extension WHERE extname = 'btree_gist'
  `;
  console.log('\n2. btree_gist currently installed:', installed.length ? installed[0].extversion : 'NO');

  // 3. Try to install it
  try {
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS btree_gist`;
    console.log('\n3. CREATE EXTENSION btree_gist: SUCCESS');
  } catch (e: any) {
    console.log('\n3. CREATE EXTENSION btree_gist: FAILED -', e.message);
  }

  // 4. Current float/timestamp columns
  const cols = await prisma.$queryRaw<any[]>`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (data_type = 'double precision' OR data_type LIKE '%timestamp%')
    ORDER BY table_name, column_name
  `;
  console.log('\n4. Columns needing type change (float→numeric, timestamp→timestamptz):');
  cols.forEach(c => console.log(`   ${c.table_name}.${c.column_name}: ${c.data_type}`));

  // 5. Current CHECK constraints (should be none yet)
  const checks = await prisma.$queryRaw<any[]>`
    SELECT tc.table_name, tc.constraint_name, cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name
  `;
  console.log('\n5. Existing CHECK constraints:', checks.length ? JSON.stringify(checks) : 'NONE');

  // 6. Missing FK on CarbonCredit.currentOwnerId?
  const fks = await prisma.$queryRaw<any[]>`
    SELECT kcu.table_name, kcu.column_name, ccu.table_name AS ref_table
    FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = rc.unique_constraint_name
    WHERE kcu.table_schema = 'public' AND kcu.table_name = 'CarbonCredit'
  `;
  console.log('\n6. Foreign keys on CarbonCredit:', fks.length ? JSON.stringify(fks) : 'NONE (currentOwnerId has no FK)');

  await prisma.$disconnect();
}

probe().catch(e => { console.error(e.message); process.exit(1); });
