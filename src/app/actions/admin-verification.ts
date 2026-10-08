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

  // 1. Update verification tracker
  await prisma.projectVerification.update({
    where: { projectId },
    data: {
      status: ProjectVerificationState.APPROVED,
      adminComments: comments,
      reviewedAt: new Date()
    }
  });

  // 2. Update actual project status so it becomes visible on the marketplace
  await prisma.carbonProject.update({
    where: { id: projectId },
    data: {
      verificationStatus: VerificationStatus.VERIFIED,
      verificationDate: new Date()
    }
  });

  // Note: Creating the Listing can be triggered automatically here or manually. 
  // We'll leave it simple for now and rely on the existing Listing logic if any, 
  // or the project will just appear as VERIFIED.

  revalidatePath("/admin");
  revalidatePath(`/admin/verify/${projectId}`);
  revalidatePath("/seller");
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
