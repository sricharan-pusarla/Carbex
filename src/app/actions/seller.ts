"use server";

import { prisma } from "@/lib/prisma";
import { Role, VerificationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { evaluateProjectTrust } from "@/lib/trust-score";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";

const projectSchema = z.object({
  name: z.string().min(5),
  description: z.string().min(20),
  projectType: z.string().min(2),
  location: z.string().min(2),
  country: z.string().min(2),
  methodology: z.string().min(2),
  verificationStandard: z.string().min(2),
  totalCredits: z.number().positive(),
  pricePerCredit: z.number().positive(),
});

export async function submitProject(formData: FormData) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== Role.SELLER) {
      return { success: false, error: "Authentication failed. You must be logged in as a Seller." };
    }

    const seller = { id: user.id, name: user.name, organization: user.organization || "" };

    // 2. Validate input
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      projectType: formData.get("projectType") as string,
      location: formData.get("location") as string,
      country: formData.get("country") as string,
      methodology: formData.get("methodology") as string,
      verificationStandard: formData.get("verificationStandard") as string,
      totalCredits: Number(formData.get("totalCredits")),
      pricePerCredit: Number(formData.get("pricePerCredit")),
    };

    const parsed = projectSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid form data. Please check your inputs." };
    }

    // 3. Create the project (Status PENDING by default)
    const project = await prisma.carbonProject.create({
      data: {
        ...parsed.data,
        developer: seller.organization || seller.name,
        availableCredits: parsed.data.totalCredits,
        projectStartDate: new Date(),
        verificationStatus: VerificationStatus.PENDING,
      }
    });

    // 4. Generate simulated auditing scores for the Trust Score Engine
    // In a real app, this would come from an external oracle or auditing firm.
    const rawScores = {
      verificationScore: Math.floor(Math.random() * 40) + 60, // 60-100
      documentationScore: Math.floor(Math.random() * 40) + 60,
      additionalityScore: Math.floor(Math.random() * 40) + 60,
      historyScore: Math.floor(Math.random() * 40) + 60,
      provenanceScore: Math.floor(Math.random() * 40) + 60,
      doubleCountingScore: Math.floor(Math.random() * 40) + 60,
    };

    const trustEvaluation = evaluateProjectTrust(rawScores);

    await prisma.trustScore.create({
      data: {
        projectId: project.id,
        ...trustEvaluation
      }
    });

    // We do not create a Listing yet. Listings are only active when VERIFIED.
    // The admin will verify it in Phase 11.

    revalidatePath("/seller");
    
    return { success: true, projectId: project.id };

  } catch (error) {
    console.error("Project submission error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
