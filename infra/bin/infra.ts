#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { EaglesAuctionStack } from "../lib/eagles-auction-stack";

const app = new cdk.App();

new EaglesAuctionStack(app, "EaglesAuctionStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
  description:
    "Eagles Autism Foundation auction: Cognito User Pool + AppSync GraphQL API + DynamoDB",
});
