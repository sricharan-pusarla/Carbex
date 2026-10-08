const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function runTest() {
  console.log("=== STEP 5 DOCUMENT STORAGE & AUTH TEST ===\\n");

  try {
    // 1. Create Seller A and Seller B
    const sellerA = await prisma.user.upsert({
      where: { email: 'sellera@test.com' },
      update: {},
      create: {
        name: 'Seller A',
        email: 'sellera@test.com',
        passwordHash: 'hash',
        role: 'SELLER',
        organization: 'Green Corp A'
      }
    });

    const sellerB = await prisma.user.upsert({
      where: { email: 'sellerb@test.com' },
      update: {},
      create: {
        name: 'Seller B',
        email: 'sellerb@test.com',
        passwordHash: 'hash',
        role: 'SELLER',
        organization: 'Eco Corp B'
      }
    });

    // 2. Create Project & Document for Seller A
    const projectA = await prisma.carbonProject.create({
      data: {
        name: "Project A",
        description: "Test Project A",
        projectType: "Solar Energy",
        location: "Test",
        country: "Test",
        developer: sellerA.organization,
        methodology: "Test",
        verificationStandard: "Test",
        totalCredits: 100,
        availableCredits: 100,
        pricePerCredit: 10,
        projectStartDate: new Date()
      }
    });

    const docA = await prisma.projectDocument.create({
      data: {
        projectId: projectA.id,
        documentType: "land_ownership",
        originalFileName: "land.pdf",
        filePath: crypto.randomUUID() + ".pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
      }
    });

    console.log(`✅ Created Project A and Document ${docA.id} owned by ${sellerA.organization}\\n`);

    // 3. Test Auth Logic (Same as src/app/api/documents/[id]/route.ts)
    async function mockApiRequest(user, documentId) {
      const document = await prisma.projectDocument.findUnique({
        where: { id: documentId },
        include: { project: { select: { developer: true } } }
      });

      const developerName = user.organization || user.name;
      const isOwner = document.project.developer === developerName;
      const isAdmin = user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return "ACCESS DENIED (403)";
      }
      return "ACCESS GRANTED (200)";
    }

    const resultA = await mockApiRequest(sellerA, docA.id);
    console.log(`Test: Seller A attempts to access Seller A's document...`);
    console.log(`Expected: ACCESS GRANTED (200)`);
    console.log(`Actual  : ${resultA}\\n`);

    const resultB = await mockApiRequest(sellerB, docA.id);
    console.log(`Test: Seller B attempts to access Seller A's document...`);
    console.log(`Expected: ACCESS DENIED (403)`);
    console.log(`Actual  : ${resultB}\\n`);

    const admin = { role: 'ADMIN', organization: 'Admin Corp' };
    const resultAdmin = await mockApiRequest(admin, docA.id);
    console.log(`Test: Admin attempts to access Seller A's document...`);
    console.log(`Expected: ACCESS GRANTED (200)`);
    console.log(`Actual  : ${resultAdmin}\\n`);

    // Clean up
    await prisma.projectDocument.delete({ where: { id: docA.id } });
    await prisma.carbonProject.delete({ where: { id: projectA.id } });

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
