import fs from "node:fs";
import { config, sansPrefix, withPrefix, mutate, tx } from "@onflow/fcl";
import { SHA3 } from "sha3";
import pkg from "elliptic";
const { ec: EC } = pkg;
const ec = new EC("p256");

export const handler = async (event) => {
  console.log("Event", JSON.stringify(event, 3));
  const input = event.input || {};
  let gamerId = input.playerId ? parseInt(input.playerId) : 0;
  let message = input.message ? JSON.parse(input.message) : {};
  let transaction = "";

  if (input.type === "shooting_game_outcome") {
    transaction = `
      import OragaESports from 0xb576a3926d239682

      transaction(gamerId: UInt, outcome: Bool) {
        prepare(signer: auth(BorrowValue) &Account) {
          let admin = signer.storage.borrow<&OragaESports.Admin>(from: /storage/OragaESportsAdmin)
            ?? panic("Could not borrow reference to the Administrator Resource.")
          admin.shootingGameOutcome(gamerId: gamerId, outcome: outcome)
        }
        execute {
          log("success")
        }
      }
    `;
  } else if (input.type === "free_play") {
    transaction = `
      import OragaESports from 0xb576a3926d239682

      transaction(gamerId: UInt) {
        prepare(signer: auth(BorrowValue) &Account) {
          let admin = signer.storage.borrow<&OragaESports.Admin>(from: /storage/OragaESportsAdmin)
            ?? panic("Could not borrow reference to the Administrator Resource.")
          admin.useTipJarForFreePlay(gamerId: gamerId)
        }
        execute {
          log("success")
        }
      }
    `;
  } else if (input.type === "cook_stocker_save") {
    transaction = `
      import CookStocker from 0xb576a3926d239682

      transaction(id: String, add: [String], remove: [String]) {
        prepare(signer: &Account) {
          CookStocker.setCookStockerInfo(id: id, add: add, remove: remove)
        }
        execute {
          log("success")
        }
      }
    `;
  } else if (input.type === "cook_stocker_delete") {
    transaction = `
      import CookStocker from 0xb576a3926d239682

      transaction(id: String) {
        prepare(signer: &Account) {
          CookStocker.deleteCookStockerInfo(id: id)
        }
        execute {
          log("success")
        }
      }
    `;
  } else if (input.type === "vege_seller_save") {
    transaction = `
      import VegeSeller from 0xb576a3926d239682

      transaction(id: String, add: [String], addAmount: [UInt8], remove: [String]) {
        prepare(signer: &Account) {
          VegeSeller.setVegeSellerInfo(id: id, add: add, addAmount: addAmount, remove: remove)
        }
        execute {
          log("success")
        }
      }
    `;
  } else if (input.type === "ride_share_new_driver") {
    transaction = `
      import RideShare from 0xb576a3926d239682
      import FlowToken from 0x1654653399040a61
      import FungibleToken from 0xf233dcee88fe0abe

      transaction(driverId: UInt, driverAddress: Address, keys: [String], values: [String]) {
        prepare(signer: &Account) {
          let FlowTokenReceiver = getAccount(driverAddress)
            .capabilities
            .get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)

          RideShare.setDriverInfo(driverId: driverId, keys: keys, values: values, flow_vault_receiver: FlowTokenReceiver)
        }
        execute {
          log("success")
        }
      }
    `;
  } else if (input.type === "ride_share_complete") {
    transaction = `
      import RideShare from 0xb576a3926d239682

      transaction(driverId: UInt, wage: UFix64) {
        prepare(signer: auth(BorrowValue) &Account) {
          let RideShareAdmin = signer.storage.borrow<&RideShare.Admin>(from: /storage/RideShareAdmin)
            ?? panic("Could not borrow reference to the Administrator Resource.")
          RideShareAdmin.payWage(driverId: driverId, wage: wage)
        }
        execute {
          log("success")
        }
      }
    `;
  } else if (input.type === "ride_share_rating") {
    transaction = `
      import RideShare from 0xb576a3926d239682

      transaction(driverId: UInt, keys: [String], values: [String]) {
        prepare(signer: &Account) {
          RideShare.setDriverInfo(driverId: driverId, keys: keys, values: values, flow_vault_receiver: nil)
        }
        execute {
          log("success")
        }
      }
    `;
  } else if (input.type === "mmorpg_basic_attack") {
    // TeamPlayer1: mainPlayer, TeamPlayer2: buddyPlayer, resourceName: [Warrior, Thief, Enemy]
    transaction = `
      import MMORPG6 from 0xb576a3926d239682

      transaction(battleId: Int, target: String, resourceName: String) {
        prepare(signer: auth(BorrowValue) &Account) {
          let MMORPG6Admin = signer.storage.borrow<&MMORPG6.Admin>(from: /storage/MMORPG6Admin)
            ?? panic("Could not borrow reference to the Administrator Resource.")
          if (resourceName == "Enemy") {
            MMORPG6Admin.basicAttack(battleId: battleId, target: target, resourceName: resourceName)
          } else {
            MMORPG6Admin.basicAttack(battleId: battleId, target: nil, resourceName: resourceName)
          }
        }
        execute {
          log("success")
        }
      }
    `;
  } else if (input.type === "pay_reward_to_winner_of_mmorpg") {
    transaction = `
      import MMORPG6 from 0xb576a3926d239682

      transaction(recipient1: Address, recipient2: Address, reward: UFix64) {
        prepare(signer: auth(BorrowValue) &Account) {
          let MMORPG6Admin = signer.storage.borrow<&MMORPG6.Admin>(from: /storage/MMORPG6Admin)
            ?? panic("Could not borrow reference to the Administrator Resource.")
          MMORPG6Admin.payRewards(recipient1: recipient1, recipient2: recipient2, reward: reward)
        }
        execute {
          log("success")
        }
      }
    `;
  }

  config({
    "flow.network": "mainnet",
    "accessNode.api": "https://rest-mainnet.onflow.org",
  });

  let txId;
  try {
    var IT_KEY_ID = 0;
    if (fs.existsSync("/tmp/sequence.txt")) {
      IT_KEY_ID = parseInt(
        fs.readFileSync("/tmp/sequence.txt", { encoding: "utf8" })
      );
    } else {
      IT_KEY_ID = 50;
    }
    IT_KEY_ID = !IT_KEY_ID || IT_KEY_ID >= 50 ? 0 : IT_KEY_ID + 1;
    fs.writeFileSync("/tmp/sequence.txt", IT_KEY_ID.toString());
    console.log("IT_KEY_ID", IT_KEY_ID);

    const PRIVATE_KEY = fs.readFileSync("mainnet-account.pkey", "utf8");
    const ADDRESS = "0xb576a3926d239682";
    const KEY_ID = 0;

    const hash = (message) => {
      const sha = new SHA3(256);
      sha.update(Buffer.from(message, "hex"));
      return sha.digest();
    };

    const sign = (message) => {
      const key = ec.keyFromPrivate(Buffer.from(PRIVATE_KEY, "hex"));
      const sig = key.sign(hash(message)); // hashMsgHex -> hash
      const n = 32;
      const r = sig.r.toArrayLike(Buffer, "be", n);
      const s = sig.s.toArrayLike(Buffer, "be", n);
      return Buffer.concat([r, s]).toString("hex");
    };

    async function authFunction(account) {
      return {
        ...account,
        tempId: `${ADDRESS}-${KEY_ID}`,
        addr: sansPrefix(ADDRESS),
        keyId: Number(KEY_ID),
        signingFunction: async (signable) => {
          return {
            addr: withPrefix(ADDRESS),
            keyId: Number(KEY_ID),
            signature: sign(signable.message),
          };
        },
      };
    }
    async function authFunctionForProposer(account) {
      return {
        ...account,
        tempId: `${ADDRESS}-${IT_KEY_ID}`,
        addr: sansPrefix(ADDRESS),
        keyId: Number(IT_KEY_ID),
        signingFunction: async (signable) => {
          return {
            addr: withPrefix(ADDRESS),
            keyId: Number(IT_KEY_ID),
            signature: sign(signable.message),
          };
        },
      };
    }

    console.log("transaction", transaction, input);
    if (input.type === "shooting_game_outcome") {
      const outcome = message == "true" || message == true;
      txId = await mutate({
        cadence: transaction,
        args: (arg, t) => [arg(gamerId, t.UInt), arg(outcome, t.Bool)],
        proposer: authFunctionForProposer,
        payer: authFunction,
        authorizations: [authFunction],
        limit: 999,
      });
      console.log(`txId: ${txId}`);
      message = `Tx[shooting_game_outcome] is On Going.`;
      tx(txId).subscribe((res) => {
        console.log(res);
      });
    } else if (input.type === "free_play") {
      txId = await mutate({
        cadence: transaction,
        args: (arg, t) => [arg(gamerId, t.UInt)],
        proposer: authFunctionForProposer,
        payer: authFunction,
        authorizations: [authFunction],
        limit: 999,
      });
      console.log(`txId: ${txId}`);
      message = `Tx[free_play] is On Going.`;
      tx(txId).subscribe((res) => {
        console.log(res);
      });
    } else if (input.type === "cook_stocker_save") {
      txId = await mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(message.id.toString(), t.String),
          arg(message.add, t.Array(t.String)),
          arg(message.remove, t.Array(t.String)),
        ],
        proposer: authFunctionForProposer,
        payer: authFunction,
        authorizations: [authFunction],
        limit: 999,
      });
      console.log(`txId: ${txId}`);
      message = `Tx[cook_stocker_save] is On Going.`;
      tx(txId).subscribe((res) => {
        console.log(res);
      });
    } else if (input.type === "cook_stocker_delete") {
      txId = await mutate({
        cadence: transaction,
        args: (arg, t) => [arg(message.id.toString(), t.String)],
        proposer: authFunctionForProposer,
        payer: authFunction,
        authorizations: [authFunction],
        limit: 999,
      });
      console.log(`txId: ${txId}`);
      message = `Tx[cook_stocker_delete] is On Going.`;
      tx(txId).subscribe((res) => {
        console.log(res);
      });
    } else if (input.type === "vege_seller_save") {
      txId = await mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(message.id.toString(), t.String),
          arg(message.add, t.Array(t.String)),
          arg(message.addAmount, t.Array(t.UInt8)),
          arg([], t.Array(t.String)),
        ],
        proposer: authFunctionForProposer,
        payer: authFunction,
        authorizations: [authFunction],
        limit: 999,
      });
      console.log(`txId: ${txId}`);
      message = `Tx[vege_seller_save] is On Going.`;
      tx(txId).subscribe((res) => {
        console.log(res);
      });
    } else if (input.type === "ride_share_new_driver") {
      txId = await mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(message.driverId, t.UInt),
          arg(message.driverAddress, t.Address),
          arg(message.keys, t.Array(t.String)),
          arg(message.values, t.Array(t.String)),
        ],
        proposer: authFunctionForProposer,
        payer: authFunction,
        authorizations: [authFunction],
        limit: 999,
      });
      console.log(`txId: ${txId}`);
      message = `Tx[ride_share_new_driver] is On Going.`;
      tx(txId).subscribe((res) => {
        console.log(res);
      });
    } else if (input.type === "ride_share_complete") {
      txId = await mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(message.driverId, t.UInt),
          arg(message.wage, t.UFix64),
        ],
        proposer: authFunctionForProposer,
        payer: authFunction,
        authorizations: [authFunction],
        limit: 999,
      });
      console.log(`txId: ${txId}`);
      message = `Tx[ride_share_complete] is On Going.`;
      tx(txId).subscribe((res) => {
        console.log(res);
      });
    } else if (input.type === "ride_share_rating") {
      txId = await mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(message.driverId, t.UInt),
          arg(message.keys, t.Array(t.String)),
          arg(message.values, t.Array(t.String)),
        ],
        proposer: authFunctionForProposer,
        payer: authFunction,
        authorizations: [authFunction],
        limit: 999,
      });
      console.log(`txId: ${txId}`);
      message = `Tx[ride_share_complete] is On Going.`;
      tx(txId).subscribe((res) => {
        console.log(res);
      });
    } else if (input.type === "mmorpg_basic_attack") {
      txId = await mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(message.battleId, t.Int),
          arg(message.target, t.String),
          arg(message.resourceName, t.String),
        ],
        proposer: authFunctionForProposer,
        payer: authFunction,
        authorizations: [authFunction],
        limit: 999,
      });
      console.log(`txId: ${txId}`);
      message = `Tx[mmorpg_basic_attack] is On Going.`;
      tx(txId).subscribe((res) => {
        console.log(res);
      });
    } else if (input.type === "pay_reward_to_winner_of_mmorpg") {
      txId = await mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(message.recipient1, t.Address),
          arg(message.recipient2, t.Address),
          arg(message.reward, t.UFix64),
        ],
        proposer: authFunctionForProposer,
        payer: authFunction,
        authorizations: [authFunction],
        limit: 999,
      });
      console.log(`txId: ${txId}`);
      message = `Tx[pay_reward_to_winner_of_mmorpg] is On Going.`;
      tx(txId).subscribe((res) => {
        console.log(res);
      });
    }

    if (
      input.type === "call_friend_candidate" ||
      input.type === "accept_calling_friend" ||
      input.type === "battle_is_ready" ||
      input.type === "entered_the_game_world" ||
      input.type === "used_buddy_capability"
    ) {
      return {
        id: new Date().getTime(),
        type: input.type,
        message: input.message,
        playerId: gamerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      return {
        id: new Date().getTime(),
        type: input.type,
        message: `${input.message} , txId: ${txId}`,
        playerId: gamerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  } catch (error) {
    return {
      id: new Date().getTime(),
      type: "E:" + input.type,
      message: error.toString(),
      playerId: gamerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
};
