const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const orphans = await prisma.$queryRaw`SELECT count(*) FROM credit_range cr LEFT JOIN registry r ON cr.registry_id = r.id WHERE r.id IS NULL`;
  console.log("ORPHANS:", orphans);
  const totalCr = await prisma.$queryRaw`SELECT count(*) FROM credit_range`;
  console.log("TOTAL CR:", totalCr);
}
run().catch(console.error).finally(()=>prisma.$disconnect());
