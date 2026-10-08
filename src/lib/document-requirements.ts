export type DocumentRequirement = {
  id: string;
  name: string;
  isRequired: boolean;
};

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
