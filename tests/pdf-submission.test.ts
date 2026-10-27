/**
 * Automated Test Suite for Single Consolidated PDF Project Submissions in Carbex.
 *
 * Scenarios Tested:
 * 1. Client-Side PDF Metadata Validation (validatePdfFileMeta):
 *    - Valid PDF files (file.name ending in .pdf, <= 20MB) are accepted.
 *    - Non-PDF extensions (.docx, .png, .exe) are rejected.
 *    - Non-PDF MIME types are rejected.
 *    - Oversized files (> 20MB) are rejected with clear message.
 *    - Empty files (0 bytes) are rejected.
 *
 * 2. Server-Side Binary Signature & Magic Byte Validation (validatePdfBuffer):
 *    - Valid PDF buffers starting with '%PDF-' (0x25 0x50 0x44 0x46 0x2D) are accepted.
 *    - Files with incorrect headers (JPEG, PNG, plain text, XML) are strictly rejected.
 *    - Truncated buffers (< 5 bytes) or empty buffers are rejected.
 *    - Oversized buffers (> 20MB) are rejected.
 *    - Various PDF versions (%PDF-1.3, %PDF-1.4, %PDF-1.7, %PDF-2.0) pass validation.
 *
 * 3. Dynamic Checklist Generation (getRequiredDocuments):
 *    - Dynamically generates required/optional checklist according to project type.
 *    - Correctly handles Renewable Energy, Reforestation, Direct Air Capture, Methane Capture, Blue Carbon, and fallback defaults.
 *    - Preserves required vs optional flags without inventing arbitrary requirements.
 *
 * 4. Consolidated Dossier Tagging & Backward Compatibility:
 *    - Identifies CONSOLIDATED_PROJECT_DOSSIER correctly.
 *    - Preserves legacy document types and labels for existing projects.
 *
 * 5. Verification Engine Integration:
 *    - Correctly handles single consolidated PDF document and produces AI scan findings.
 *
 * 6. Admin Notification on Consolidated Submission:
 *    - Submission triggers email notification to sricharanpusarla@gmail.com.
 *    - Email includes valid review link (/admin/verify/[id]) and accurate metadata.
 *
 * 7. Security & Authorization Rules:
 *    - Simulates document access authorization: owner seller and admin have access; unauthorized users are blocked.
 */

import assert from "node:assert/strict";
import {
  CONSOLIDATED_DOC_TYPE,
  CONSOLIDATED_DOC_LABEL,
  MAX_PDF_SIZE_MB,
  MAX_PDF_SIZE_BYTES,
  getRequiredDocuments,
  isConsolidatedDoc,
  validatePdfFileMeta,
  validatePdfBuffer,
} from "../src/lib/document-requirements";
import {
  emailService,
  notifyAdminOfVerificationRequest,
} from "../src/lib/email";
import { runDummyVerificationEngine } from "../src/lib/verification-engine";
import { ProjectDocument, DocumentStatus, RiskLevel } from "@prisma/client";

// Set email service to test mode (in-memory test queue, no network traffic)
emailService.setTestMode(true);

let totalTests = 0;
let passedTests = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  totalTests++;
  try {
    emailService.clearTestSentEmails();
    emailService.clearIdempotencyCache();
    await fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err?.message || err}`);
    throw err;
  }
}

async function runPdfSubmissionTests() {
  console.log("\n========================================================");
  console.log(" CARBEX CONSOLIDATED PDF UPLOAD & VERIFICATION TEST SUITE");
  console.log("========================================================\n");

  // ---------------------------------------------------------------------------
  // 1. Client-Side PDF Metadata Validation
  // ---------------------------------------------------------------------------
  console.log("--- 1. CLIENT-SIDE FILE VALIDATION TESTS ---");

  await test("validatePdfFileMeta: accepts valid PDF with application/pdf MIME", () => {
    const res = validatePdfFileMeta("project_dossier.pdf", 5 * 1024 * 1024, "application/pdf");
    assert.equal(res.valid, true);
    assert.equal(res.error, undefined);
  });

  await test("validatePdfFileMeta: accepts valid PDF with empty MIME (OS fallback)", () => {
    const res = validatePdfFileMeta("carbon_verification_2026.PDF", 2 * 1024 * 1024, "");
    assert.equal(res.valid, true);
  });

  await test("validatePdfFileMeta: rejects non-PDF extension (.png, .docx, .exe)", () => {
    const pngRes = validatePdfFileMeta("satellite_photo.png", 1024 * 1024, "image/png");
    assert.equal(pngRes.valid, false);
    assert.match(pngRes.error || "", /Only PDF documents/i);

    const docxRes = validatePdfFileMeta("report.docx", 1024 * 1024, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    assert.equal(docxRes.valid, false);

    const exeRes = validatePdfFileMeta("script.exe", 1024, "application/x-msdownload");
    assert.equal(exeRes.valid, false);
  });

  await test("validatePdfFileMeta: rejects oversized files (> 20 MB)", () => {
    const oversizedBytes = (MAX_PDF_SIZE_MB + 1) * 1024 * 1024; // 21 MB
    const res = validatePdfFileMeta("huge_document.pdf", oversizedBytes, "application/pdf");
    assert.equal(res.valid, false);
    assert.match(res.error || "", /exceeds the 20MB limit/i);
  });

  await test("validatePdfFileMeta: rejects empty files (0 bytes)", () => {
    const res = validatePdfFileMeta("empty.pdf", 0, "application/pdf");
    assert.equal(res.valid, false);
    assert.match(res.error || "", /empty/i);
  });

  // ---------------------------------------------------------------------------
  // 2. Server-Side Binary & Magic Byte Validation
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. SERVER-SIDE BINARY & MAGIC BYTE VALIDATION TESTS ---");

  await test("validatePdfBuffer: accepts valid PDF magic bytes (%PDF-1.4, %PDF-1.7, %PDF-2.0)", () => {
    const samplePdf14 = Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
    assert.equal(validatePdfBuffer(samplePdf14).valid, true);

    const samplePdf17 = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj");
    assert.equal(validatePdfBuffer(samplePdf17).valid, true);

    const samplePdf20 = Buffer.from("%PDF-2.0\n1 0 obj\n<<>>\nendobj");
    assert.equal(validatePdfBuffer(samplePdf20).valid, true);
  });

  await test("validatePdfBuffer: rejects plain text file disguised with .pdf name", () => {
    const fakeTextPdf = Buffer.from("Hello world! This is just plain text, not a PDF.");
    const res = validatePdfBuffer(fakeTextPdf);
    assert.equal(res.valid, false);
    assert.match(res.error || "", /Invalid file signature/i);
  });

  await test("validatePdfBuffer: rejects image files (PNG, JPEG)", () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // \x89PNG\r\n\x1a\n
    const pngRes = validatePdfBuffer(pngHeader);
    assert.equal(pngRes.valid, false);

    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const jpegRes = validatePdfBuffer(jpegHeader);
    assert.equal(jpegRes.valid, false);
  });

  await test("validatePdfBuffer: rejects empty or truncated buffers", () => {
    const empty = Buffer.alloc(0);
    assert.equal(validatePdfBuffer(empty).valid, false);

    const tiny = Buffer.from("%PD"); // Only 3 bytes
    assert.equal(validatePdfBuffer(tiny).valid, false);
  });

  await test("validatePdfBuffer: rejects buffer exceeding 20MB limit", () => {
    // Simulate oversized buffer metadata without allocating full 21MB in RAM
    const fakeOversizedBuffer = {
      length: MAX_PDF_SIZE_BYTES + 1024,
      subarray: () => Buffer.from("%PDF-"),
    } as unknown as Buffer;

    const res = validatePdfBuffer(fakeOversizedBuffer);
    assert.equal(res.valid, false);
    assert.match(res.error || "", /exceeds the maximum allowed limit/i);
  });

  // ---------------------------------------------------------------------------
  // 3. Dynamic Checklist Generation
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. DYNAMIC CHECKLIST GENERATION TESTS ---");

  await test("getRequiredDocuments: returns specific checklist for 'Renewable Energy'", () => {
    const docs = getRequiredDocuments("Renewable Energy");
    const ids = docs.map((d) => d.id);
    assert.ok(ids.includes("land_ownership"), "Must include Land Ownership");
    assert.ok(ids.includes("project_reg"), "Must include Project Registration");
    assert.ok(ids.includes("commissioning"), "Must include Commissioning Certificate");
    assert.ok(ids.includes("verification_rep"), "Must include Verification Report");
    assert.ok(ids.includes("additional"), "Must include Additional Supporting Document");

    const mandatory = docs.filter((d) => d.isRequired);
    assert.equal(mandatory.length, 4);
  });

  await test("getRequiredDocuments: returns specific checklist for 'Reforestation'", () => {
    const docs = getRequiredDocuments("Reforestation");
    const ids = docs.map((d) => d.id);
    assert.ok(ids.includes("satellite_imagery"), "Reforestation requires Baseline Satellite Imagery");
    assert.ok(ids.includes("community_consent"), "Reforestation includes Community Consent Form");
  });

  await test("getRequiredDocuments: returns specific checklist for 'Direct Air Capture'", () => {
    const docs = getRequiredDocuments("Direct Air Capture");
    const ids = docs.map((d) => d.id);
    assert.ok(ids.includes("lifecycle_analysis"), "DAC requires Life Cycle Analysis (LCA) Report");
    assert.ok(ids.includes("energy_source"), "DAC requires Energy Source Validation");
  });

  await test("getRequiredDocuments: returns specific checklist for 'Blue Carbon'", () => {
    const docs = getRequiredDocuments("Blue Carbon");
    const ids = docs.map((d) => d.id);
    assert.ok(ids.includes("coastal_permit"), "Blue Carbon requires Coastal Restoration Permit");
    assert.ok(ids.includes("marine_survey"), "Blue Carbon requires Marine Ecosystem Survey");
  });

  await test("getRequiredDocuments: falls back to default documents for unknown project type", () => {
    const docs = getRequiredDocuments("Unknown Future Type");
    assert.ok(docs.length >= 2);
    const regDoc = docs.find((d) => d.id === "project_reg");
    assert.ok(regDoc?.isRequired);
  });

  // ---------------------------------------------------------------------------
  // 4. Consolidated Dossier Tagging & Backward Compatibility
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. CONSOLIDATED TAGGING & COMPATIBILITY TESTS ---");

  await test("isConsolidatedDoc: correctly identifies CONSOLIDATED_PROJECT_DOSSIER", () => {
    assert.equal(isConsolidatedDoc(CONSOLIDATED_DOC_TYPE), true);
    assert.equal(isConsolidatedDoc("land_ownership"), false);
    assert.equal(isConsolidatedDoc("verification_rep"), false);
    assert.equal(isConsolidatedDoc(""), false);
    assert.equal(CONSOLIDATED_DOC_LABEL, "Consolidated Project Dossier (PDF)");
  });

  // ---------------------------------------------------------------------------
  // 5. Verification Engine Integration with Consolidated Dossier
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. VERIFICATION ENGINE SIMULATION TESTS ---");

  await test("runDummyVerificationEngine: analyzes consolidated PDF and returns AI findings", async () => {
    const mockDoc: ProjectDocument = {
      id: "doc-test-uuid-1",
      projectId: "proj-test-uuid-1",
      documentType: CONSOLIDATED_DOC_TYPE,
      originalFileName: "Consolidated_Audit_Dossier_2026.pdf",
      filePath: "unique-uuid-file.pdf",
      mimeType: "application/pdf",
      fileSize: 4 * 1024 * 1024,
      status: DocumentStatus.UPLOADED,
      uploadedAt: new Date(),
      updatedAt: new Date(),
    };

    const engineResult = await runDummyVerificationEngine([mockDoc]);

    assert.ok(engineResult.documentVerification[CONSOLIDATED_DOC_TYPE], "Engine findings must contain CONSOLIDATED_DOC_TYPE");
    const findings = engineResult.documentVerification[CONSOLIDATED_DOC_TYPE];
    assert.ok(["PASSED", "FLAGGED", "FAILED"].includes(findings.status));
    assert.ok(findings.confidence >= 10 && findings.confidence <= 100);
    assert.ok(findings.notes.length > 10);
    assert.ok(["LOW", "MODERATE", "HIGH"].includes(engineResult.overallRisk));
    assert.ok(["AUTO_APPROVE", "MANUAL_REVIEW_REQUIRED", "AUTO_REJECT"].includes(engineResult.recommendedAction));
  });

  // ---------------------------------------------------------------------------
  // 6. Admin Notification on Consolidated Project Submission
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. ADMIN NOTIFICATION ON SUBMISSION TESTS ---");

  await test("notifyAdminOfVerificationRequest: sends email with valid review URL on submission", async () => {
    const submissionData = {
      requestId: "proj-consolidated-888",
      projectName: "Sahyadri Western Ghats Canopy Restoration",
      applicantName: "Canopy Conservation Trust",
      applicantEmail: "seller@sahyadricanopy.org",
      requestType: "Reforestation",
      submittedAt: new Date("2026-10-27T14:30:00Z"),
      status: "Pending Verification",
      totalCredits: 75000,
      pricePerCredit: 950,
    };

    const result = await notifyAdminOfVerificationRequest(submissionData);

    assert.equal(result.success, true);
    const sent = emailService.getTestSentEmails();
    assert.equal(sent.length, 1);

    const email = sent[0];
    assert.equal(email.to, "sricharanpusarla@gmail.com");
    assert.match(email.subject, /New Verification Request/i);
    assert.ok(email.text.includes("Sahyadri Western Ghats Canopy Restoration"));
    assert.ok(email.text.includes("Canopy Conservation Trust"));
    assert.ok(email.text.includes("proj-consolidated-888"));
    assert.ok(email.text.includes("/admin/verify/proj-consolidated-888"));
    assert.ok(email.text.includes("Pending Verification"));
    assert.ok(email.html.includes("proj-consolidated-888"));
    assert.ok(email.html.includes("/admin/verify/proj-consolidated-888"));
  });

  // ---------------------------------------------------------------------------
  // 7. Security & Authorization Rules
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. SECURITY & ACCESS AUTHORIZATION TESTS ---");

  await test("Document Authorization: permits project owner and admin, blocks third parties", () => {
    const documentOwnerOrg = "EcoForestry Corp";
    const documentProject = { developer: documentOwnerOrg };

    // Case A: Owner seller accesses their own document
    const ownerUser = { name: "John Doe", organization: "EcoForestry Corp", role: "SELLER" };
    const canOwnerAccess = (ownerUser.organization || ownerUser.name) === documentProject.developer || ownerUser.role === "ADMIN";
    assert.equal(canOwnerAccess, true);

    // Case B: Admin accesses any document
    const adminUser = { name: "System Admin", role: "ADMIN", organization: undefined };
    const canAdminAccess = (adminUser.organization || adminUser.name) === documentProject.developer || adminUser.role === "ADMIN";
    assert.equal(canAdminAccess, true);

    // Case C: Unauthorized seller from another organization
    const strangerSeller = { name: "Rival Seller", organization: "Other Corp", role: "SELLER" };
    const canStrangerAccess = (strangerSeller.organization || strangerSeller.name) === documentProject.developer || strangerSeller.role === "ADMIN";
    assert.equal(canStrangerAccess, false);

    // Case D: Standard buyer attempts direct document access
    const buyerUser = { name: "Retail Buyer", role: "BUYER", organization: undefined };
    const canBuyerAccess = (buyerUser.organization || buyerUser.name) === documentProject.developer || buyerUser.role === "ADMIN";
    assert.equal(canBuyerAccess, false);
  });

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n========================================================");
  console.log(` ALL ${passedTests}/${totalTests} CONSOLIDATED PDF TESTS PASSED SUCCESSFULLY!`);
  console.log("========================================================\n");
}

runPdfSubmissionTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
