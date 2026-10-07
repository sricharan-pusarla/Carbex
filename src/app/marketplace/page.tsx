import { prisma } from "@/lib/prisma";
import MarketplaceClient from "./marketplace-client";
import { VerificationStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

export default async function MarketplacePage() {
  const projects = await prisma.carbonProject.findMany({
    where: {
      verificationStatus: VerificationStatus.VERIFIED,
      availableCredits: {
        gt: 0
      }
    },
    include: {
      trustScore: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Carbon Credit Marketplace</h1>
        <p className="text-lg text-muted-foreground">
          Discover and evaluate verified carbon credits. Use our data-driven Trust Score to make informed, low-risk purchases.
        </p>
      </div>
      
      <MarketplaceClient initialProjects={projects} />
    </div>
  );
}
