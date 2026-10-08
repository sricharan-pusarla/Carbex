const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const docs = await prisma.projectDocument.count();
  const verifies = await prisma.projectVerification.count();
  console.log(`Database tested successfully. Documents: ${docs}, Verifications: ${verifies}`);
}
main().finally(() => prisma.$disconnect());
