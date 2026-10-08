const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const c = await prisma.$queryRaw`SELECT owner_id, r."projectId", SUM(upper(serial_range) - lower(serial_range)) FROM credit_range cr JOIN registry r ON cr.registry_id = r.id WHERE cr.status = 'AVAILABLE' GROUP BY owner_id, r."projectId"`;
  console.log("RAW VIEW DATA:", c);
}
run().catch(console.error).finally(()=>prisma.$disconnect());
