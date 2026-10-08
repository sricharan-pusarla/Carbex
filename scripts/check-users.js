const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const admin = await prisma.user.findUnique({ where: { id: '84b0c31b-cbeb-4261-8136-ddba0e3b3bce' }});
  const seller = await prisma.user.findUnique({ where: { id: '45a9084e-49ee-4b92-a4bc-2d8b5afaf5ed' }});
  console.log('Admin?:', admin?.role, admin?.email);
  console.log('Seller?:', seller?.role, seller?.email);
}

check().catch(console.error).finally(()=>prisma.$disconnect());
