const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const statements = [
    `CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_REUPLOAD')`,
    `CREATE TYPE "ProjectVerificationState" AS ENUM ('DRAFT', 'DOCUMENTS_REQUIRED', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'APPROVED', 'REJECTED')`,
    `CREATE TABLE "ProjectDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE TABLE "ProjectVerification" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "ProjectVerificationState" NOT NULL DEFAULT 'DRAFT',
    "score" INTEGER,
    "riskLevel" "RiskLevel",
    "findings" TEXT,
    "adminComments" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectVerification_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX "ProjectVerification_projectId_key" ON "ProjectVerification"("projectId")`,
    `ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CarbonProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    `ALTER TABLE "ProjectVerification" ADD CONSTRAINT "ProjectVerification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CarbonProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE`
  ];

  for (const s of statements) {
    console.log("Executing:", s.substring(0, 50));
    try {
      await p.$executeRawUnsafe(s);
    } catch (e) {
      console.log("Error:", e.message);
    }
  }
}
main().finally(() => p.$disconnect());
