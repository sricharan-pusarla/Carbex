export type DocumentRequirement = {
  id: string;
  name: string;
  isRequired: boolean;
};

export const CONSOLIDATED_DOC_TYPE = "CONSOLIDATED_PROJECT_DOSSIER";
export const CONSOLIDATED_DOC_LABEL = "Consolidated Project Dossier (PDF)";
export const MAX_PDF_SIZE_MB = 20;
export const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024; // 20 MB

export const PROJECT_TYPE_DOCUMENTS: Record<string, DocumentRequirement[]> = {
  "Renewable Energy": [
    { id: "land_ownership", name: "Land Ownership Document", isRequired: true },
    { id: "project_reg", name: "Project Registration Certificate", isRequired: true },
    { id: "commissioning", name: "Installation/Commissioning Certificate", isRequired: true },
    { id: "verification_rep", name: "Verification Report", isRequired: true },
    { id: "additional", name: "Additional Supporting Document", isRequired: false },
  ],
  "Reforestation": [
    { id: "land_ownership", name: "Land Ownership Document", isRequired: true },
    { id: "project_reg", name: "Project Registration Certificate", isRequired: true },
    { id: "satellite_imagery", name: "Baseline Satellite Imagery", isRequired: true },
    { id: "verification_rep", name: "Verification Report", isRequired: true },
    { id: "community_consent", name: "Community Consent Form", isRequired: false },
  ],
  "Direct Air Capture": [
    { id: "facility_permit", name: "Facility Operating Permit", isRequired: true },
    { id: "lifecycle_analysis", name: "Life Cycle Analysis (LCA) Report", isRequired: true },
    { id: "energy_source", name: "Energy Source Validation", isRequired: true },
    { id: "verification_rep", name: "Verification Report", isRequired: true },
    { id: "additional", name: "Additional Supporting Document", isRequired: false },
  ],
  "Methane Capture": [
    { id: "facility_permit", name: "Facility Operating Permit", isRequired: true },
    { id: "methane_flaring", name: "Methane Flaring/Usage Logs", isRequired: true },
    { id: "verification_rep", name: "Verification Report", isRequired: true },
    { id: "additional", name: "Additional Supporting Document", isRequired: false },
  ],
  "Blue Carbon": [
    { id: "coastal_permit", name: "Coastal Restoration Permit", isRequired: true },
    { id: "marine_survey", name: "Marine Ecosystem Survey", isRequired: true },
    { id: "verification_rep", name: "Verification Report", isRequired: true },
    { id: "additional", name: "Additional Supporting Document", isRequired: false },
  ],
};

export const DEFAULT_DOCUMENTS: DocumentRequirement[] = [
  { id: "project_reg", name: "Project Registration Certificate", isRequired: true },
  { id: "verification_rep", name: "Verification Report", isRequired: true },
  { id: "additional", name: "Additional Supporting Document", isRequired: false },
];

export function getRequiredDocuments(projectType: string): DocumentRequirement[] {
  return PROJECT_TYPE_DOCUMENTS[projectType] || DEFAULT_DOCUMENTS;
}

export function isConsolidatedDoc(documentType: string): boolean {
  return documentType === CONSOLIDATED_DOC_TYPE;
}

/**
 * Validates basic client-side file metadata (filename, size, MIME type if provided)
 */
export function validatePdfFileMeta(name: string, size: number, type?: string): { valid: boolean; error?: string } {
  if (!name || !name.toLowerCase().endsWith(".pdf")) {
    return { valid: false, error: "Only PDF documents (.pdf) are accepted." };
  }
  if (type && type !== "" && type !== "application/pdf") {
    return { valid: false, error: "Invalid file type. Only PDF documents are allowed." };
  }
  if (size <= 0) {
    return { valid: false, error: "The selected PDF file is empty (0 bytes)." };
  }
  if (size > MAX_PDF_SIZE_BYTES) {
    return { valid: false, error: `File size exceeds the ${MAX_PDF_SIZE_MB}MB limit. Please compress your PDF and try again.` };
  }
  return { valid: true };
}

/**
 * Server-side validation of PDF binary contents:
 * - Checks buffer existence and non-emptiness
 * - Checks size limit (20MB)
 * - Verifies genuine PDF magic bytes (%PDF- / 0x25 0x50 0x44 0x46 0x2D)
 */
export function validatePdfBuffer(buffer: Buffer): { valid: boolean; error?: string } {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "The uploaded PDF file is empty or missing." };
  }
  if (buffer.length > MAX_PDF_SIZE_BYTES) {
    return { valid: false, error: `Uploaded PDF exceeds the maximum allowed limit of ${MAX_PDF_SIZE_MB}MB.` };
  }
  // PDF standard header starts with '%PDF-' (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    return { valid: false, error: "Invalid file signature. The uploaded file is not a genuine, readable PDF document." };
  }
  return { valid: true };
}
