import { ProjectDocument, RiskLevel } from "@prisma/client";
import { CONSOLIDATED_DOC_TYPE } from "./document-requirements";

export type DocumentVerificationResult = {
  status: "PASSED" | "FLAGGED" | "FAILED";
  confidence: number;
  notes: string;
};

export type VerificationEngineResult = {
  documentVerification: Record<string, DocumentVerificationResult>;
  overallRisk: RiskLevel;
  recommendedAction: "AUTO_APPROVE" | "MANUAL_REVIEW_REQUIRED" | "AUTO_REJECT";
};

/**
 * DUMMY VERIFICATION ENGINE
 * 
 * IMPORTANT: This is a placeholder for a future ML/OCR microservice.
 * Currently, it strictly generates randomized but realistic-looking 
 * mock data to simulate an AI document scan.
 */
export async function runDummyVerificationEngine(documents: ProjectDocument[]): Promise<VerificationEngineResult> {
  // Simulate network/processing delay (1.5 seconds)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const documentVerification: Record<string, DocumentVerificationResult> = {};
  let flagCount = 0;
  let failCount = 0;

  for (const doc of documents) {
    const isConsolidated = doc.documentType === CONSOLIDATED_DOC_TYPE;

    // Generate random outcome
    const rand = Math.random();
    let status: "PASSED" | "FLAGGED" | "FAILED" = "PASSED";
    let confidence = Math.floor(Math.random() * 15) + 85; // 85-99
    let notes = isConsolidated
      ? "Consolidated PDF verified successfully. All required sections, stamps, and metadata conform to project specifications."
      : "Document verified successfully. Metadata matches project parameters.";

    if (rand > 0.85) {
      status = "FLAGGED";
      confidence = Math.floor(Math.random() * 30) + 40; // 40-70
      notes = isConsolidated
        ? "Warning: Potential clarity or page order issues identified in consolidated PDF. Manual review recommended."
        : "Warning: Date mismatch detected or image clarity is poor. Manual review recommended.";
      flagCount++;
    } else if (rand > 0.98) {
      status = "FAILED";
      confidence = Math.floor(Math.random() * 20) + 10; // 10-30
      notes = isConsolidated
        ? "Error: Consolidated PDF appears corrupted, manipulated, or missing essential legal certification sections."
        : "Error: Document appears manipulated or contains critical missing signatures.";
      failCount++;
    }

    documentVerification[doc.documentType] = { status, confidence, notes };
  }

  // Determine overall risk
  let overallRisk: RiskLevel = "LOW";
  let recommendedAction: "AUTO_APPROVE" | "MANUAL_REVIEW_REQUIRED" | "AUTO_REJECT" = "AUTO_APPROVE";

  if (failCount > 0) {
    overallRisk = "HIGH";
    recommendedAction = "AUTO_REJECT";
  } else if (flagCount > 0) {
    overallRisk = "MODERATE";
    recommendedAction = "MANUAL_REVIEW_REQUIRED";
  } else {
    // Even if passed, sometimes we just require manual review in demo
    recommendedAction = Math.random() > 0.5 ? "MANUAL_REVIEW_REQUIRED" : "AUTO_APPROVE";
  }

  return {
    documentVerification,
    overallRisk,
    recommendedAction
  };
}
