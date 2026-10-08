const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const c = await prisma.$queryRaw`
SELECT 
    md5(owner_id || "projectId" || 'AVAILABLE')::text as "id", 
    owner_id as "userId", 
    "projectId", 
    SUM(upper(serial_range) - lower(serial_range))::int as "quantity"
FROM "credit_range" 
JOIN "registry" ON "registry"."id" = "credit_range"."registry_id"
WHERE "status" = 'AVAILABLE'
GROUP BY owner_id, "projectId";
  `;
  console.log("MANUAL QUERY:", c);
}
run().catch(console.error).finally(()=>prisma.$disconnect());
