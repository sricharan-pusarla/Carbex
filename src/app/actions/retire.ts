"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export async function executeRetirement(ownershipId: string, quantityToRetire: number) {
  if (quantityToRetire <= 0) {
    return { success: false, error: "Quantity must be greater than 0" };
  }

  try {
    const user = await getCurrentUser();

    if (!user || user.role !== Role.BUYER) {
      return { success: false, error: "Authentication failed. You must be logged in as a Buyer." };
    }

    const buyer = { id: user.id };

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
      
      // 4. CALL THE NEW RANGE LEDGER PL/pgSQL FUNCTION
      const registry: any[] = await tx.$queryRaw`SELECT id FROM "registry" WHERE "projectId" = ${ownership.projectId} LIMIT 1`;
      if (!registry.length) throw new Error("Registry not found");

      await tx.$executeRaw`SELECT retire_credits(${registry[0].id}, ${buyer.id}, ${quantityToRetire}::int8)`;

      // Fetch the retirement view ID to return to the client
      const retView: any[] = await tx.$queryRaw`
        SELECT id FROM "Retirement" 
        WHERE "userId" = ${buyer.id} AND "projectId" = ${ownership.projectId}
        LIMIT 1
      `;
      if (retView.length > 0) {
        retirementId = retView[0].id;
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
