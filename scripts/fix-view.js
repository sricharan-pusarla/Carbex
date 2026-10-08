const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fixView() {
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE VIEW "CreditOwnership" AS
    SELECT
        gen_random_uuid()::text AS "id",
        owner_id AS "userId",
        r."projectId",
        SUM(upper(serial_range) - lower(serial_range))::int AS "quantity"
    FROM credit_range cr
    JOIN registry r ON cr.registry_id = r.id
    WHERE cr.status = 'AVAILABLE'
    GROUP BY owner_id, r."projectId";
  `);
  console.log("Fixed CreditOwnership view");
}
fixView().catch(console.error).finally(()=>prisma.$disconnect());
