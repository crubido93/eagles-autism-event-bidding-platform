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
      }
    }
  `,
};

export const mutations = {
  placeBid: /* GraphQL */ `
    mutation PlaceBid($itemId: ID!, $amount: Float!) {
      placeBid(itemId: $itemId, amount: $amount) {
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
