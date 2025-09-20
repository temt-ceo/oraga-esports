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

export const save = async function (id, add, remove) {
  console.log(id, add, remove);
  const txId = await mutate({
    cadence: `
      import "CookStocker"

      transaction(id: String, add: [String], remove: [String]) {
        prepare(signer: &Account) {
          CookStocker.setCookStockerInfo(id: id, add: add, remove: remove)
        }
        execute {
          log("success")
        }
      }
    `,
    args: (arg, t) => [
      arg(id.toString(), t.String),
      arg(add, t.Array(t.String)),
      arg(remove, t.Array(t.String)),
    ],
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });
  console.log(txId);
  return txId;
};

export const removeInfo = async function (id) {
  const txId = await mutate({
    cadence: `
      import "CookStocker"

      transaction(id: String) {
        prepare(signer: &Account) {
          CookStocker.deleteCookStockerInfo(id: id)
        }
        execute {
          log("success")
        }
      }
    `,
    args: (arg, t) => [arg(id.toString(), t.String)],
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });
  console.log(txId);
  return txId;
};

export const saveSellerData = async function (id, add, addAmount, remove) {
  console.log(id, add, addAmount, remove);
  const txId = await mutate({
    cadence: `
      import "VegeSeller"

      transaction(id: String, add: [String], addAmount: [UInt8], remove: [String]) {
        prepare(signer: &Account) {
          VegeSeller.setVegeSellerInfo(id: id, add: add, addAmount: addAmount, remove: remove)
        }
        execute {
          log("success")
        }
      }
    `,
    args: (arg, t) => [
      arg(id.toString(), t.String),
      arg(add, t.Array(t.String)),
      arg(addAmount, t.Array(t.UInt8)),
      arg(remove, t.Array(t.String)),
    ],
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });
  console.log(txId);
  return txId;
};

export const buyVege = async function (id, buy, price) {
  const txId = await mutate({
    cadence: `
      import "VegeSeller"
      import "FlowToken"
      import "FungibleToken"

      transaction(id: String, buy: [String], price: UFix64) {
        prepare(signer: auth(BorrowValue) &Account) {
          let payment <- signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)!.withdraw(amount: price) as! @FlowToken.Vault
          VegeSeller.buyVege(id: id, amount: <- payment, buy: buy)
        }
        execute {
          log("success")
        }
      }
    `,
    args: (arg, t) => [
      arg(id.toString(), t.String),
      arg(buy, t.Array(t.String)),
      arg(price, t.UFix64),
    ],
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });
  console.log(txId);
  return txId;
};

export const setDriverInfo = async function (driverId, keys, values) {
  const txId = await mutate({
    cadence: `
      import "RideShare"
      import "FlowToken"
      import "FungibleToken"

      transaction(driverId: UInt, keys: [String], values: [String]) {
        prepare(signer: auth(BorrowValue) &Account) {
          let FlowTokenReceiver = signer.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)

          RideShare.setDriverInfo(driverId: driverId, keys: keys, values: values, flow_vault_receiver: FlowTokenReceiver)
        }
        execute {
          log("success")
        }
      }
    `,
    args: (arg, t) => [
      arg(driverId || 0, t.UInt),
      arg(keys, t.Array(t.String)),
      arg(values, t.Array(t.String)),
    ],
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });
  console.log(txId);
  return txId;
};

export const newOrder = async function (
  execDateTime,
  driverId,
  start,
  goal,
  price
) {
  const txId = await mutate({
    cadence: `
      import "RideShare"
      import "FlowToken"
      import "FungibleToken"

      transaction(execTime: UFix64, driverId: UInt, start: String, goal: String, price: UFix64) {
        prepare(signer: auth(BorrowValue) &Account) {
          let payment <- signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)!.withdraw(amount: price) as! @FlowToken.Vault
          RideShare.newOrder(payment: <- payment, execTime: execTime, driverId: driverId, start: start, goal: goal)
        }
        execute {
          log("success")
        }
      }
    `,
    args: (arg, t) => [
      arg(new Date(execDateTime).getTime() / 1000 + 0.0001, t.UFix64), // 少数でないとエラーになるので1ミリ秒を足す(Cadenceでは秒以下は少数)
      arg(driverId, t.UInt),
      arg(start, t.String),
      arg(goal, t.String),
      arg(Math.floor(price * 1000) / 1000, t.UFix64), // 少数でないとエラーになるが長すぎてもエラーになるので少数を特定桁数までとしている
    ],
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });
  console.log(txId);
  return txId;
};

export const fixBug = async function (driverId) {
  const txId = await mutate({
    cadence: `
      import "RideShare"

      transaction(driverId: UInt) {
        prepare(signer: auth(BorrowValue) &Account) {
          RideShare.fixBug(driverId: driverId)
        }
        execute {
          log("success")
        }
      }
    `,
    args: (arg, t) => [arg(driverId, t.UInt)],
    proposer: authz,
    payer: authz,
    authorizations: [authz],
    limit: 999,
  });
  console.log(txId);
  return txId;
};
