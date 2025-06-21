/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createGameServerProcess = /* GraphQL */ `
  mutation CreateGameServerProcess(
    $input: CreateGameServerProcessInput!
    $condition: ModelGameServerProcessConditionInput
  ) {
    createGameServerProcess(input: $input, condition: $condition) {
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
export const updateGameServerProcess = /* GraphQL */ `
  mutation UpdateGameServerProcess(
    $input: UpdateGameServerProcessInput!
    $condition: ModelGameServerProcessConditionInput
  ) {
    updateGameServerProcess(input: $input, condition: $condition) {
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
export const deleteGameServerProcess = /* GraphQL */ `
  mutation DeleteGameServerProcess(
    $input: DeleteGameServerProcessInput!
    $condition: ModelGameServerProcessConditionInput
  ) {
    deleteGameServerProcess(input: $input, condition: $condition) {
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
