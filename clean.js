const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  await p.$executeRawUnsafe(`UPDATE "CarbonProject" SET name = REPLACE(name, ' (DEMO)', '')`);
  console.log('DB Cleaned');
}
main().finally(() => p.$disconnect());
