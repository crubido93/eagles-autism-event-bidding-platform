/**
 * Seed the AuctionItems DynamoDB table with the real items from the McCloskey's
 * EAF event PowerPoint. Wipes any existing rows first so re-running is idempotent.
 *
 * Usage:
 *   AUCTION_ITEMS_TABLE=eagles-auction-items \
 *   AWS_PROFILE=eagles-autism-project \
 *   npm run seed
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";

const tableName = process.env.AUCTION_ITEMS_TABLE;
if (!tableName) {
  console.error("AUCTION_ITEMS_TABLE env var is required.");
  process.exit(1);
}

const profile = process.env.AWS_PROFILE ?? "eagles-autism-project";
const region = process.env.AWS_REGION ?? "us-east-1";

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region,
    credentials: fromIni({ profile }),
  }),
);

// Bidding closes at midnight after event night (May 3 2026 00:00 ET → 04:00 UTC).
const ENDS_AT = "2026-05-03T04:00:00.000Z";

const items = [
  {
    itemId: "devonta-smith-autographed-jersey",
    name: "Authentic DeVonta Smith Autographed Jersey",
    description:
      "DeVonta Smith autographed #6 Kelly Green Jersey with Certificate of Authenticity. Estimated value $400.",
    imageUrl: "/items/01-devonta-smith-jersey.jpeg",
    startingBid: 100,
    estimatedValue: 400,
  },
  {
    itemId: "jalen-hurts-sb-lix-wood-sign",
    name: "Authentic Jalen Hurts Autographed Memorabilia",
    description:
      "Jalen Hurts autographed Super Bowl LIX Wood Sign with Certificate of Authenticity. Limited time memorabilia. Estimated value $400.",
    imageUrl: "/items/02-jalen-hurts-sb-sign.png",
    startingBid: 100,
    estimatedValue: 400,
  },
  {
    itemId: "jalen-hurts-autographed-jersey",
    name: "Authentic Jalen Hurts Autographed Jersey",
    description:
      "Jalen Hurts autographed Midnight Green Super Bowl LIX jersey with Certificate of Authenticity. Estimated value $700.",
    imageUrl: "/items/03-jalen-hurts-jersey.png",
    startingBid: 200,
    estimatedValue: 700,
  },
  {
    itemId: "super-bowl-lix-action-photos",
    name: "Super Bowl LIX Action Photos (Autographed Set of 4)",
    description:
      "Autographed framed Super Bowl LIX action photos (set of 4) featuring Cooper DeJean, DeVonta Smith, AJ Brown, and Zach Baun, with Certificate of Authenticity. Estimated value $550.",
    imageUrl: "/items/04-sb-action-photos.png",
    startingBid: 100,
    estimatedValue: 550,
  },
  {
    itemId: "private-training-camp-experience",
    name: "Private Training Camp Experience for 4",
    description:
      "You and four guests will attend a private practice at Jefferson Health Training Complex (formerly NovaCare). Watch practice up close. Date to be mutually agreed upon. Estimated value: priceless.",
    imageUrl: "/items/05-training-camp.png",
    startingBid: 200,
    estimatedValue: null,
  },
  {
    itemId: "eagle-tunnel-experience-preseason",
    name: "Eagles Tunnel Experience + 4 Preseason Tickets",
    description:
      "You and three guests will line the Eagles home tunnel and watch the players take the field before the game. Package includes four lower-level tickets to the preseason game. Estimated value: priceless.",
    imageUrl: "/items/06-tunnel-experience.png",
    startingBid: 400,
    estimatedValue: null,
  },
  {
    itemId: "eagle-pregame-flag-experience",
    name: "Eagles Pregame Flag Experience + 4 Preseason Tickets",
    description:
      "You and three guests will hold the giant American flag on the field during the national anthem. Package includes four lower-level preseason tickets. Estimated value: priceless.",
    imageUrl: "/items/07-flag-experience.png",
    startingBid: 400,
    estimatedValue: null,
  },
  {
    itemId: "morgan-wallen-aug-1-2026",
    name: "Morgan Wallen Concert — 4 Tickets, Aug 1 2026",
    description:
      "See country music star Morgan Wallen at Lincoln Financial Field up close from the 8th row on the field. Winner receives 4 tickets in F4 row 8 plus 4 club access passes for the club lounge before, during, or after the show. Estimated value $3,000.",
    imageUrl: "/items/08-morgan-wallen.png",
    startingBid: 800,
    estimatedValue: 3000,
  },
  {
    itemId: "bruno-mars-sept-2-2026",
    name: "Bruno Mars Concert — 4 Tickets, Sept 2 2026",
    description:
      "See pop music star Bruno Mars at Lincoln Financial Field up close from the 10th row on the field. Winner receives 4 tickets in F4 row 10 plus 4 club access passes for the club lounge before, during, or after the show. Estimated value $1,600.",
    imageUrl: "/items/09-bruno-mars.png",
    startingBid: 400,
    estimatedValue: 1600,
  },
  {
    itemId: "shane-gillis-jul-17-2026",
    name: "Shane Gillis Comedy Show — 4 Tickets, Jul 17 2026",
    description:
      "See comedy superstar Shane Gillis set the record for the largest American comedy show as he plays a sold-out Lincoln Financial Field with many special guests and surprises. Winner receives 4 tickets in the 5th row to watch Shane and his friends up close. Estimated value $800.",
    imageUrl: "/items/10-shane-gillis.png",
    startingBid: 200,
    estimatedValue: 800,
  },
];

async function clearTable() {
  let cleared = 0;
  let lastKey: Record<string, unknown> | undefined;
  do {
    const scan = await client.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: lastKey,
        ProjectionExpression: "itemId",
      }),
    );
    for (const row of scan.Items ?? []) {
      await client.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { itemId: row.itemId },
        }),
      );
      cleared++;
    }
    lastKey = scan.LastEvaluatedKey;
  } while (lastKey);
  if (cleared > 0) console.log(`  Cleared ${cleared} existing item(s)`);
}

async function main() {
  console.log(`Seeding ${tableName} (region ${region}, profile ${profile})…`);
  await clearTable();
  let inserted = 0;
  for (const item of items) {
    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          itemId: item.itemId,
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          startingBid: item.startingBid,
          currentBid: item.startingBid,
          currentBidderId: null,
          currentBidderName: null,
          endsAt: ENDS_AT,
          bidCount: 0,
          estimatedValue: item.estimatedValue,
        },
      }),
    );
    inserted++;
    console.log(`  ✓ ${item.itemId}`);
  }
  console.log(`\nSeeded ${inserted} items into ${tableName}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
