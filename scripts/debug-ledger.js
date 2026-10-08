const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const ranges = await prisma.$queryRaw`SELECT registry_id, owner_id, status FROM credit_range`;
  console.log('RANGES:', ranges);
  const listings = await prisma.listing.findMany();
  console.log('LISTINGS:', listings.map(l => ({ id: l.id, projectId: l.projectId, sellerId: l.sellerId })));
  
  const registries = await prisma.$queryRaw`SELECT id, "projectId" FROM registry`;
  console.log('REGISTRIES:', registries);
}

check().catch(console.error).finally(()=>prisma.$disconnect());
