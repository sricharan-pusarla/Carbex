# Carbex Database Map

This document outlines the hybrid database architecture for Carbex. The system relies on both an Application Layer (managed by Prisma) and an Immutable Ledger Layer (managed by native PostgreSQL).

## Application Layer (Prisma)
These tables manage the rapid UI state, authentication, and project verification lifecycle.
- **`User`**: Created during registration. Read during login/auth. Updated when profiles change.
- **`CarbonProject`**: Created by Sellers. Read heavily on the marketplace. Updated by Admins during verification.
- **`ProjectDocument`**: Created by Sellers during submission. Read by Admins during verification.
- **`Listing`**: Created automatically via Server Actions when a project is APPROVED. Read on the marketplace.

## Immutable Ledger Layer (PostgreSQL Native)
These tables bypass Prisma for raw cryptographic security and mathematical constraints.
- **`registry`**: Created upon project approval. Maps a project to the ledger.
- **`credit_range`**: Created upon project approval (`MINT`). Updated (`status = RETIRED`) or split/inserted during marketplace transactions (`TRANSFER`). Enforced by GiST Exclusion Constraint.
- **`ledger_event`**: Inserted during any financial event. Cannot be updated or deleted due to `ON UPDATE OR DELETE` triggers. Read for the audit trail.

## Views Layer
These bridge the gap between the complex cryptographic ledger and the frontend UI.
- **`CreditOwnership` VIEW**: Reads from `credit_range`. Aggregates active serial numbers. Read by Buyer Dashboard.
- **`Retirement` VIEW**: Reads from `credit_range`. Aggregates retired serial numbers. Read by Buyer Certificates page.
