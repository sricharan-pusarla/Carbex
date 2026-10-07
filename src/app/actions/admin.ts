"use server";

import { prisma } from "@/lib/prisma";
import { VerificationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function approveProject(projectId: string) {
  try {
    const project = await prisma.carbonProject.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return { success: false, error: "Project not found." };
    }

    // Verify the project and set verification date
    await prisma.carbonProject.update({
      where: { id: projectId },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        verificationDate: new Date()
      }
    });

    // Check if a listing already exists, if not create one
    const existingListing = await prisma.listing.findFirst({
      where: { projectId }
    });

    if (!existingListing) {
      // Find any seller to attach the listing to
      const seller = await prisma.user.findFirst({
        where: { role: "SELLER" }
      });

      if (seller) {
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
    } else {
      await prisma.listing.update({
        where: { id: existingListing.id },
        data: { status: "ACTIVE" }
      });
    }

    revalidatePath("/admin");
    revalidatePath("/marketplace");
    revalidatePath(`/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error("Approve project error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function rejectProject(projectId: string) {
  try {
    await prisma.carbonProject.update({
      where: { id: projectId },
      data: { verificationStatus: VerificationStatus.REJECTED }
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Reject project error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
