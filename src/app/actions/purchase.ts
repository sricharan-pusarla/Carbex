"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

export async function executePurchase(projectId: string, quantity: number) {
  if (quantity <= 0) {
    return { success: false, error: "Quantity must be greater than 0" };
  }

  try {
    const user = await getCurrentUser();

    if (!user || user.role !== Role.BUYER) {
      return { success: false, error: "Authentication failed. You must be logged in as a Buyer." };
    }

    const buyer = { id: user.id }; // to keep the rest of the code working

    // 2. Fetch the project and verify availability
    const project = await prisma.carbonProject.findUnique({
      where: { id: projectId },
      include: { listings: true }
    });

    if (!project) {
      return { success: false, error: "Project not found." };
    }

    if (quantity > project.availableCredits) {
      return { success: false, error: "Not enough credits available for purchase." };
    }

    // Determine total amount
    const totalAmount = quantity * project.pricePerCredit;

    // For the demo, we assume the project has at least one listing we are buying from.
    // We'll use the first active listing ID if it exists.
    const listing = project.listings.find(l => l.status === "ACTIVE");

    // 3. Execute atomic database transaction
    await prisma.$transaction(async (tx) => {
      // Deduct available credits from the project
      await tx.carbonProject.update({
        where: { id: projectId },
        data: {
          availableCredits: {
            decrement: quantity
          }
        }
      });

      // Update listing if it exists
      if (listing) {
        await tx.listing.update({
          where: { id: listing.id },
          data: {
            quantity: {
              decrement: quantity
            }
          }
        });
      }

      // Create the transaction record (financial history)
      await tx.transaction.create({
        data: {
          buyerId: buyer.id,
          sellerId: listing ? listing.sellerId : buyer.id,
          listingId: listing?.id,
          projectId: projectId,
          quantity: quantity,
          pricePerCredit: project.pricePerCredit,
          totalAmount: totalAmount,
          status: "COMPLETED"
        }
      });

      // 4. CALL THE NEW RANGE LEDGER PL/pgSQL FUNCTION
      // Fetch the registry ID for this project
      const registry: any[] = await tx.$queryRaw`SELECT id FROM "registry" WHERE "projectId" = ${projectId} LIMIT 1`;
      if (!registry.length) throw new Error("Registry not found");

      // Find who currently owns the available credits (the seller/developer)
      const availableOwner: any[] = await tx.$queryRaw`
        SELECT owner_id FROM "credit_range" 
        WHERE registry_id = ${registry[0].id} AND status = 'AVAILABLE' AND owner_id != ${buyer.id}
        LIMIT 1
      `;
      const actualSellerId = listing ? listing.sellerId : (availableOwner.length > 0 ? availableOwner[0].owner_id : buyer.id);

      // Execute transfer
      await tx.$executeRaw`SELECT transfer_credits(${registry[0].id}, ${actualSellerId}, ${buyer.id}, ${quantity}::int8)`;
    });

    // Revalidate paths to refresh the UI
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/marketplace`);
    
    return { success: true, message: "Purchase completed successfully." };

  } catch (error) {
    console.error("Purchase error:", error);
    return { success: false, error: "An unexpected error occurred during the transaction." };
  }
}
