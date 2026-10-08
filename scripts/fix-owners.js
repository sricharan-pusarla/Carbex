const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOwners() {
  const listings = await prisma.listing.findMany();
  for (const l of listings) {
    const reg = await prisma.$queryRaw`SELECT id FROM registry WHERE "projectId" = ${l.projectId}`;
    if (reg.length > 0) {
      await prisma.$executeRawUnsafe(`
        UPDATE credit_range SET owner_id = '${l.sellerId}' WHERE registry_id = '${reg[0].id}' AND status = 'AVAILABLE'
      `);
      console.log(`Updated owner for project ${l.projectId} to seller ${l.sellerId}`);
    }
  }
}

fixOwners().catch(console.error).finally(()=>prisma.$disconnect());
