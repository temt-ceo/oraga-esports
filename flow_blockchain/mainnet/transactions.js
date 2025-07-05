import { mutate, authz } from "@onflow/fcl";

export const createGamer = async function (nickname) {
  const txId = await mutate({
    cadence: `
      import "OragaESports"
      import "FlowToken"
      import "FungibleToken"

      transaction(nickname: String) {
        prepare(signer: auth(Storage, Capabilities) &Account) {
          let FlowTokenReceiver = signer.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)

          signer.storage.save(<- OragaESports.createGamer(nickname: nickname, flow_vault_receiver: FlowTokenReceiver), to: /storage/OragaESportsGamer)
          let cap = signer.capabilities.storage.issue<&OragaESports.Gamer>(/storage/OragaESportsGamer)
          signer.capabilities.publish(cap, at: /public/OragaESportsGamer)
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
      import "OragaESports"
      import "FlowToken"
      import "FungibleToken"

      transaction() {
        prepare(signer: auth(BorrowValue) &Account) {
          let payment <- signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)!.withdraw(amount: 1.1) as! @FlowToken.Vault

          let gamer = signer.storage.borrow<&OragaESports.Gamer>(from: /storage/OragaESportsGamer)
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

export const tipping = async function (amount) {
  const txId = await mutate({
    cadence: `
      import "OragaESports"
      import "FlowToken"
      import "FungibleToken"

      transaction(amount: UFix64) {
        prepare(signer: auth(BorrowValue) &Account) {
          pre {
            amount == 1.0 || amount == 5.0: "tip is not 1.0FLOW or 5.0FLOW."
          }
          let tip <- signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)!.withdraw(amount: amount) as! @FlowToken.Vault

          let gamer = signer.storage.borrow<&OragaESports.Gamer>(from: /storage/OragaESportsGamer)
              ?? panic("Could not borrow reference to the Owner's Gamer Resource.")
          gamer.tipping(tip: <- tip)
        }
        execute {
          log("success")
        }
      }
    `,
    args: (arg, t) => [arg(amount, t.UFix64)],
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });
  console.log(txId);
  return txId;
};
