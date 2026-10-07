# Carbex - Trusted Carbon Credit Marketplace

Carbex is a high-performance, tamper-evident carbon credit marketplace designed for transparency and trust. It replaces legacy integer-based ownership counters with an immutable PostgreSQL `int8range` ledger to mathematically eliminate double-counting and overselling.

## 1. Complete Feature List
- **Tamper-Evident Range Ledger**: Cryptographic hash chaining enforced via strict PostgreSQL triggers and GiST exclusion constraints.
- **Marketplace & Discovery**: Advanced search and filtering by project type, location, and price.
- **Carbon Trust Score**: Deterministic multi-factor credibility scoring engine (Verification, Documentation, Additionality, Provenance, Double-Counting).
- **Simulated Purchasing Flow**: End-to-end atomic purchases mapped directly to the raw PostgreSQL ledger via PL/pgSQL functions (`transfer_credits`).
- **Credit Retirement**: Irreversible retirement of ranges via PL/pgSQL (`retire_credits`) with downloadable certificate generation.
- **Role-Based Dashboards**: Distinct views for Buyers (Portfolio & Certificates), Sellers (Project submission & Sales), and Admins (Verification pipeline).
- **Market Intelligence**: Aggregated market statistics, trends, and pricing insights.
- **AI Recommender**: Deterministic matching engine tailored for specific buyer requirements.

## 2. Technology Stack
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui, Lucide Icons, Recharts.
- **Backend**: Next.js Server Actions, NextAuth (bcrypt).
- **Database**: PostgreSQL (Neon), Prisma ORM (used for UI schemas), raw PL/pgSQL (used for immutable ledger).

## 3. Database Schema Summary
- **User**: Stores Buyers, Sellers, and Admins.
- **CarbonProject**: Project metadata, price, verification status.
- **registry**: The root container for a project's credits.
- **credit_range**: Stores ownership using PostgreSQL `int8range` (e.g. `[100, 500)`). Uses GiST `&&` exclusion to physically prevent double-counting.
- **ledger_event**: Append-only log with SHA-256 hash chains.
- **CreditOwnership / Retirement**: Virtual PostgreSQL `VIEW`s that map the underlying `credit_range` ledger backward-compatibly to Prisma queries for the UI.

## 4. API / Routes Summary
- `/`: Landing page
- `/marketplace`: Discovery and filtering
- `/projects/[id]`: Project details and purchase component
- `/dashboard`: Buyer portfolio
- `/seller`: Seller dashboard (create project, view sales)
- `/admin`: Admin verification pipeline
- `/retire/[id]`: Credit retirement
- `/market-intelligence`: Aggregated charts
- `/recommender`: Deterministic recommendation engine

## 5. How to Run Locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## 6. Environment Variables Required
Create a `.env` file at the root:
```env
# Your Neon Database URL (must support pg_crypto and btree_gist extensions)
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
# NextAuth Secret
NEXTAUTH_SECRET="your_secure_random_string"
NEXTAUTH_URL="http://localhost:3000"
```

## 7. Database Migration / Seed Instructions
```bash
# Since the ledger uses raw SQL and triggers unsupported by Prisma:
npx prisma migrate dev --create-only
npx tsx scripts/step1-apply.ts
npx tsx scripts/step2-apply.ts
npx tsx scripts/step3-apply.ts
npx tsx scripts/step4-apply.ts
# Seed the database
npm run db:seed
```

## 8. Deployment Instructions
1. Push to GitHub.
2. Import project in Vercel.
3. Add `DATABASE_URL` and `NEXTAUTH_SECRET` to Vercel Environment Variables.
4. Set Build Command to `npx prisma generate && npm run build`.
5. Deploy.

## 9. Demo Credentials
All users share the password: `demo1234`
- **Buyer**: arjun@example.com (Arjun Mehta)
- **Seller**: sarah@ecotech.com (Sarah Jenkins)
- **Admin**: admin@carbex.com (Platform Admin)

## 10. Known Limitations
- The "Trust Score" is a deterministic mockup; real-world implementation requires integration with external rating agencies (e.g., Sylvera, BeZero) or complex on-chain oracles.
- The "Purchase" flow does not actually process real fiat currency (Stripe integration is mocked).
- The Recommender is deterministic (regex/keywords) rather than a true semantic RAG/LLM.

## 11. Suggested Future Improvements
- Implement Stripe Connect for multi-party fiat settlement.
- Add Web3 interoperability (bridging the `credit_range` ledger to a public blockchain like Polygon for external verification).
- Enhance the Recommender using a vector database (e.g., Pinecone) and OpenAI embeddings.
