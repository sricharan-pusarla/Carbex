const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const o = await prisma.creditOwnership.findMany();
  console.log("PRISMA FETCH:", o);
}
run().catch(console.error).finally(()=>prisma.$disconnect());
