-- ============================================================
-- Replace CreditOwnership and Retirement tables with VIEWs
-- so the legacy Prisma dashboard queries still work seamlessly!
-- ============================================================

-- 1. Drop the old tables
DROP TABLE IF EXISTS "CreditOwnership" CASCADE;
DROP TABLE IF EXISTS "Retirement" CASCADE;

-- 2. Create CreditOwnership View
CREATE OR REPLACE VIEW "CreditOwnership" AS
SELECT 
    md5(owner_id || "projectId" || 'AVAILABLE')::text as "id", 
    owner_id as "userId", 
    "projectId", 
    SUM(upper(serial_range) - lower(serial_range))::int as "quantity",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "credit_range" 
JOIN "registry" ON "registry"."id" = "credit_range"."registry_id"
WHERE "status" = 'AVAILABLE'
GROUP BY owner_id, "projectId";

-- 3. Create Retirement View
CREATE OR REPLACE VIEW "Retirement" AS
SELECT 
    md5(owner_id || "projectId" || 'RETIRED')::text as "id",
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
