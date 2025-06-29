import { mutate, authz } from "@onflow/fcl";

export const createGamer = async function (nickname) {
  const txId = await mutate({
    cadence: `
      import "TestnetTest2"
      import "FlowToken"
      import "FungibleToken"

      transaction(nickname: String) {
        prepare(signer: auth(Storage, Capabilities) &Account) {
          let FlowTokenReceiver = signer.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)

          signer.storage.save(<- TestnetTest2.createGamer(nickname: nickname, flow_vault_receiver: FlowTokenReceiver), to: /storage/TestnetTest2Gamer)
          let cap = signer.capabilities.storage.issue<&TestnetTest2.Gamer>(/storage/TestnetTest2Gamer)
          signer.capabilities.publish(cap, at: /public/TestnetTest2Gamer)
        }
        execute {
          log("success")
        }
      }
    `,
    args: (arg, t) => [arg(nickname, t.String)],
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });
  console.log("transaction sent.");
  console.log(txId);
  return txId;
};

export const insertCoin = async function () {
  const txId = await mutate({
    cadence: `
      import "TestnetTest2"
      import "FlowToken"
      import "FungibleToken"

      transaction() {
        prepare(signer: auth(BorrowValue) &Account) {
          let payment <- signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)!.withdraw(amount: 1.1) as! @FlowToken.Vault

          let gamer = signer.storage.borrow<&TestnetTest2.Gamer>(from: /storage/TestnetTest2Gamer)
              ?? panic("Could not borrow reference to the Owner's Gamer Resource.")
          gamer.insert_coin(payment: <- payment)
        }
        execute {
          log("success")
        }
      }
    `,
    args: (arg, t) => [],
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });
  console.log(txId);
  return txId;
};
