"use server";

import { prisma } from "@/lib/prisma";
import { Role, VerificationStatus, DocumentStatus, ProjectVerificationState } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { evaluateProjectTrust } from "@/lib/trust-score";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { runDummyVerificationEngine } from "@/lib/verification-engine";
import { notifyAdminOfVerificationRequest } from "@/lib/email";
import { CONSOLIDATED_DOC_TYPE, validatePdfBuffer } from "@/lib/document-requirements";

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

    // 1. Validate form fields
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

    // 2. Validate document(s) BEFORE creating project record
    // Look for consolidated_document first
    const consolidatedEntry = formData.get("consolidated_document");
    let isConsolidated = false;
    let consolidatedBuffer: Buffer | null = null;
    let consolidatedFileName = "";
    let consolidatedFileSize = 0;

    if (consolidatedEntry && consolidatedEntry instanceof File && consolidatedEntry.size > 0) {
      isConsolidated = true;
      consolidatedFileName = consolidatedEntry.name;
      consolidatedFileSize = consolidatedEntry.size;
      const arrayBuf = await consolidatedEntry.arrayBuffer();
      consolidatedBuffer = Buffer.from(arrayBuf);

      const validation = validatePdfBuffer(consolidatedBuffer);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    }

    // Fallback: check for legacy document_* entries
    const legacyEntries: { key: string; file: File; buffer: Buffer }[] = [];
    if (!isConsolidated) {
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('document_') && value instanceof File && value.size > 0) {
          const arrayBuf = await value.arrayBuffer();
          legacyEntries.push({ key, file: value, buffer: Buffer.from(arrayBuf) });
        }
      }

      if (legacyEntries.length === 0) {
        return {
          success: false,
          error: "Please upload the consolidated project PDF document containing all required verifications."
        };
      }
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

    // 4. Store Document(s) to filesystem and database
    const storageDir = join(process.cwd(), 'storage', 'documents');
    await mkdir(storageDir, { recursive: true });

    const savedDocuments = [];

    if (isConsolidated && consolidatedBuffer) {
      const sanitizedName = consolidatedFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilename = `${randomUUID()}-${sanitizedName}`;
      const filePath = join(storageDir, uniqueFilename);

      await writeFile(filePath, consolidatedBuffer);

      const savedDoc = await prisma.projectDocument.create({
        data: {
          projectId: project.id,
          documentType: CONSOLIDATED_DOC_TYPE,
          originalFileName: consolidatedFileName,
          filePath: uniqueFilename, // Secure: only storing the filename
          mimeType: "application/pdf",
          fileSize: consolidatedFileSize,
          status: DocumentStatus.UPLOADED
        }
      });
      savedDocuments.push(savedDoc);
    } else {
      // Legacy document processing
      for (const entry of legacyEntries) {
        const docId = entry.key.replace('document_', '');
        const sanitizedName = entry.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFilename = `${randomUUID()}-${sanitizedName}`;
        const filePath = join(storageDir, uniqueFilename);

        await writeFile(filePath, entry.buffer);

        const savedDoc = await prisma.projectDocument.create({
          data: {
            projectId: project.id,
            documentType: docId,
            originalFileName: entry.file.name,
            filePath: uniqueFilename,
            mimeType: entry.file.type || "application/octet-stream",
            fileSize: entry.file.size,
            status: DocumentStatus.UPLOADED
          }
        });
        savedDocuments.push(savedDoc);
      }
    }

    // 5. Initialize Verification Tracker & Run Dummy Engine
    const hasDocuments = savedDocuments.length > 0;
    let verificationState = hasDocuments ? ProjectVerificationState.DOCUMENTS_SUBMITTED : ProjectVerificationState.DRAFT;
    let engineFindings = null;
    let engineRisk = null;

    if (hasDocuments) {
      const engineResult = await runDummyVerificationEngine(savedDocuments, project);
      engineFindings = JSON.stringify(engineResult);
      engineRisk = engineResult.overallRisk;
      
      if (engineResult.recommendedAction === "MANUAL_REVIEW_REQUIRED") {
        verificationState = ProjectVerificationState.UNDER_REVIEW;
      } else if (engineResult.recommendedAction === "AUTO_APPROVE") {
        verificationState = ProjectVerificationState.APPROVED;
      }
    }

    await prisma.projectVerification.create({
      data: {
        projectId: project.id,
        status: verificationState,
        riskLevel: engineRisk,
        findings: engineFindings,
      }
    });

    // 6. Generate simulated auditing scores for the Trust Score Engine
    let docScoreBase = 80;
    let verScoreBase = 80;

    if (hasDocuments && engineFindings) {
      const engineResult = JSON.parse(engineFindings);
      if (engineResult.overallRisk === "HIGH") {
        docScoreBase = 40;
        verScoreBase = 40;
      } else if (engineResult.overallRisk === "MODERATE") {
        docScoreBase = 65;
        verScoreBase = 65;
      } else {
        docScoreBase = 90;
        verScoreBase = 90;
      }
    }

    const rawScores = {
      verificationScore: Math.floor(Math.random() * 20) + (verScoreBase - 10),
      documentationScore: Math.floor(Math.random() * 20) + (docScoreBase - 10),
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

    revalidatePath("/seller");

    // Asynchronously notify administrator about the new verification request
    notifyAdminOfVerificationRequest({
      requestId: project.id,
      projectName: project.name,
      applicantName: seller.organization || seller.name,
      applicantEmail: user.email,
      requestType: project.projectType,
      submittedAt: project.createdAt || new Date(),
      status: "Pending Verification",
      totalCredits: project.totalCredits,
      pricePerCredit: project.pricePerCredit,
    }).catch((err) => {
      console.error("[Project Submission] Admin notification email background failure:", err);
    });
    
    return { success: true, projectId: project.id };

  } catch (error) {
    console.error("Project submission error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
