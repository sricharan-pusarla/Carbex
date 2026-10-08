const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPurchaseTests() {
  console.log("=== PURCHASING ERROR SCENARIOS TEST ===\\n");

  try {
    // 1. Setup Test Users
    const seller = await prisma.user.upsert({
      where: { email: 'test_seller@carbex.demo' },
      update: {},
      create: { name: 'Test Seller', email: 'test_seller@carbex.demo', passwordHash: 'hash', role: 'SELLER', organization: 'Test Seller Org' }
    });

    const buyer = await prisma.user.upsert({
      where: { email: 'test_buyer@carbex.demo' },
      update: {},
      create: { name: 'Test Buyer', email: 'test_buyer@carbex.demo', passwordHash: 'hash', role: 'BUYER' }
    });

    // 2. Setup a VERIFIED project WITH minted credits
    const projectA = await prisma.carbonProject.create({
      data: {
        name: "Test Minted Project",
        description: "Test",
        projectType: "Solar",
        location: "Test",
        country: "Test",
        developer: seller.organization,
        methodology: "Test",
        verificationStandard: "Test",
        verificationStatus: "VERIFIED",
        totalCredits: 100,
        availableCredits: 100,
        pricePerCredit: 10,
        projectStartDate: new Date()
      }
    });

    // Manually Mint 100 credits for Project A
    const regA = await prisma.$queryRaw`INSERT INTO registry ("projectId", name) VALUES (${projectA.id}, 'Reg A') RETURNING id;`;
    const regIdA = regA[0].id;
    await prisma.$executeRawUnsafe(`
      INSERT INTO credit_range (registry_id, serial_range, owner_id, status)
      VALUES ('${regIdA}', int8range(1, 101, '[)'), '${seller.id}', 'AVAILABLE');
    `);

    // 3. Setup a VERIFIED project WITHOUT minted credits (Simulating the bug you hit earlier)
    const projectB = await prisma.carbonProject.create({
      data: {
        name: "Test Unminted Project",
        description: "Test",
        projectType: "Wind",
        location: "Test",
        country: "Test",
        developer: seller.organization,
        methodology: "Test",
        verificationStandard: "Test",
        verificationStatus: "VERIFIED",
        totalCredits: 100,
        availableCredits: 100,
        pricePerCredit: 10,
        projectStartDate: new Date()
      }
    });
    const regB = await prisma.$queryRaw`INSERT INTO registry ("projectId", name) VALUES (${projectB.id}, 'Reg B') RETURNING id;`;
    const regIdB = regB[0].id;
    // We explicitly DO NOT insert into credit_range for Project B

    console.log("o Setup complete.\\n");

    // --- TEST 1: Successful Purchase ---
    console.log("TEST 1: Valid Purchase (Buyer buys 50 credits from Project A)");
    try {
      await prisma.$executeRawUnsafe(`SELECT transfer_credits('${regIdA}', '${seller.id}', '${buyer.id}', 50)`);
      console.log("✅ SUCCESS: Transaction completed successfully.\\n");
    } catch (e) {
      console.log(`~ FAILED unexpectedly: ${e.message}\\n`);
    }

    // --- TEST 2: Insufficient Balance Error ---
    console.log("TEST 2: Insufficient Balance (Buyer tries to buy 100 more credits, but only 50 remain)");
    try {
      await prisma.$executeRawUnsafe(`SELECT transfer_credits('${regIdA}', '${seller.id}', '${buyer.id}', 100)`);
      console.log("~ FAILED: Transaction succeeded when it should have failed!\\n");
    } catch (e) {
      console.log(`✅ CAUGHT EXPECTED ERROR: ${e.meta?.message || e.message}\\n`);
    }

    // --- TEST 3: Unminted Bug Error ---
    console.log("TEST 3: Unminted Ledger (Buyer tries to buy from Project B, which forgot to mint credits)");
    try {
      await prisma.$executeRawUnsafe(`SELECT transfer_credits('${regIdB}', '${seller.id}', '${buyer.id}', 10)`);
      console.log("~ FAILED: Transaction succeeded when it should have failed!\\n");
    } catch (e) {
      console.log(`✅ CAUGHT EXPECTED ERROR: ${e.meta?.message || e.message}\\n`);
    }

    // Clean up
    await prisma.$executeRawUnsafe(`DELETE FROM ledger_event WHERE registry_id IN ('${regIdA}', '${regIdB}')`);
    await prisma.$executeRawUnsafe(`DELETE FROM credit_range WHERE registry_id IN ('${regIdA}', '${regIdB}')`);
    await prisma.$executeRawUnsafe(`DELETE FROM registry WHERE id IN ('${regIdA}', '${regIdB}')`);
    await prisma.carbonProject.deleteMany({ where: { id: { in: [projectA.id, projectB.id] } } });
    await prisma.user.deleteMany({ where: { email: { in: ['test_seller@carbex.demo', 'test_buyer@carbex.demo'] } } });

  } catch (e) {
    console.error("Test execution failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

runPurchaseTests();
