export const queries = {
  listItems: /* GraphQL */ `
    query ListItems {
      listItems {
        itemId
        name
        description
        imageUrl
        startingBid
        currentBid
        currentBidderId
        currentBidderName
        endsAt
        bidCount
        estimatedValue
      }
    }
  `,
  getItem: /* GraphQL */ `
    query GetItem($itemId: ID!) {
      getItem(itemId: $itemId) {
        itemId
        name
        description
        imageUrl
        startingBid
        currentBid
        currentBidderId
        currentBidderName
        endsAt
        bidCount
        estimatedValue
      }
    }
  `,
};

export const mutations = {
  placeBid: /* GraphQL */ `
    mutation PlaceBid($itemId: ID!, $amount: Float!, $bidderName: String) {
      placeBid(itemId: $itemId, amount: $amount, bidderName: $bidderName) {
        itemId
        currentBid
        currentBidderId
        currentBidderName
        bidCount
      }
    }
  `,
};

export const subscriptions = {
  onBidPlaced: /* GraphQL */ `
    subscription OnBidPlaced {
      onBidPlaced {
        itemId
        currentBid
        currentBidderId
        currentBidderName
        bidCount
      }
    }
  `,
};
