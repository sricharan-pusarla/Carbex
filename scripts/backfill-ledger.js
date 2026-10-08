const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function backfill() {
  const verifiedProjects = await prisma.carbonProject.findMany({
    where: { verificationStatus: 'VERIFIED' }
  });

  for (const project of verifiedProjects) {
    const seller = await prisma.user.findFirst({
      where: { 
        role: "SELLER",
        OR: [
          { organization: project.developer },
          { name: project.developer }
        ]
      }
    });

    if (seller) {
      const existingListing = await prisma.listing.findFirst({ where: { projectId: project.id } });
      if (!existingListing) {
        console.log(`Creating listing for ${project.name}`);
        await prisma.listing.create({
          data: {
            projectId: project.id,
            sellerId: seller.id,
            quantity: project.availableCredits,
            pricePerCredit: project.pricePerCredit,
            status: "ACTIVE"
          }
        });
      }

      const existingRegistry = await prisma.$queryRaw`SELECT id FROM registry WHERE "projectId" = ${project.id}`;
      let registryId;

      if (existingRegistry && existingRegistry.length > 0) {
        registryId = existingRegistry[0].id;
      } else {
        console.log(`Creating registry for ${project.name}`);
        const newReg = await prisma.$queryRaw`
          INSERT INTO registry ("projectId", name) 
          VALUES (${project.id}, ${'Registry for ' + project.name}) 
          RETURNING id;
        `;
        registryId = newReg[0].id;
      }

      const existingRanges = await prisma.$queryRaw`SELECT count(*) FROM credit_range WHERE registry_id = ${registryId}`;
      if (existingRanges && Number(existingRanges[0].count) === 0) {
        console.log(`Minting credits in ledger for ${project.name}`);
        
        // Generate a hash to satisfy the NOT NULL constraint in ledger_event
        const hash = crypto.createHash('sha256').update(registryId + 'MINT' + seller.id).digest('hex');

        await prisma.$executeRawUnsafe(`
          INSERT INTO credit_range (id, registry_id, serial_range, owner_id, status)
          VALUES (gen_random_uuid(), '${registryId}', int8range(1, ${project.totalCredits + 1}, '[)'), '${seller.id}', 'AVAILABLE');
        `);

        await prisma.$executeRawUnsafe(`
          INSERT INTO ledger_event (id, registry_id, event_type, serial_range, from_owner_id, to_owner_id, quantity, hash)
          VALUES (gen_random_uuid(), '${registryId}', 'MINT', int8range(1, ${project.totalCredits + 1}, '[)'), '${seller.id}', '${seller.id}', ${project.totalCredits}, '${hash}');
        `);
      }
    }
  }

  console.log("Backfill complete");
}

backfill().catch(console.error).finally(() => prisma.$disconnect());
