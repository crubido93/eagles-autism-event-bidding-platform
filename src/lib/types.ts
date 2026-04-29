export type AuctionItem = {
  itemId: string;
  name: string;
  description: string;
  imageUrl: string;
  startingBid: number;
  currentBid: number;
  currentBidderId: string | null;
  currentBidderName: string | null;
  endsAt: string; // ISO timestamp
  bidCount: number;
  estimatedValue: number | null;
};

export type Bid = {
  itemId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  createdAt: string;
};

export type Notification = {
  id: string;
  itemId: string;
  itemName: string;
  amount: number;
  createdAt: string;
  read: boolean;
};
