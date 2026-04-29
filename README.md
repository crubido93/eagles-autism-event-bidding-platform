# Eagles Autism Foundation — Auction Platform

A Next.js bidding web app for the Eagles Autism Foundation fundraiser at McCloskey's, Ardmore (Saturday, May 2 2026, 7 PM).

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **AWS Cognito** for authentication
- **AWS AppSync** (GraphQL) + **DynamoDB** for items and bids, with real-time subscriptions for outbid notifications
- **AWS Amplify Hosting** for the Next.js SSR runtime
- **AWS CDK** for infrastructure-as-code
- **GitHub Actions** + **OIDC** for CI/CD (no long-lived AWS keys)

## Quick start

See **[SETUP.md](./SETUP.md)** for the full step-by-step.

```bash
npm install
cp .env.example .env.local
# fill in the CDK outputs in .env.local
npm run dev
```

## Project layout

```
.
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── login/, signup/, confirm/
│   │   └── auction/            # Auth-gated bidding portal
│   ├── components/             # AuthGate, AuctionPortal, ItemDetail, etc.
│   └── lib/                    # Amplify config, GraphQL strings, types
├── infra/                      # CDK app: Cognito + AppSync + DynamoDB
│   ├── bin/infra.ts
│   └── lib/
│       ├── eagles-auction-stack.ts
│       └── schema.graphql
├── scripts/
│   ├── seed-items.ts           # Populate DynamoDB with placeholder items
│   └── bootstrap-oidc.sh       # One-time IAM/OIDC setup for GitHub Actions
├── .github/workflows/          # ci.yml + deploy.yml
└── amplify.yml                 # Amplify Hosting build spec
```

## Bidding mechanics

- Items have `startingBid`, `currentBid`, `endsAt`, plus name/description/image
- Bids must be ≥ `currentBid + $5` (configurable in `ItemDetail.tsx`)
- DynamoDB conditional expression on the placeBid resolver prevents races: simultaneous bids serialize, and only the higher amount wins
- After the resolver succeeds, all subscribed clients receive a `BidEvent` push — the previous high bidder gets a notification on the bell icon

## Donation

100% of proceeds go to the Eagles Autism Foundation. Donate directly: [fundraisers.eaglesautismfoundation.org/jimmer-mccafferty-6](https://fundraisers.eaglesautismfoundation.org/jimmer-mccafferty-6)
