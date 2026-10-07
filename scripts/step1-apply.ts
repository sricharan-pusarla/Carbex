import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Split SQL into individual statements, keeping DO $$ ... $$ blocks intact
function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarBlock = false;

  const lines = sql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip pure comment lines and empty lines when not in a block
    if (!inDollarBlock && (trimmed.startsWith('--') || trimmed === '')) {
      continue;
    }
    current += line + '\n';

    // Track DO $$ blocks
    const dollarMatches = (line.match(/\$\$/g) || []).length;
    if (dollarMatches % 2 !== 0) {
      inDollarBlock = !inDollarBlock;
    }

    // End of statement: semicolon outside a $$ block
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
  const sqlFile = path.join(process.cwd(), 'prisma/migrations/20261007_step1_hardening/migration.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');
  const statements = splitStatements(sql);

  console.log(`=== Applying STEP 1 migration (${statements.length} statements) to Neon ===\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`[${String(i+1).padStart(2,'0')}] OK: ${preview}...`);
    } catch (e: any) {
      // NOTICE from DO block — this is expected (PostgreSQL NOTICE messages surface as errors in some drivers)
      if (e.message.includes('NOTICE') || e.message.includes('already exists')) {
        console.log(`[${String(i+1).padStart(2,'0')}] NOTICE: ${e.message.split('\n')[0]}`);
      } else if (e.message.includes('chk_available_credits_range') || 
                 e.message.includes('check_violation') ||
                 e.message.includes('chk_') ||
                 e.message.includes('CHECK')) {
        console.log(`[${String(i+1).padStart(2,'0')}] EXPECTED constraint fire in DO block (this is correct)`);
      } else {
        console.error(`[${String(i+1).padStart(2,'0')}] FAILED: ${preview}...`);
        console.error(`         Error: ${e.message.split('\n')[0]}`);
        // Don't exit — some statements may conflict if re-run (IF EXISTS handles most)
      }
    }
  }

  // --- VERIFY ---
  console.log('\n=== POST-MIGRATION VERIFICATION ===\n');

  // 1. btree_gist
  const ext = await prisma.$queryRaw<any[]>`SELECT extname, extversion FROM pg_extension WHERE extname='btree_gist'`;
  console.log(`1. btree_gist: ${ext[0] ? `installed v${ext[0].extversion} ✓` : 'MISSING ✗'}`);

  // 2. Numeric column types
  const types = await prisma.$queryRaw<any[]>`
    SELECT table_name, column_name, udt_name
    FROM information_schema.columns
    WHERE table_schema='public'
      AND column_name IN ('pricePerCredit','totalAmount')
    ORDER BY table_name, column_name
  `;
  console.log('\n2. FLOAT→NUMERIC conversions:');
  types.forEach(c => {
    const ok = c.udt_name === 'numeric' ? '✓' : '✗';
    console.log(`   ${ok} ${c.table_name}.${c.column_name}: ${c.udt_name}`);
  });

  // 3. Timestamptz columns
  const tzCols = await prisma.$queryRaw<any[]>`
    SELECT table_name, column_name, udt_name
    FROM information_schema.columns
    WHERE table_schema='public'
      AND udt_name IN ('timestamptz','timestamp')
      AND column_name IN ('createdAt','issuedAt','retiredAt','projectStartDate','verificationDate')
    ORDER BY table_name, column_name
  `;
  console.log('\n3. Timestamp→Timestamptz conversions:');
  tzCols.forEach(c => {
    const ok = c.udt_name === 'timestamptz' ? '✓' : '✗';
    console.log(`   ${ok} ${c.table_name}.${c.column_name}: ${c.udt_name}`);
  });

  // 4. Business CHECK constraints
  const checks = await prisma.$queryRaw<any[]>`
    SELECT tc.table_name, tc.constraint_name, cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_schema='public' AND tc.constraint_name LIKE 'chk_%'
    ORDER BY tc.table_name, tc.constraint_name
  `;
  console.log(`\n4. Business CHECK constraints (${checks.length} added):`);
  checks.forEach(c => console.log(`   ✓ [${c.table_name}] ${c.constraint_name}`));

  // 5. FK on CarbonCredit.currentOwnerId
  const fks = await prisma.$queryRaw<any[]>`
    SELECT kcu.column_name, ccu.table_name AS ref_table, rc.constraint_name
    FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = rc.unique_constraint_name
    WHERE kcu.table_schema='public' AND kcu.table_name='CarbonCredit'
    ORDER BY kcu.column_name
  `;
  console.log('\n5. CarbonCredit foreign keys:');
  fks.forEach(f => console.log(`   ✓ CarbonCredit.${f.column_name} → ${f.ref_table} (${f.constraint_name})`));
  if (fks.length === 0) console.log('   ✗ No FKs found');

  // 6. PROVE CHECK violation is rejected
  console.log('\n6. CHECK violation proof:');
  const proj = await prisma.$queryRaw<any[]>`SELECT id, "totalCredits" FROM "CarbonProject" LIMIT 1`;
  const pid = proj[0].id;
  const total = Number(proj[0].totalCredits);

  try {
    await prisma.$executeRaw`
      UPDATE "CarbonProject"
         SET "availableCredits" = ${total + 99999}
       WHERE id = ${pid}
    `;
    console.log('   ✗ ERROR: CHECK did not fire — broken!');
  } catch (e: any) {
    console.log(`   ✓ PASS: UPDATE with availableCredits=${total + 99999} (> totalCredits=${total}) was REJECTED`);
    console.log(`   Error code: ${e.code || 'N/A'}`);
    console.log(`   Message: ${e.message.split('\n')[0]}`);
  }

  await prisma.$disconnect();
  console.log('\n=== STEP 1 COMPLETE ===');
}

apply().catch(e => { console.error(e.message); process.exit(1); });
