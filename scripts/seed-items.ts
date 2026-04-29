/**
 * Seed the AuctionItems DynamoDB table with placeholder items.
 *
 * Usage:
 *   AUCTION_ITEMS_TABLE=eagles-auction-items \
 *   AWS_PROFILE=eagles-autism-project \
 *   npm run seed
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
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
    name: "Eagles Game Sideline Passes (2)",
    description:
      "Two sideline passes for a 2026 home game at the Linc. Watch warmups from the field.",
    imageUrl:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200",
    startingBid: 750,
  },
  {
    name: "Signed Jalen Hurts Jersey",
    description:
      "Authentic Eagles home jersey, hand-signed by QB1. Comes with COA.",
    imageUrl:
      "https://images.unsplash.com/photo-1580836953495-fdf3a2935ce5?w=1200",
    startingBid: 500,
  },
  {
    name: "Phillies vs. Mets — 4 Field Box Seats",
    description:
      "Four field-level box seats to a 2026 Phillies vs. Mets game at Citizens Bank Park.",
    imageUrl:
      "https://images.unsplash.com/photo-1606925207923-c70148434b8a?w=1200",
    startingBid: 400,
  },
  {
    name: "Private Dinner for 6 at McCloskey's",
    description:
      "Reserve the back room at McCloskey's for an evening of dinner and drinks for six.",
    imageUrl:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200",
    startingBid: 600,
  },
  {
    name: "Wine Country Weekend (2 nights)",
    description:
      "Two nights for two in Sonoma, including a private vineyard tour and tasting.",
    imageUrl:
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200",
    startingBid: 1200,
  },
  {
    name: "Ardmore Music Hall — VIP Concert Package",
    description:
      "Two VIP tickets to a future show at the Ardmore Music Hall, plus a meet & greet.",
    imageUrl:
      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200",
    startingBid: 250,
  },
  {
    name: "76ers Lower Bowl (4 tickets)",
    description:
      "Four lower bowl seats to a 2026-27 regular season Sixers game at the Wells Fargo Center.",
    imageUrl:
      "https://images.unsplash.com/photo-1518085250887-2f903c200fee?w=1200",
    startingBid: 350,
  },
  {
    name: "Custom Suit at Boyds Philadelphia",
    description:
      "A bespoke fitting and made-to-measure suit at Boyds, the iconic Philly menswear store.",
    imageUrl:
      "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=1200",
    startingBid: 800,
  },
  {
    name: "Helicopter Tour of Philadelphia",
    description:
      "Private helicopter tour for two over the Philadelphia skyline at sunset.",
    imageUrl:
      "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=1200",
    startingBid: 500,
  },
  {
    name: "Signed Eagles Mini Helmet",
    description:
      "Mini helmet signed by a current Eagles starter. Includes display case + COA.",
    imageUrl:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200",
    startingBid: 200,
  },
  {
    name: "Golf Foursome at Aronimink",
    description:
      "A round of golf for four at one of the Philadelphia area's most iconic clubs.",
    imageUrl:
      "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200",
    startingBid: 1500,
  },
  {
    name: "Eagles Autism Foundation 5K — Team Sponsorship",
    description:
      "Sponsor a team at the next EAF 5K, including custom team shirts and a tent.",
    imageUrl:
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200",
    startingBid: 300,
  },
];

async function main() {
  let inserted = 0;
  for (const item of items) {
    const itemId = item.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          itemId,
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          startingBid: item.startingBid,
          currentBid: item.startingBid,
          currentBidderId: null,
          currentBidderName: null,
          endsAt: ENDS_AT,
          bidCount: 0,
        },
      }),
    );
    inserted++;
    console.log(`  ✓ ${itemId}`);
  }
  console.log(`\nSeeded ${inserted} items into ${tableName}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
