const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const c = await prisma.$queryRaw`SELECT * FROM "CreditOwnership"`;
  console.log("SQL VIEW FETCH:", c);
}
run().catch(console.error).finally(()=>prisma.$disconnect());
