import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RetireClient } from "./retire-client";

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export const dynamic = 'force-dynamic';

export default async function RetirePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.BUYER) {
    redirect("/login");
  }

  const ownership = await prisma.creditOwnership.findUnique({
    where: { id: params.id },
    include: { project: true }
  });

  if (!ownership || ownership.userId !== user.id) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Retire Credits</h1>
        <p className="text-lg text-muted-foreground">
          Permanently remove carbon credits from circulation to claim their environmental benefit.
        </p>
      </div>
      
      <RetireClient 
        ownershipId={ownership.id} 
        projectName={ownership.project.name} 
        maxQuantity={ownership.quantity} 
      />
    </div>
  );
}
