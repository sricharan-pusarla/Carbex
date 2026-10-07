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
  const sqlFile = path.join(process.cwd(), 'prisma/migrations/20261007_step4_plpgsql_functions/migration.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');
  const statements = splitStatements(sql);

  console.log(`=== Applying STEP 4 migration (${statements.length} statements) to Neon ===\n`);

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
  console.log('\n=== STEP 4 PL/pgSQL Functions Installed ===');
  await prisma.$disconnect();
}

apply().catch(e => { console.error(e.message); process.exit(1); });
