"use server";

import { prisma } from "@/lib/prisma";
import { Role, ProjectVerificationState, VerificationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

async function verifyAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.ADMIN) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function approveVerification(projectId: string, comments: string) {
  await verifyAdmin();

  // 1. Fetch project to get total credits and developer
  const project = await prisma.carbonProject.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");

  // 2. Update verification tracker
  await prisma.projectVerification.update({
    where: { projectId },
    data: {
      status: ProjectVerificationState.APPROVED,
      adminComments: comments,
      reviewedAt: new Date()
    }
  });

  // 3. Update actual project status so it becomes visible on the marketplace
  await prisma.carbonProject.update({
    where: { id: projectId },
    data: {
      verificationStatus: VerificationStatus.VERIFIED,
      verificationDate: new Date()
    }
  });

  // 4. Find the Seller
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
    // 5. Create Listing if it doesn't exist
    const existingListing = await prisma.listing.findFirst({ where: { projectId } });
    if (!existingListing) {
      await prisma.listing.create({
        data: {
          projectId,
          sellerId: seller.id,
          quantity: project.availableCredits,
          pricePerCredit: project.pricePerCredit,
          status: "ACTIVE"
        }
      });
    }

    // 6. Mint credits in the PostgreSQL Ledger if they don't exist
    // First, ensure a registry exists for this project
    let registryId;
    const existingRegistry: any = await prisma.$queryRaw`SELECT id FROM registry WHERE "projectId" = ${projectId}`;
    if (existingRegistry && existingRegistry.length > 0) {
      registryId = existingRegistry[0].id;
    } else {
      const newReg: any = await prisma.$queryRaw`
        INSERT INTO registry ("projectId", name) 
        VALUES (${projectId}, ${'Registry for ' + project.name}) 
        RETURNING id;
      `;
      registryId = newReg[0].id;
    }

    const existingRanges: any = await prisma.$queryRaw`SELECT count(*) FROM credit_range WHERE registry_id = ${registryId}`;
    if (existingRanges && Number(existingRanges[0].count) === 0) {
      const hash = Math.random().toString(36).substring(7); // Simple dummy hash for demo

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

  revalidatePath("/admin");
  revalidatePath(`/admin/verify/${projectId}`);
  revalidatePath("/seller");
  revalidatePath("/marketplace");
  return { success: true };
}

export async function rejectVerification(projectId: string, comments: string) {
  await verifyAdmin();

  // 1. Update verification tracker
  await prisma.projectVerification.update({
    where: { projectId },
    data: {
      status: ProjectVerificationState.REJECTED,
      adminComments: comments,
      reviewedAt: new Date()
    }
  });

  // 2. Update actual project status
  await prisma.carbonProject.update({
    where: { id: projectId },
    data: {
      verificationStatus: VerificationStatus.REJECTED,
    }
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/verify/${projectId}`);
  revalidatePath("/seller");
  return { success: true };
}

export async function requestCorrection(projectId: string, comments: string) {
  await verifyAdmin();

  // 1. Update verification tracker
  await prisma.projectVerification.update({
    where: { projectId },
    data: {
      status: ProjectVerificationState.NEEDS_CORRECTION,
      adminComments: comments,
      reviewedAt: new Date()
    }
  });

  // Project status remains PENDING in the public CarbonProject table, 
  // since it is still in the application phase.

  revalidatePath("/admin");
  revalidatePath(`/admin/verify/${projectId}`);
  revalidatePath("/seller");
  return { success: true };
}
