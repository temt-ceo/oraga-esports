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
