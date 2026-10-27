const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("================================================================================");
    console.log(" BCSE302L DATABASE SYSTEMS - CARBEX LIVE QUERY EXECUTION OUTPUT");
    console.log(" Timestamp:", new Date().toISOString());
    console.log("================================================================================\n");

    // 1. Database Table Inspection (Row Counts)
    console.log(">>> [QUERY 1] DATABASE RELATIONS & ACTIVE RECORD COUNTS:");
    const [users, projects, listings, transactions, ranges] = await Promise.all([
        prisma.user.count(),
        prisma.carbonProject.count(),
        prisma.listing.count(),
        prisma.transaction.count(),
        prisma.$queryRawUnsafe('SELECT COUNT(*)::int as count FROM credit_range')
    ]);

    console.table([
        { Table: 'User', Type: 'Relational Entity', Rows: users, Purpose: 'RBAC & Auth Credentials' },
        { Table: 'CarbonProject', Type: 'Relational Entity', Rows: projects, Purpose: 'Environmental Project Metadata' },
        { Table: 'Listing', Type: 'Relational Entity', Rows: listings, Purpose: 'Active Marketplace Inventory' },
        { Table: 'Transaction', Type: 'Financial Ledger', Rows: transactions, Purpose: 'Order Settlement History' },
        { Table: 'credit_range', Type: 'Cryptographic Ledger', Rows: ranges[0].count, Purpose: 'int8range Serial Allocation' }
    ]);

    // 2. Multi-Table Join
    console.log("\n>>> [QUERY 2] MULTI-TABLE JOIN: TRANSACTIONS WITH BUYER, SELLER & PROJECT DETAILS:");
    const trades = await prisma.$queryRawUnsafe(`
        SELECT 
            t.id AS "Tx ID",
            p.name AS "Project Name",
            buyer.name AS "Buyer",
            seller.name AS "Seller",
            t.quantity AS "Credits",
            CONCAT('$', t."totalAmount"::numeric(10,2)) AS "Total Amount",
            t.status AS "Status"
        FROM "Transaction" t
        JOIN "CarbonProject" p ON t."projectId" = p.id
        JOIN "User" buyer ON t."buyerId" = buyer.id
        JOIN "User" seller ON t."sellerId" = seller.id
        ORDER BY t."createdAt" DESC
        LIMIT 5;
    `);
    console.table(trades);

    // 3. Aggregate Function & Grouping
    console.log("\n>>> [QUERY 3] AGGREGATE FUNCTIONS: TOTAL TRADING VOLUME & AVERAGE PRICE PER PROJECT:");
    const analytics = await prisma.$queryRawUnsafe(`
        SELECT 
            p.name AS "Project Name",
            p."projectType" AS "Type",
            COUNT(t.id)::int AS "Total Trades",
            COALESCE(SUM(t.quantity), 0)::int AS "Total Credits Sold",
            CONCAT('$', ROUND(AVG(t."pricePerCredit")::numeric, 2)) AS "Avg Price",
            CONCAT('$', COALESCE(SUM(t."totalAmount"), 0)::numeric(10,2)) AS "Gross Turnover"
        FROM "CarbonProject" p
        LEFT JOIN "Transaction" t ON p.id = t."projectId"
        GROUP BY p.id, p.name, p."projectType"
        LIMIT 5;
    `);
    console.table(analytics);

    // 4. Advanced Feature: PostgreSQL Range Ledger Inspection
    console.log("\n>>> [QUERY 4] ADVANCED POSTGRESQL FEATURE: int8range SERIAL LEDGER & GIST CONSTRAINTS:");
    const rangeData = await prisma.$queryRawUnsafe(`
        SELECT 
            cr.id AS "Range ID",
            r.name AS "Registry Name",
            cr.serial_range::text AS "Serial Interval [Lower, Upper)",
            (upper(cr.serial_range) - lower(cr.serial_range))::int AS "Quantity",
            u.name AS "Current Owner",
            cr.status AS "Asset Status"
        FROM credit_range cr
        JOIN registry r ON cr.registry_id = r.id
        JOIN "User" u ON cr.owner_id = u.id
        ORDER BY lower(cr.serial_range) ASC
        LIMIT 5;
    `);
    console.table(rangeData);

    console.log("\n================================================================================");
    console.log(" STATUS: ALL QUERIES EXECUTED SUCCESSFULLY WITH ZERO DATABASE ERRORS.");
    console.log("================================================================================\n");
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
