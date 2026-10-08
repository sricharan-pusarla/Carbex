-- ============================================================
-- 01. APPLICATION LAYER (Prisma Schema Tables)
-- ============================================================

CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'BUYER', -- 'BUYER', 'SELLER', 'ADMIN'
    "organization" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CarbonProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "developerId" TEXT NOT NULL REFERENCES "User"("id"),
    "projectType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "verificationStandard" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalCredits" INTEGER NOT NULL,
    "availableCredits" INTEGER NOT NULL,
    "pricePerCredit" DOUBLE PRECISION NOT NULL,
    "projectStartDate" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

CREATE TABLE "ProjectDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL REFERENCES "CarbonProject"("id"),
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING'
);

CREATE TABLE "Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL REFERENCES "CarbonProject"("id"),
    "sellerId" TEXT NOT NULL REFERENCES "User"("id"),
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerId" TEXT NOT NULL REFERENCES "User"("id"),
    "sellerId" TEXT NOT NULL REFERENCES "User"("id"),
    "listingId" TEXT REFERENCES "Listing"("id"),
    "projectId" TEXT NOT NULL REFERENCES "CarbonProject"("id"),
    "quantity" INTEGER NOT NULL,
    "pricePerCredit" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
