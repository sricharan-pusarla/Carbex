const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
async function run() {
  const sql = fs.readFileSync('prisma/migrations/20261007_step4_plpgsql_functions/views.sql', 'utf-8');
  const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
  for (const stmt of stmts) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("Executed successfully");
    } catch(e) {
      console.error("Failed to execute:", stmt, "\\nError:", e);
    }
  }
}
run().catch(console.error).finally(()=>prisma.$disconnect());
