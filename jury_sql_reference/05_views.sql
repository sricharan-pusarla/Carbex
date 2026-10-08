-- ============================================================
-- 05. DATABASE VIEWS
-- Bridges the Immutable Ledger Layer to the Prisma Application Layer
-- ============================================================

DROP TABLE IF EXISTS "CreditOwnership" CASCADE;
DROP TABLE IF EXISTS "Retirement" CASCADE;

-- 1. Create CreditOwnership View (For the Buyer Dashboard)
CREATE OR REPLACE VIEW "CreditOwnership" AS
SELECT 
    md5(owner_id || "projectId" || 'AVAILABLE')::uuid::text as "id", 
    owner_id as "userId", 
    "projectId", 
    SUM(upper(serial_range) - lower(serial_range))::int as "quantity",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "credit_range" 
JOIN "registry" ON "registry"."id" = "credit_range"."registry_id"
WHERE "status" = 'AVAILABLE'
GROUP BY owner_id, "projectId";

-- 2. Create Retirement View (For the Certificates Page)
CREATE OR REPLACE VIEW "Retirement" AS
SELECT 
    md5(owner_id || "projectId" || 'RETIRED')::uuid::text as "id",
    owner_id as "userId",
    "projectId",
    SUM(upper(serial_range) - lower(serial_range))::int as "quantity",
    'Retired via immutable ledger' as "reason",
    'CRB-RET-' || to_char(NOW(), 'YYYY') || '-' || substr(md5(owner_id || "projectId"), 1, 6) as "certificateId",
    NOW() as "retiredAt"
FROM "credit_range"
JOIN "registry" ON "registry"."id" = "credit_range"."registry_id"
WHERE "status" = 'RETIRED'
GROUP BY owner_id, "projectId";
