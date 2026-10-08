const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "CreditOwnership" CASCADE`);
    console.log("Dropped CreditOwnership");
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Retirement" CASCADE`);
    console.log("Dropped Retirement");

    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE VIEW "CreditOwnership" AS
      SELECT 
          md5(owner_id || "projectId" || 'AVAILABLE')::uuid::text as "id", 
          owner_id as "userId", 
          "projectId", 
          SUM(upper(serial_range) - lower(serial_range))::int as "quantity"
      FROM "credit_range" 
      JOIN "registry" ON "registry"."id" = "credit_range"."registry_id"
      WHERE "status" = 'AVAILABLE'
      GROUP BY owner_id, "projectId"
    `);
    console.log("Created CreditOwnership View");

    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE VIEW "Retirement" AS
      SELECT 
          md5(owner_id || "projectId" || 'RETIRED')::uuid::text as "id",
          owner_id as "userId",
          "projectId",
          SUM(upper(serial_range) - lower(serial_range))::int as "quantity",
          'Retired via immutable ledger' as "reason",
          'CRB-RET-' || to_char(NOW(), 'YYYY') || '-' || substr(md5(owner_id || "projectId"), 1, 6) as "certificateId",
          NOW() as "retiredAt"
      FROM "credit_range"
      JOIN "registry" ON "registry"."id" = "credit_range"."registry_id"
      WHERE "status" = 'RETIRED'
      GROUP BY owner_id, "projectId"
    `);
    console.log("Created Retirement View");
  } catch(e) {
    console.error(e);
  }
}
run().catch(console.error).finally(()=>prisma.$disconnect());
