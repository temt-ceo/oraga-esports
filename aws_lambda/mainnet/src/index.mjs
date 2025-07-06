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
    }

    return {
      id: new Date().getTime(),
      type: input.type || "",
      message: `${input.message} , txId: ${txId}`,
      playerId: gamerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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
