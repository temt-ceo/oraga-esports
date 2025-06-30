import { query } from "@onflow/fcl";

export const getBalance = async function (address) {
  const result = await query({
    cadence: `
    import "FlowToken"
    import "FungibleToken"

    access(all) fun main(address: Address): UFix64 {
      let vaultRef = getAccount(address).capabilities
          .borrow<&FlowToken.Vault>(/public/flowTokenBalance)
        ?? panic("Something wrong happened.")
      return vaultRef.balance
    }
    `,
    args: (arg, t) => [arg(address, t.Address)],
  });
  return result;
};

export const isRegistered = async function (address) {
  const result = await query({
    cadence: `
    import "TestnetTest3"

    access(all) fun main(address: Address): &TestnetTest3.Gamer? {
        return getAccount(address).capabilities.get<&TestnetTest3.Gamer>(/public/TestnetTest3Gamer).borrow()
    }
    `,
    args: (arg, t) => [arg(address, t.Address)],
  });
  return result;
};

export const getGamersInfo = async function () {
  const result = await query({
    cadence: `
    import "TestnetTest3"

    access(all) fun main(): TestnetTest3.GamersInfo {
      return TestnetTest3.getGamersInfo()
    }
    `,
  });
  return result;
};
