const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$queryRaw`SELECT * FROM "CreditOwnership"`.then(console.log).catch(console.error).finally(()=>prisma.$disconnect());
