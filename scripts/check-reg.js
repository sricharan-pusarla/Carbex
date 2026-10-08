const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const c = await prisma.$queryRaw`SELECT owner_id, status FROM credit_range WHERE registry_id = '5d8672c3-e2d4-4411-bdb8-97dff07bf070'`;
  console.log('CREDITS FOR REGISTRY:', c);
}

check().catch(console.error).finally(()=>prisma.$disconnect());
