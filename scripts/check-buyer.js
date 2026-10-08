const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const t = await prisma.transaction.findMany();
  console.log("TRANSACTIONS:", t.map(tx => ({ buyerId: tx.buyerId, projectId: tx.projectId, q: tx.quantity })));
  const c = await prisma.$queryRaw`SELECT * FROM "CreditOwnership"`;
  console.log("CREDIT OWNERSHIP VIEW:", c);
  const cr = await prisma.$queryRaw`SELECT owner_id, registry_id, status FROM credit_range WHERE owner_id IN (SELECT "buyerId" FROM "Transaction")`;
  console.log("CREDIT RANGES FOR BUYERS:", cr);
}
run().catch(console.error).finally(()=>prisma.$disconnect());
