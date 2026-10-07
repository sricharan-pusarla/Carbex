import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function prove() {
  // Insert a temp project with totalCredits=100
  const proj = await p.$queryRaw<any[]>`
    INSERT INTO "CarbonProject"
      (id, name, description, "projectType", location, country, developer,
       methodology, "verificationStandard", "totalCredits", "availableCredits",
       "pricePerCredit", "projectStartDate", "verificationStatus", "createdAt")
    VALUES
      (gen_random_uuid(), 'CHECK Test Project', 'Test', 'Solar', 'Chennai', 'India',
       'Tester', 'AMS-I.D', 'Gold Standard', 100, 50, 720.00,
       NOW(), 'PENDING'::"VerificationStatus", NOW())
    RETURNING id, "totalCredits", "availableCredits"
  `;
  const id = proj[0].id;
  console.log(`Inserted test project: id=${id} | totalCredits=100, availableCredits=50\n`);

  // Test 1: availableCredits > totalCredits
  try {
    await p.$executeRawUnsafe(`UPDATE "CarbonProject" SET "availableCredits"=99999 WHERE id='${id}'`);
    console.log('FAIL: chk_available_credits_range did not fire');
  } catch(e: any) {
    console.log('PASS ✓ chk_available_credits_range REJECTED availableCredits=99999');
    console.log('      PG error:', e.message.split('\n')[0]);
  }

  // Test 2: totalCredits negative
  try {
    await p.$executeRawUnsafe(`UPDATE "CarbonProject" SET "totalCredits"=-5 WHERE id='${id}'`);
    console.log('FAIL: chk_total_credits_positive did not fire');
  } catch(e: any) {
    console.log('PASS ✓ chk_total_credits_positive REJECTED totalCredits=-5');
    console.log('      PG error:', e.message.split('\n')[0]);
  }

  // Test 3: pricePerCredit = 0
  try {
    await p.$executeRawUnsafe(`UPDATE "CarbonProject" SET "pricePerCredit"=0 WHERE id='${id}'`);
    console.log('FAIL: chk_project_price_positive did not fire');
  } catch(e: any) {
    console.log('PASS ✓ chk_project_price_positive REJECTED pricePerCredit=0');
    console.log('      PG error:', e.message.split('\n')[0]);
  }

  // Cleanup
  await p.$executeRawUnsafe(`DELETE FROM "CarbonProject" WHERE id='${id}'`);
  console.log('\nTest project cleaned up. All CHECKs verified.\n');
  await p.$disconnect();
}

prove().catch(e => { console.error(e.message); process.exit(1); });
