# Setup guide — Eagles Autism Foundation auction

End-to-end checklist to take this repo from a fresh clone to a live, deployed site at `https://<branch>.<appid>.amplifyapp.com`.

> **Event date:** Saturday, May 2 2026, 7 PM at McCloskey's, Ardmore.
> Bid close is hardcoded to `2026-05-03T04:00:00Z` (midnight ET after the event). Adjust in `scripts/seed-items.ts` if needed.

---

## 0. Prerequisites

- AWS CLI configured with the `eagles-autism-project` profile (account `694062402257`, AdministratorAccess).
  Verify: `aws sts get-caller-identity --profile eagles-autism-project`
- Node.js 22+
- A GitHub account with write access to `https://github.com/crubido93/eagles-autism-event-bidding-platform`

---

## 1. Push the code

The repo on GitHub is empty. From this directory:

```bash
git init
git branch -M main
git remote add origin https://github.com/crubido93/eagles-autism-event-bidding-platform.git
git add .
git commit -m "Initial commit: Next.js auction app + CDK infra + GitHub Actions"
git push -u origin main
```

(Don't worry — `.env*` files are gitignored.)

---

## 2. Install deps

```bash
# App
npm install

# Infra
cd infra && npm install && cd ..
```

---

## 3. Bootstrap CDK in your AWS account (one-time)

```bash
cd infra
AWS_PROFILE=eagles-autism-project npx cdk bootstrap aws://694062402257/us-east-1
cd ..
```

---

## 4. Deploy the AWS stack (Cognito + AppSync + DynamoDB)

```bash
cd infra
AWS_PROFILE=eagles-autism-project npm run deploy
cd ..
```

When it finishes you'll see outputs like:

```
EaglesAuctionStack.UserPoolId        = us-east-1_xxxxxxxxx
EaglesAuctionStack.UserPoolClientId  = xxxxxxxxxxxxxxxxxxxxxxxxxx
EaglesAuctionStack.GraphQLUrl        = https://xxxxxxxxx.appsync-api.us-east-1.amazonaws.com/graphql
EaglesAuctionStack.GraphQLRegion     = us-east-1
EaglesAuctionStack.ItemsTableName    = eagles-auction-items
```

Copy those values — you'll paste them in the next two steps.

---

## 5. Create your local `.env.local`

```bash
cp .env.example .env.local
```

Edit `.env.local` and paste the CDK outputs:

```
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<UserPoolId>
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=<UserPoolClientId>
NEXT_PUBLIC_APPSYNC_URL=<GraphQLUrl>
NEXT_PUBLIC_APPSYNC_REGION=us-east-1

AWS_PROFILE=eagles-autism-project
AUCTION_ITEMS_TABLE=eagles-auction-items
```

Then:

```bash
npm run dev
```

Visit `http://localhost:3000`, sign up, confirm the email code, log in, view the auction.

---

## 6. Seed the auction with placeholder items

```bash
AUCTION_ITEMS_TABLE=eagles-auction-items \
AWS_PROFILE=eagles-autism-project \
npm run seed
```

You should see 12 items appear at `/auction`.

---

## 7. Connect Amplify Hosting (one-time, in AWS console)

> Amplify Hosting is the simplest way to host a Next.js SSR app on AWS. Connecting via the console is the path of least resistance — fully automated builds + previews.

1. AWS Console → **Amplify** → **Create new app** → **Host web app**
2. Source: **GitHub** → authorize → select repo `eagles-autism-event-bidding-platform` and branch `main`
3. App name: `eagles-auction`
4. Amplify auto-detects Next.js and uses the `amplify.yml` in this repo
5. Expand **Advanced settings** → **Environment variables** and add:
   - `NEXT_PUBLIC_AWS_REGION` = `us-east-1`
   - `NEXT_PUBLIC_COGNITO_USER_POOL_ID` = (from step 4 output)
   - `NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID` = (from step 4 output)
   - `NEXT_PUBLIC_APPSYNC_URL` = (from step 4 output)
   - `NEXT_PUBLIC_APPSYNC_REGION` = `us-east-1`
6. Click **Save and deploy**
7. Note the **App ID** (looks like `dXXXXXXXXXXXXX`) and the **branch name** (`main`) — you'll need them for the deploy workflow

The first build takes ~3 min. Once green, you'll get a URL like `https://main.dXXXXXXXXXXXXX.amplifyapp.com`.

---

## 8. Set up GitHub Actions OIDC (so CI/CD can deploy without long-lived keys)

Run the bootstrap script:

```bash
AWS_PROFILE=eagles-autism-project ./scripts/bootstrap-oidc.sh
```

It prints something like:

```
Role ARN:    arn:aws:iam::694062402257:role/EaglesAuctionGitHubActionsDeployRole
Region:      us-east-1
```

---

## 9. Add GitHub repo secrets

In GitHub → repo **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret name             | Value                                                                     |
| ----------------------- | ------------------------------------------------------------------------- |
| `AWS_DEPLOY_ROLE_ARN`   | The role ARN from step 8                                                  |
| `AWS_REGION`            | `us-east-1`                                                               |
| `AMPLIFY_APP_ID`        | The App ID from step 7 (e.g. `dXXXXXXXXXXXXX`)                            |
| `AMPLIFY_BRANCH`        | `main`                                                                    |

That's it. From now on:

- **Open a PR** → CI runs lint + typecheck + build + `cdk synth`
- **Merge to `main`** → Deploy workflow assumes the OIDC role, runs `cdk deploy`, then triggers an Amplify build

---

## 10. Sign up as the first user

Visit your live URL → **Sign up** → use a real email → confirm with the code. You're now a regular Cognito user. Bidding works end-to-end.

---

## Architecture at a glance

```
┌──────────────┐    JWT     ┌──────────────┐
│  Next.js     │──────────▶│   Cognito    │
│  (Amplify    │            │   User Pool  │
│   Hosting)   │            └──────────────┘
│              │
│              │  GraphQL   ┌──────────────┐    VTL    ┌──────────────┐
│              │──────────▶│   AppSync    │──────────▶│  DynamoDB    │
│              │ ◀ subs ── │              │           │  (Items)     │
└──────────────┘            └──────────────┘           └──────────────┘
       ▲
       │ OIDC
       │
┌──────────────┐
│ GitHub       │
│ Actions      │
└──────────────┘
```

- **Real-time outbid notifications** are AppSync GraphQL subscriptions — every connected client gets a `BidEvent` push the moment a `placeBid` mutation succeeds.
- **No race conditions on simultaneous bids** — the resolver's DynamoDB conditional expression rejects bids ≤ current bid or after `endsAt`.
- **No long-lived AWS keys in GitHub** — federated auth via the OIDC provider.

---

## Day-of-event runbook

- The bidding cutoff is `endsAt` on each item (currently `2026-05-03T04:00:00Z`). The UI flips to "Bidding closed" / "🏆 You won!" automatically when the timer expires.
- To extend bidding live: open DynamoDB console → `eagles-auction-items` → edit each item's `endsAt` to a later ISO timestamp.
- To add an item live: copy a record in the DynamoDB console, change `itemId`, `name`, `imageUrl`, `startingBid`, set `currentBid = startingBid`, `bidCount = 0`, `currentBidderId = null`, `currentBidderName = null`.
- Sign-out: top right of `/auction`.

---

## Cleanup (after the event)

```bash
cd infra
AWS_PROFILE=eagles-autism-project npm run destroy
```

Then delete the Amplify app in the console.
