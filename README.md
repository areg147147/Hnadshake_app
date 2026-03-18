# Handshake MVP

Handshake is a micro-contract app where two authenticated users negotiate terms in real time, then seal the agreement by simultaneously holding a button for 3 seconds.

After sealing:

- The contract is immutable at backend level.
- The receipt page is read-only forever.
- Negotiation history remains as an append-only audit log.

## Stack

- React + Vite + TypeScript
- Convex (real-time backend/database)
- Clerk (authentication)
- shadcn-style component architecture with Tailwind
- Vercel (deployment target)

## Core Features Implemented

- Create contract with initial terms
- Shareable contract URL
- Real-time negotiation thread and terms updates
- Append-only `negotiation_log` audit trail
- Two-party access control (creator + counterparty only for edits)
- Simultaneous hold-to-seal (server authoritative overlap detection)
- Permanent sealed receipt page

## Project Structure

```text
src/
  pages/
    Home.tsx
    Contract.tsx
    Sealed.tsx
  components/
    TermsEditor.tsx
    NegotiationLog.tsx
    SealButton.tsx
    ContractReceipt.tsx
convex/
  schema.ts
  contracts.ts
  negotiation.ts
  seal.ts
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill:

```bash
cp .env.example .env.local
```

Required values:

- `VITE_CONVEX_URL` - Convex deployment URL
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk frontend key
- `CLERK_JWT_ISSUER_DOMAIN` - Clerk JWT issuer domain for Convex auth

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create and connect a Convex deployment:

   ```bash
   npx convex dev
   ```

   This command sets `CONVEX_DEPLOYMENT`, deploys functions, and generates `convex/_generated/*`.

3. Run frontend:

   ```bash
   npm run dev
   ```

4. Open app at `http://localhost:5173`.

## How sealing works

1. Participant A starts hold (`seal_intent` row created/updated with server timestamp).
2. Participant B starts hold.
3. While either is holding, client calls `evaluateSeal` frequently.
4. Backend computes overlap:
   - `overlapStart = max(holdStartedAtA, holdStartedAtB)`
   - `overlapMs = now - overlapStart`
5. Contract seals only if overlap reaches 3 seconds (with bounded jitter tolerance).
6. Any early release removes that user's hold intent and cancels the attempt.

## Immutability guarantees

- All edit/seal mutations check contract status.
- If contract is `sealed`, terms and participants cannot be mutated.
- `negotiation_log` is append-only (no update/delete functions exposed).

## Demo script (judge flow)

1. Open app in two browsers (or one normal + one incognito).
2. Sign in with two different Clerk accounts.
3. User A creates a contract and shares URL.
4. User B opens URL and joins as counterparty.
5. Both edit terms back and forth (watch live updates + log).
6. Both press and hold Seal button at the same time.
7. Observe automatic transition to sealed receipt page.
8. Confirm no further edits are possible.

## Deploy to Vercel

1. Push repository to GitHub.
2. Import project in Vercel.
3. Add environment variables in Vercel project settings:
   - `VITE_CONVEX_URL`
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `CLERK_JWT_ISSUER_DOMAIN`
4. Ensure Convex deployment is already created and deployed (`npx convex deploy`).
5. Trigger production deployment.

## Notes

- The committed `convex/_generated` files are local placeholders to keep TypeScript tooling functional before first Convex codegen.
- Run `npx convex dev` in a real environment to regenerate official Convex types.
