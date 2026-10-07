"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function executeRetirement(ownershipId: string, quantityToRetire: number) {
  if (quantityToRetire <= 0) {
    return { success: false, error: "Quantity must be greater than 0" };
  }

  try {
    // 1. Mock Authentication
    const buyer = await prisma.user.findFirst({
      where: { role: Role.BUYER }
    });

    if (!buyer) {
      return { success: false, error: "Authentication failed. No buyer account found." };
    }

    // 2. Fetch ownership record
    const ownership = await prisma.creditOwnership.findUnique({
      where: { id: ownershipId },
      include: { project: true }
    });

    if (!ownership || ownership.userId !== buyer.id) {
      return { success: false, error: "Ownership record not found." };
    }

    if (quantityToRetire > ownership.quantity) {
      return { success: false, error: "You don't own enough credits to retire this amount." };
    }

    // Generate a unique certificate ID
    const dateStr = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const certificateId = `CRB-RET-${dateStr}-${randomSuffix}`;

    let retirementId = "";

    // 3. Execute atomic database transaction
    await prisma.$transaction(async (tx) => {
      // Create the retirement record
      const retirement = await tx.retirement.create({
        data: {
          userId: buyer.id,
          projectId: ownership.projectId,
          quantity: quantityToRetire,
          certificateId: certificateId,
        }
      });
      retirementId = retirement.id;

      // Deduct from ownership
      if (quantityToRetire === ownership.quantity) {
        // If retiring all, delete the ownership record
        await tx.creditOwnership.delete({
          where: { id: ownershipId }
        });
      } else {
        // Otherwise decrement
        await tx.creditOwnership.update({
          where: { id: ownershipId },
          data: {
            quantity: {
              decrement: quantityToRetire
            }
          }
        });
      }
    });

    revalidatePath("/dashboard");
    
    // Return the ID so the client can redirect to the certificate page
    return { success: true, retirementId };

  } catch (error) {
    console.error("Retirement error:", error);
    return { success: false, error: "An unexpected error occurred during retirement." };
  }
}
