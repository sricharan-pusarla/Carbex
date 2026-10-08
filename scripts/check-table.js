const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const t = await prisma.$queryRaw`SELECT table_type FROM information_schema.tables WHERE table_name = 'CreditOwnership'`;
  console.log("TYPE:", t);
}
check().catch(console.error).finally(()=>prisma.$disconnect());
