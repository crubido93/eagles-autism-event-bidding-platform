#!/usr/bin/env bash
# Creates a GitHub Actions OIDC provider in your AWS account and an IAM
# role that GitHub Actions can assume from the eagles-autism-event-bidding-platform repo.
#
# Run once:
#   AWS_PROFILE=eagles-autism-project ./scripts/bootstrap-oidc.sh
#
# Outputs the role ARN. Add it as the GitHub repo secret AWS_DEPLOY_ROLE_ARN.

set -euo pipefail

PROFILE="${AWS_PROFILE:-eagles-autism-project}"
GITHUB_OWNER="${GITHUB_OWNER:-crubido93}"
GITHUB_REPO="${GITHUB_REPO:-eagles-autism-event-bidding-platform}"
ROLE_NAME="${ROLE_NAME:-EaglesAuctionGitHubActionsDeployRole}"
REGION="${AWS_REGION:-us-east-1}"

ACCOUNT_ID="$(aws sts get-caller-identity --profile "$PROFILE" --query Account --output text)"
echo "Account: $ACCOUNT_ID  |  Repo: $GITHUB_OWNER/$GITHUB_REPO"

# 1. OIDC provider (idempotent)
PROVIDER_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
if aws iam get-open-id-connect-provider --profile "$PROFILE" \
    --open-id-connect-provider-arn "$PROVIDER_ARN" >/dev/null 2>&1; then
  echo "✓ OIDC provider already exists"
else
  echo "Creating OIDC provider..."
  aws iam create-open-id-connect-provider \
    --profile "$PROFILE" \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 >/dev/null
  echo "✓ OIDC provider created"
fi

# 2. Trust policy — locked to this repo, any branch
TRUST_POLICY="$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Federated": "$PROVIDER_ARN" },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_OWNER}/${GITHUB_REPO}:*"
        }
      }
    }
  ]
}
JSON
)"

# 3. Role (idempotent — update trust policy if it exists)
if aws iam get-role --profile "$PROFILE" --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  echo "Role ${ROLE_NAME} exists, updating trust policy..."
  aws iam update-assume-role-policy --profile "$PROFILE" \
    --role-name "$ROLE_NAME" \
    --policy-document "$TRUST_POLICY"
else
  echo "Creating role ${ROLE_NAME}..."
  aws iam create-role --profile "$PROFILE" \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --description "Assumed by GitHub Actions from $GITHUB_OWNER/$GITHUB_REPO to deploy CDK + Amplify" >/dev/null
fi

# 4. Permissions — broad enough for CDK bootstrap, deploy, and Amplify trigger.
# In a hardened production setup you'd scope this down.
aws iam attach-role-policy --profile "$PROFILE" --role-name "$ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
echo
echo "──────────────────────────────────────────────────────────────"
echo " ✅ OIDC role ready"
echo "──────────────────────────────────────────────────────────────"
echo "Role ARN:    $ROLE_ARN"
echo "Region:      $REGION"
echo
echo "Add these as GitHub repo secrets:"
echo "  AWS_DEPLOY_ROLE_ARN = $ROLE_ARN"
echo "  AWS_REGION          = $REGION"
echo
echo "Then push to main to trigger the deploy workflow."
