# Carbex Complete & Correct Entity-Relationship (ER) Diagram

This diagram represents the complete hybrid architecture of Carbex, including:
1. **Prisma Application Layer:** User management, Carbon Projects, Document Auditing, Listings, and Transactions.
2. **Real-Time Notification Layer:** Asynchronous Seller & Buyer alert dispatches.
3. **PostgreSQL Cryptographic Range Ledger:** Namespace Registries, `int8range` custody allocations (guarded by GiST exclusion constraints), and Append-Only SHA-256 Hash Chain logs.

---

## 1. Relational ER Diagram (Crow's Foot Notation)

```mermaid
erDiagram
    USER ||--o{ CARBON_PROJECT : "develops (1:N)"
    USER ||--o{ LISTING : "creates (1:N)"
    USER ||--o{ TRANSACTION : "executes as buyer (1:N)"
    USER ||--o{ TRANSACTION : "receives as seller (1:N)"
    USER ||--o{ NOTIFICATION : "receives (1:N)"
    USER ||--o{ CREDIT_RANGE : "owns (1:N)"
    USER ||--o{ LEDGER_EVENT : "transfers from/to (1:N)"

    CARBON_PROJECT ||--o{ PROJECT_DOCUMENT : "contains (1:N)"
    CARBON_PROJECT ||--o{ LISTING : "listed in (1:N)"
    CARBON_PROJECT ||--o{ TRANSACTION : "transacted in (1:N)"
    CARBON_PROJECT ||--|| REGISTRY : "tokenized into (1:1)"

    LISTING ||--o{ TRANSACTION : "settles (1:N)"

    TRANSACTION ||--o{ NOTIFICATION : "triggers (1:N)"

    REGISTRY ||--o{ CREDIT_RANGE : "allocates (1:N)"
    REGISTRY ||--o{ LEDGER_EVENT : "audits (1:N)"

    USER {
        string id PK "Surrogate UUID"
        string email UK "Unique Email Address"
        string name "User / Company Name"
        string passwordHash "Bcrypt Hash"
        string role "BUYER | SELLER | ADMIN"
        string organization "Organization Name"
        timestamp createdAt "Registration Timestamp"
    }

    CARBON_PROJECT {
        string id PK "Surrogate UUID"
        string developerId FK "Ref: User.id"
        string name "Project Title"
        string description "Project Narrative"
        string projectType "Reforestation, DAC, etc."
        string location "Geographic Region"
        string country "Sovereign Jurisdiction"
        string methodology "VM0007, etc."
        string verificationStandard "Verra VCS, Gold Standard"
        string verificationStatus "DRAFT | UNDER_REVIEW | VERIFIED | REJECTED"
        int totalCredits "Certified Lifetime Credits"
        int availableCredits "Remaining Unallocated"
        float pricePerCredit "Asking Price per Credit in USD"
        date projectStartDate "Crediting Period Start"
    }

    PROJECT_DOCUMENT {
        string id PK "Surrogate UUID"
        string projectId FK "Ref: CarbonProject.id"
        string type "SATELLITE_SURVEY | LAND_TITLE | AUDIT_REPORT"
        string fileUrl "Object Storage URI"
        string fileName "Original Client Filename"
        timestamp uploadedAt "Upload Timestamp"
        string status "PENDING | VALIDATED | FLAGGED"
    }

    LISTING {
        string id PK "Surrogate UUID"
        string projectId FK "Ref: CarbonProject.id"
        string sellerId FK "Ref: User.id"
        int quantity "Credits Offered for Sale"
        string status "ACTIVE | SOLD_OUT | CANCELLED"
        timestamp createdAt "Listing Creation Timestamp"
    }

    TRANSACTION {
        string id PK "Surrogate UUID"
        string buyerId FK "Ref: User.id"
        string sellerId FK "Ref: User.id"
        string listingId FK "Ref: Listing.id"
        string projectId FK "Ref: CarbonProject.id"
        int quantity "Transacted Volume"
        float pricePerCredit "Executed Unit Price"
        float totalAmount "quantity * pricePerCredit"
        string status "PENDING | COMPLETED | FAILED"
        timestamp createdAt "Settlement Timestamp"
    }

    NOTIFICATION {
        string id PK "Surrogate UUID"
        string recipientId FK "Ref: User.id"
        string transactionId FK "Ref: Transaction.id"
        string type "TRADE_EXECUTED | PROJECT_VERIFIED | CORRECTION_REQUIRED"
        string title "Short Alert Header"
        string message "Descriptive Alert Body"
        boolean isRead "Read Receipt Flag (DEFAULT FALSE)"
        timestamp createdAt "Dispatch Timestamp"
    }

    REGISTRY {
        string id PK "Surrogate UUID"
        string projectId FK "Ref: CarbonProject.id (UNIQUE)"
        string name "Registry Namespace Name"
        timestamp createdAt "Genesis Initialization Timestamp"
    }

    CREDIT_RANGE {
        string id PK "Surrogate UUID"
        string registry_id FK "Ref: registry.id"
        int8range serial_range "Continuous Bounds [lower, upper)"
        string owner_id FK "Ref: User.id"
        string status "AVAILABLE | RETIRED"
    }

    LEDGER_EVENT {
        string id PK "Surrogate UUID"
        string registry_id FK "Ref: registry.id"
        string event_type "ISSUE | TRANSFER | RETIRE"
        int8range serial_range "Affected Serial Range"
        string from_owner_id FK "Ref: User.id"
        string to_owner_id FK "Ref: User.id"
        int8 quantity "upper(serial_range) - lower(serial_range)"
        string prev_hash "Ancestor SHA-256 Hash Pointer"
        string hash "Current Block SHA-256 Digest"
        timestamp created_at "Nanosecond Audit Timestamp"
    }
```

---

## 2. Conceptual Chen Notation (Hand-Drawn Academic Layout)

For your handwritten record sheet, use this exact structural schema:

```
[ ENTITY ] = Rectangle
< RELATIONSHIP > = Diamond
( Attribute ) = Oval
(( Multivalued Attribute )) = Double Oval
( Derived Attribute ) = Dashed Oval
_Attribute_ = Underlined Primary Key

                 (name)      (_id_)       (email)
                   \           |           /
                 +---------------------------+
                 |           USER            |
                 +---------------------------+
                   | 1                   | 1
                   |                     |
             < Develops >           < Alerts >
                   | N                   | N
                   v                     v
+-----------------------------+   +-----------------------------+
|       CARBON_PROJECT        |   |        NOTIFICATION         |
| _id_, name, country, status |   | _id_, title, message, isRead|
+-----------------------------+   +-----------------------------+
   | 1             | 1                          ^
   |               |                            | N
< Tokenizes >  < Contains >                < Triggers >
   | 1             | N                          | 1
   v               v                            |
+----------+   +------------------+   +--------------------+
| REGISTRY |   | PROJECT_DOCUMENT |   |    TRANSACTION     |
| _id_     |   | _id_, type, url  |   | _id_, qty, (total) |
+----------+   +------------------+   +--------------------+
   | 1                                          ^
   +---------------+                            |
   | 1             | 1                          | M
< Allocates >   < Audits >                 < Settles >
   | N             | N                          | 1
   v               v                            v
+--------------+ +--------------+       +------------------+
| CREDIT_RANGE | | LEDGER_EVENT |       |     LISTING      |
| _id_, serial | | _id_, hash   |       | _id_, quantity   |
+--------------+ +--------------+       +------------------+
```

---

## 3. Structural Constraints Summary Table

| Relationship | Entities Involved | Cardinality Ratio | Participation Constraint | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Develops** | `User` $\to$ `CarbonProject` | $1:N$ | Partial for `User`, **Total** for `CarbonProject` | A Seller can develop multiple projects; each project must have a developer. |
| **Contains** | `CarbonProject` $\to$ `ProjectDocument` | $1:N$ | Partial for `CarbonProject`, **Total** for `ProjectDocument` | A project contains documents; documents cannot exist without a parent project (`CASCADE`). |
| **Tokenizes** | `CarbonProject` $\to$ `registry` | $1:1$ | **Total** for `CarbonProject`, **Total** for `registry` | Each verified project creates exactly one cryptographic ledger namespace. |
| **Allocates** | `registry` $\to$ `credit_range` | $1:N$ | **Total** for `registry`, **Total** for `credit_range` | A registry allocates its credit volume into discrete, non-overlapping serial intervals. |
| **Owns** | `User` $\to$ `credit_range` | $1:N$ | Partial for `User`, **Total** for `credit_range` | A user can hold zero or many ranges; each credit range must have an owner. |
| **Audits** | `registry` $\to$ `ledger_event` | $1:N$ | **Total** for `registry`, **Total** for `ledger_event` | Every event belongs to a registry and cannot be modified (Append-Only). |
| **Lists** | `CarbonProject` $\to$ `Listing` | $1:N$ | Partial for `CarbonProject`, **Total** for `Listing` | Projects are listed on the open marketplace with a specific quantity. |
| **Settles** | `Listing` $\to$ `Transaction` | $1:N$ | Partial for `Listing`, Partial for `Transaction` | Market listings are fulfilled by buyer purchase transactions. |
| **Triggers** | `Transaction` $\to$ `Notification` | $1:N$ | Partial for `Transaction`, **Total** for `Notification` | Executed transactions fire database triggers to alert the project developer. |
| **Alerts** | `User` $\to$ `Notification` | $1:N$ | Partial for `User`, **Total** for `Notification` | Alerts are directed to a recipient user. |
