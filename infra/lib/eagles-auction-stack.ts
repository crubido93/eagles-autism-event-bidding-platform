import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as path from "path";

export class EaglesAuctionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ────────────────────────────────────────────────────────────────────
    // Cognito
    // ────────────────────────────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "eagles-auction-users",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
        fullname: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = userPool.addClient("WebClient", {
      userPoolClientName: "eagles-auction-web",
      generateSecret: false,
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      preventUserExistenceErrors: true,
    });

    // ────────────────────────────────────────────────────────────────────
    // DynamoDB
    // ────────────────────────────────────────────────────────────────────
    const itemsTable = new dynamodb.Table(this, "ItemsTable", {
      tableName: "eagles-auction-items",
      partitionKey: { name: "itemId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const bidsTable = new dynamodb.Table(this, "BidsTable", {
      tableName: "eagles-auction-bids",
      partitionKey: { name: "itemId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ────────────────────────────────────────────────────────────────────
    // AppSync
    // ────────────────────────────────────────────────────────────────────
    const api = new appsync.GraphqlApi(this, "Api", {
      name: "eagles-auction-api",
      definition: appsync.Definition.fromFile(
        path.join(__dirname, "schema.graphql"),
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool,
            defaultAction: appsync.UserPoolDefaultAction.ALLOW,
          },
        },
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ERROR,
        retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      },
      xrayEnabled: false,
    });

    const itemsDS = api.addDynamoDbDataSource("ItemsDS", itemsTable);
    const bidsDS = api.addDynamoDbDataSource("BidsDS", bidsTable);

    // Query.listItems → Scan
    itemsDS.createResolver("ListItemsResolver", {
      typeName: "Query",
      fieldName: "listItems",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        { "version": "2018-05-29", "operation": "Scan" }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `$util.toJson($ctx.result.items)`,
      ),
    });

    // Query.getItem → GetItem
    itemsDS.createResolver("GetItemResolver", {
      typeName: "Query",
      fieldName: "getItem",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2018-05-29",
          "operation": "GetItem",
          "key": {
            "itemId": $util.dynamodb.toDynamoDBJson($ctx.args.itemId)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `$util.toJson($ctx.result)`,
      ),
    });

    // Mutation.placeBid → conditional UpdateItem on items table.
    // Fails the bid if amount <= currentBid OR if endsAt has passed.
    // Atomic via DDB conditional expression — no race on simultaneous bids.
    itemsDS.createResolver("PlaceBidResolver", {
      typeName: "Mutation",
      fieldName: "placeBid",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
#set($amount = $ctx.args.amount)
#set($itemId = $ctx.args.itemId)
#set($userId = $ctx.identity.sub)
#set($argName = $ctx.args.bidderName)
#set($claimName = $ctx.identity.claims.get("name"))
#set($claimEmail = $ctx.identity.claims.get("email"))
#if(!$util.isNullOrEmpty($argName))
  #set($userName = $argName)
#elseif(!$util.isNullOrEmpty($claimName))
  #set($userName = $claimName)
#elseif(!$util.isNullOrEmpty($claimEmail))
  #set($userName = $claimEmail.split("@")[0])
#else
  #set($userName = "Anonymous")
#end
#set($now = $util.time.nowISO8601())
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "itemId": $util.dynamodb.toDynamoDBJson($itemId)
  },
  "update": {
    "expression": "SET currentBid = :amount, currentBidderId = :userId, currentBidderName = :userName, bidCount = if_not_exists(bidCount, :zero) + :one, lastBidAt = :now",
    "expressionValues": {
      ":amount": $util.dynamodb.toDynamoDBJson($amount),
      ":userId": $util.dynamodb.toDynamoDBJson($userId),
      ":userName": $util.dynamodb.toDynamoDBJson($userName),
      ":one": $util.dynamodb.toDynamoDBJson(1),
      ":zero": $util.dynamodb.toDynamoDBJson(0),
      ":now": $util.dynamodb.toDynamoDBJson($now),
      ":startingBid": $util.dynamodb.toDynamoDBJson($amount)
    }
  },
  "condition": {
    "expression": "attribute_exists(itemId) AND endsAt > :now AND ((attribute_not_exists(currentBid) AND :startingBid >= startingBid) OR currentBid < :amount)",
    "expressionValues": {
      ":now": $util.dynamodb.toDynamoDBJson($now),
      ":amount": $util.dynamodb.toDynamoDBJson($amount),
      ":startingBid": $util.dynamodb.toDynamoDBJson($amount)
    }
  }
}
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
#if($ctx.error)
  #if($ctx.error.type == "DynamoDB:ConditionalCheckFailedException")
    $util.error("Bid rejected: too low or auction ended", "BidRejected")
  #else
    $util.error($ctx.error.message, $ctx.error.type)
  #end
#end
{
  "itemId": "$ctx.result.itemId",
  "currentBid": $ctx.result.currentBid,
  "currentBidderId": "$ctx.result.currentBidderId",
  "currentBidderName": "$ctx.result.currentBidderName",
  "bidCount": $ctx.result.bidCount
}
      `),
    });

    // Pipeline: also append to BidsTable for history.
    // Done as a 2nd resolver function chained via a Pipeline isn't strictly
    // necessary for the demo — keeping bids in items table is enough for
    // the UI. If you need bid history, add a Pipeline resolver later.
    void bidsDS;

    // ────────────────────────────────────────────────────────────────────
    // Outputs (consumed by .env / Amplify Hosting env vars)
    // ────────────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "GraphQLUrl", { value: api.graphqlUrl });
    new cdk.CfnOutput(this, "GraphQLRegion", { value: this.region });
    new cdk.CfnOutput(this, "ItemsTableName", { value: itemsTable.tableName });
    new cdk.CfnOutput(this, "BidsTableName", { value: bidsTable.tableName });
  }
}
