/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getGameServerProcess = /* GraphQL */ `
  query GetGameServerProcess($id: ID!) {
    getGameServerProcess(id: $id) {
      id
      type
      message
      playerId
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listGameServerProcesses = /* GraphQL */ `
  query ListGameServerProcesses(
    $filter: ModelGameServerProcessFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGameServerProcesses(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        type
        message
        playerId
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
